import { Response } from 'express';
import { EventEmitter } from 'events';

export interface RealtimeProjectEvent {
  type: 'MODULE_UPDATED' | 'ACTIVITY_CREATED' | 'PROJECT_SYNCED' | 'ROLLBACK_COMPLETED' | 'MEMBER_JOINED' | string;
  projectId?: string;
  moduleId?: string;
  moduleName?: string;
  commitSha?: string;
  author?: string;
  message?: string;
  status?: string;
  data?: any;
  timestamp: string;
}

class RealtimeEventManager {
  private emitter = new EventEmitter();
  // Map of projectId -> Set of SSE Response streams
  private projectClients = new Map<string, Set<Response>>();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  // General event subscription
  public subscribe(listener: (event: any) => void): () => void {
    this.emitter.on('event', listener);
    return () => {
      this.emitter.off('event', listener);
    };
  }

  // General event broadcast
  public broadcast(type: string, data: any) {
    const payload = {
      type,
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };
    this.emitter.emit('event', payload);
  }

  // Register client connection for a project
  public registerClient(projectId: string, res: Response): () => void {
    if (!this.projectClients.has(projectId)) {
      this.projectClients.set(projectId, new Set());
    }

    const clients = this.projectClients.get(projectId)!;
    clients.add(res);

    console.log(`[SSE] Client connected to project ${projectId}. Total active listeners: ${clients.size}`);

    // Return cleanup function on disconnect
    return () => {
      clients.delete(res);
      if (clients.size === 0) {
        this.projectClients.delete(projectId);
      }
      console.log(`[SSE] Client disconnected from project ${projectId}. Remaining: ${clients.size}`);
    };
  }

  // Broadcast event payload to all clients listening to this project
  public broadcastToProject(projectId: string, event: Omit<RealtimeProjectEvent, 'projectId' | 'timestamp'>) {
    const clients = this.projectClients.get(projectId);
    if (!clients || clients.size === 0) return;

    const payload: RealtimeProjectEvent = {
      ...event,
      projectId,
      timestamp: new Date().toISOString(),
    };

    const sseData = `data: ${JSON.stringify(payload)}\n\n`;

    for (const client of clients) {
      try {
        client.write(sseData);
      } catch (err: any) {
        console.warn(`[SSE] Failed to write event to client:`, err.message);
        clients.delete(client);
      }
    }
  }
}

export const realtimeEventManager = new RealtimeEventManager();
