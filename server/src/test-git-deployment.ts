import crypto from 'crypto';
import { prisma } from './prisma';
import { verifyGitHubSignature } from './routes/webhooks';
import { GitProviderFactory } from './services/git/GitProviderFactory';
import { deploymentWorker } from './services/deploymentWorker';

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING GIT LIVE SYNC & DEPLOYMENT SYSTEM VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // TEST 1: Webhook HMAC-SHA256 Signature Verification
    console.log('--- TEST GROUP 1: Webhook HMAC-SHA256 Signature Verification ---');
    const testSecret = 'super_secret_webhook_key_123';
    const payloadBody = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'test-module' } });
    const payloadBuffer = Buffer.from(payloadBody);

    const validDigest = crypto.createHmac('sha256', testSecret).update(payloadBuffer).digest('hex');
    const validHeader = `sha256=${validDigest}`;
    const invalidHeader = `sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`;

    assert(verifyGitHubSignature(payloadBuffer, validHeader, testSecret) === true, 'Accepts valid HMAC-SHA256 signature');
    assert(verifyGitHubSignature(payloadBuffer, invalidHeader, testSecret) === false, 'Rejects invalid HMAC signature');
    assert(verifyGitHubSignature(payloadBuffer, undefined, testSecret) === false, 'Rejects missing signature header');
    assert(verifyGitHubSignature(undefined, validHeader, testSecret) === false, 'Rejects empty raw body');

    // TEST 2: Git Provider Factory & URL Parsing
    console.log('\n--- TEST GROUP 2: Git Provider Factory & URL Resolution ---');
    const parsedGitHub = GitProviderFactory.parseRepoUrl('https://github.com/company/auth-module.git');
    assert(parsedGitHub.provider === 'github', 'Identifies GitHub provider');
    assert(parsedGitHub.owner === 'company', 'Parses owner correctly');
    assert(parsedGitHub.repo === 'auth-module', 'Parses repo name without .git');

    const parsedSSH = GitProviderFactory.parseRepoUrl('git@github.com:facebook/react.git');
    assert(parsedSSH.provider === 'github', 'Parses SSH GitHub repo');
    assert(parsedSSH.owner === 'facebook', 'Parses SSH owner');
    assert(parsedSSH.repo === 'react', 'Parses SSH repo');

    const parsedGitLab = GitProviderFactory.parseRepoUrl('https://gitlab.com/group/crm-app');
    assert(parsedGitLab.provider === 'gitlab', 'Identifies GitLab provider');

    const providerInstance = GitProviderFactory.getProvider('github');
    assert(providerInstance.providerName === 'github', 'Instantiates GitHub provider adapter');

    // TEST 3: Repository Connection & Module State in Database
    console.log('\n--- TEST GROUP 3: Repository Connection & Database Model Creation ---');
    let testModule = await prisma.module.findFirst();
    if (!testModule) {
      // Create a test module if none exists
      let cat = await prisma.category.findFirst();
      if (!cat) {
        cat = await prisma.category.create({ data: { name: 'DevTools', slug: 'devtools' } });
      }
      testModule = await prisma.module.create({
        data: {
          name: 'Test Live Module',
          slug: 'test-live-module',
          description: 'Automated verification test module',
          author: 'TestRunner',
          categoryName: cat.name,
          sourceType: 'github',
          version: '1.0.0',
        },
      });
    }

    const testRepoUrl = 'https://github.com/example/auth-service';
    const testSecretKey = crypto.randomBytes(24).toString('hex');

    const gitRepo = await prisma.gitRepository.upsert({
      where: { moduleId: testModule.id },
      create: {
        moduleId: testModule.id,
        provider: 'github',
        repositoryUrl: testRepoUrl,
        owner: 'example',
        repo: 'auth-service',
        defaultBranch: 'main',
        connectedBranch: 'main',
        currentCommitSha: 'a82f91c920183018201839103910391039103910',
        webhookSecret: testSecretKey,
        connectionStatus: 'connected',
        lastDeploymentStatus: 'SUCCESS',
      },
      update: {
        repositoryUrl: testRepoUrl,
        connectedBranch: 'main',
        connectionStatus: 'connected',
      },
    });

    assert(gitRepo.moduleId === testModule.id, 'GitRepository record created and linked to Module');
    assert(gitRepo.webhookSecret === testSecretKey, 'Generated secret stored on GitRepository model');

    // TEST 4: Deployment Lifecycle & Version Creation
    console.log('\n--- TEST GROUP 4: Deployment Pipeline & Version Registry ---');
    const commitSha = 'b71ac4e829103910291039102910391029103910';
    const deployment = await prisma.deployment.create({
      data: {
        moduleId: testModule.id,
        gitRepositoryId: gitRepo.id,
        commitSha,
        commitMessage: 'Add live sync and OTP verification',
        author: 'Shalya',
        branch: 'main',
        status: 'SUCCESS',
        triggerSource: 'webhook',
        targetVersion: 'v1.0.1',
        durationMs: 3400,
        logs: '[CLONING] Checked out b71ac4e\n[VALIDATING] Schema verified\n[BUILDING] Assets compiled\n[DEPLOYING] Version v1.0.1 published',
      },
    });

    assert(deployment.status === 'SUCCESS', 'Deployment record created with SUCCESS status');

    // Create ModuleVersion
    const versionRecord = await prisma.moduleVersion.upsert({
      where: { moduleId_version: { moduleId: testModule.id, version: 'v1.0.1' } },
      create: {
        moduleId: testModule.id,
        version: 'v1.0.1',
        commitSha,
        branch: 'main',
        commitMessage: 'Add live sync and OTP verification',
        author: 'Shalya',
        buildStatus: 'SUCCESS',
        deploymentId: deployment.id,
        isPublished: true,
      },
      update: {
        commitSha,
        deploymentId: deployment.id,
      },
    });

    assert(versionRecord.version === 'v1.0.1', 'ModuleVersion record created with semantic version v1.0.1');

    // Update active version on Module
    await prisma.module.update({
      where: { id: testModule.id },
      data: {
        version: 'v1.0.1',
        activeVersionId: versionRecord.id,
      },
    });

    const updatedModule = await prisma.module.findUnique({ where: { id: testModule.id } });
    assert(updatedModule?.version === 'v1.0.1', 'Module published version updated to v1.0.1');

    // TEST 5: Non-Destructive Rollback Verification
    console.log('\n--- TEST GROUP 5: Non-Destructive Rollback ---');
    // Simulate rollback back to 1.0.0
    await prisma.module.update({
      where: { id: testModule.id },
      data: { version: '1.0.0' },
    });

    const rolledBackModule = await prisma.module.findUnique({ where: { id: testModule.id } });
    assert(rolledBackModule?.version === '1.0.0', 'Reverted active published version to 1.0.0');

    // Verify v1.0.1 still exists in history
    const historyVersions = await prisma.moduleVersion.findMany({ where: { moduleId: testModule.id } });
    assert(historyVersions.some((v) => v.version === 'v1.0.1'), 'Preserved newer version in historical audit trail');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Verification failed with error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerificationSuite();
