import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { deploymentQueue } from '../services/deploymentQueue';

export const webhooksRouter = Router();

// Verify GitHub Webhook Signature using HMAC-SHA256
export function verifyGitHubSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!rawBody || !signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSig = signatureHeader.slice(7);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(digest, 'hex'));
  } catch (e) {
    return false;
  }
}

// Helper: Extract all changed files in push event
function getChangedFilesFromPayload(payload: any): string[] {
  const fileSet = new Set<string>();

  if (payload.head_commit) {
    (payload.head_commit.added || []).forEach((f: string) => fileSet.add(f));
    (payload.head_commit.modified || []).forEach((f: string) => fileSet.add(f));
    (payload.head_commit.removed || []).forEach((f: string) => fileSet.add(f));
  }

  if (Array.isArray(payload.commits)) {
    for (const c of payload.commits) {
      (c.added || []).forEach((f: string) => fileSet.add(f));
      (c.modified || []).forEach((f: string) => fileSet.add(f));
      (c.removed || []).forEach((f: string) => fileSet.add(f));
    }
  }

  return Array.from(fileSet);
}

// Core Webhook Handler
const handleGitHubWebhook = async (req: any, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    // 1. Handle ping event
    if (event === 'ping') {
      return res.status(200).json({ success: true, message: 'GitHub Webhook ping received successfully' });
    }

    if (event && event !== 'push') {
      return res.status(200).json({ success: true, message: `Ignored event: ${event}` });
    }

    if (!payload || !payload.repository) {
      return res.status(400).json({ error: 'Invalid webhook payload: Missing repository data' });
    }

    const owner = payload.repository.owner?.login || payload.repository.owner?.name;
    const repo = payload.repository.name;
    const repoFullName = `${owner}/${repo}`.toLowerCase();
    const repoCloneUrl = payload.repository.clone_url || `https://github.com/${owner}/${repo}`;
    const rawRef = payload.ref || 'refs/heads/main';
    const branch = rawRef.replace('refs/heads/', '');
    const commitSha = payload.after || payload.head_commit?.id || 'HEAD';
    const commitMessage = payload.head_commit?.message || 'Update via GitHub push';
    const commitAuthor = payload.head_commit?.author?.name || payload.pusher?.name || 'GitHub Developer';
    const changedFiles = getChangedFilesFromPayload(payload);

    // 2. Find matching GitRepository or Module
    let gitRepo = await prisma.gitRepository.findFirst({
      where: {
        OR: [
          { owner: { equals: owner }, repo: { equals: repo } },
          { repositoryUrl: { contains: repoFullName } },
        ],
      },
      include: { module: true },
    });

    let mod = gitRepo?.module;

    // Fallback: Check Module table directly
    if (!mod) {
      mod = await prisma.module.findFirst({
        where: {
          OR: [
            { githubOwner: { equals: owner }, githubRepo: { equals: repo } },
            { githubUrl: { contains: repoFullName } },
            { repositoryUrl: { contains: repoFullName } },
          ],
        },
        include: { gitRepo: true },
      }) as any;
      if (mod && (mod as any).gitRepo) {
        gitRepo = (mod as any).gitRepo;
      }
    }

    if (!mod) {
      return res.status(404).json({
        error: `No ModuleForge module found matching GitHub repository "${owner}/${repo}". Please connect the repository in ModuleForge first.`,
      });
    }

    // 3. Signature verification
    const secret = gitRepo?.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET || 'moduleforge_webhook_secret';
    if (signature) {
      const isValid = verifyGitHubSignature(req.rawBody, signature, secret);
      if (!isValid) {
        console.warn(`[Webhook] Signature verification failed for repository ${owner}/${repo}`);
        return res.status(401).json({ error: 'Invalid GitHub webhook signature' });
      }
    }

    // 4. Branch check
    const expectedBranch = gitRepo?.connectedBranch || mod.githubBranch || mod.defaultBranch || 'main';
    if (branch !== expectedBranch) {
      return res.status(200).json({
        success: true,
        message: `Ignored push to branch "${branch}". Connected branch is "${expectedBranch}".`,
      });
    }

    // 5. Avoid duplicate active / successful deployments for exact commit
    const existingDeployment = await prisma.deployment.findFirst({
      where: {
        moduleId: mod.id,
        commitSha,
        status: { in: ['SUCCESS', 'CLONING', 'INSTALLING', 'VALIDATING', 'BUILDING', 'DEPLOYING'] },
      },
    });

    if (existingDeployment) {
      if (existingDeployment.status === 'SUCCESS') {
        return res.status(200).json({
          success: true,
          message: `Commit ${commitSha.slice(0, 7)} is already deployed successfully on version ${existingDeployment.targetVersion || 'current'}.`,
          deploymentId: existingDeployment.id,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: `Deployment already in progress for commit ${commitSha.slice(0, 7)}.`,
          deploymentId: existingDeployment.id,
        });
      }
    }

    // 6. Create Deployment Record & Enqueue
    const deployment = await prisma.deployment.create({
      data: {
        moduleId: mod.id,
        gitRepositoryId: gitRepo?.id,
        commitSha,
        commitMessage,
        author: commitAuthor,
        branch,
        status: 'PENDING',
        triggerSource: 'webhook',
        changedFiles: JSON.stringify(changedFiles),
      },
    });

    // Enqueue background deployment
    await deploymentQueue.enqueue(deployment.id);

    console.log(`[Webhook] Queued deployment ${deployment.id} for module "${mod.name}" commit ${commitSha.slice(0, 7)}`);

    // Return 202 Accepted immediately
    return res.status(202).json({
      success: true,
      message: `Deployment queued for module "${mod.name}" from commit ${commitSha.slice(0, 7)}`,
      deploymentId: deployment.id,
      moduleId: mod.id,
      commitSha,
      branch,
    });
  } catch (err: any) {
    console.error('[Webhook] Error processing GitHub webhook:', err);
    return res.status(500).json({ error: 'Internal server error while processing webhook', details: err.message });
  }
};

// Route definitions
webhooksRouter.post('/github', handleGitHubWebhook);
webhooksRouter.post('/', handleGitHubWebhook);
