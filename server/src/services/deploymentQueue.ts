import { deploymentWorker } from './deploymentWorker';
import { prisma } from '../prisma';

export interface DeploymentJob {
  id: string;
  deploymentId: string;
  moduleId: string;
  commitSha: string;
  enqueuedAt: Date;
}

export class DeploymentQueue {
  private queue: DeploymentJob[] = [];
  private activeJobs = new Map<string, DeploymentJob>();
  private maxConcurrency = 2;
  private isProcessing = false;

  public async enqueue(deploymentId: string): Promise<DeploymentJob> {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const job: DeploymentJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deploymentId: deployment.id,
      moduleId: deployment.moduleId,
      commitSha: deployment.commitSha,
      enqueuedAt: new Date(),
    };

    // Check if duplicate pending job is in queue
    const isAlreadyQueued = this.queue.some((j) => j.deploymentId === deploymentId);
    if (!isAlreadyQueued) {
      this.queue.push(job);
      console.log(`[DeploymentQueue] Enqueued deployment ${deploymentId} for commit ${job.commitSha.slice(0, 7)} (Queue depth: ${this.queue.length})`);
    }

    // Trigger queue processing in background
    setTimeout(() => this.processNext(), 50);

    return job;
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrency) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeJobs.set(job.deploymentId, job);
    console.log(`[DeploymentQueue] Starting job for deployment ${job.deploymentId} (Active: ${this.activeJobs.size})`);

    try {
      await deploymentWorker.executeDeployment(job.deploymentId);
    } catch (e: any) {
      console.error(`[DeploymentQueue] Job failed for deployment ${job.deploymentId}:`, e.message);
    } finally {
      this.activeJobs.delete(job.deploymentId);
      // Process next in queue
      setTimeout(() => this.processNext(), 50);
    }
  }

  public getQueueStatus() {
    return {
      pending: this.queue.length,
      active: this.activeJobs.size,
      queuedJobs: this.queue,
    };
  }
}

export const deploymentQueue = new DeploymentQueue();
