/**
 * Audit Logger for Mantis MCP Server
 * Comprehensive logging of all security-relevant events
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../logger';

export enum AuditEventType {
  TOOL_INVOKED = 'tool_invoked',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  PERMISSION_DENIED = 'permission_denied',
  DECOY_DEPLOYED = 'decoy_deployed',
  DECOY_STOPPED = 'decoy_stopped',
  ATTACK_DETECTED = 'attack_detected',
  INJECTION_GENERATED = 'injection_generated',
  CONFIG_CHANGED = 'config_changed',
  ERROR_OCCURRED = 'error_occurred',
}

export interface AuditEvent {
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  apiKeyId?: string;
  toolName?: string;
  parameters?: any;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export class AuditLogger {
  private logDir: string;
  private logFile: string;
  private buffer: AuditEvent[];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 100;

  constructor(logDir: string = './logs/audit') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, `audit-${this.getDateString()}.jsonl`);
    this.buffer = [];

    this.initialize();

    // Flush buffer periodically
    setInterval(() => this.flush(), this.flushInterval);

    // Rotate log file daily
    setInterval(() => this.rotateLogFile(), 86400000); // 24 hours
  }

  /**
   * Initialize audit logger
   */
  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      logger.info('Audit logger initialized', { logFile: this.logFile });
    } catch (error) {
      logger.error('Failed to initialize audit logger', { error });
    }
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      timestamp: new Date(),
      ...event,
    };

    this.buffer.push(auditEvent);

    // Also log to Winston for immediate visibility
    logger.info('Audit event', {
      type: event.eventType,
      userId: event.userId,
      apiKeyId: event.apiKeyId,
      toolName: event.toolName,
    });

    // Flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Log tool invocation
   */
  logToolInvocation(
    toolName: string,
    parameters: any,
    userId?: string,
    apiKeyId?: string,
    result?: any,
    error?: string
  ): void {
    this.log({
      eventType: AuditEventType.TOOL_INVOKED,
      userId,
      apiKeyId,
      toolName,
      parameters,
      result,
      error,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(success: boolean, apiKeyId?: string, userId?: string, error?: string): void {
    this.log({
      eventType: success ? AuditEventType.AUTH_SUCCESS : AuditEventType.AUTH_FAILURE,
      userId,
      apiKeyId,
      error,
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(identifier: string, toolName?: string): void {
    this.log({
      eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
      toolName,
      metadata: { identifier },
    });
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(
    toolName: string,
    requiredScope: string,
    userId?: string,
    apiKeyId?: string
  ): void {
    this.log({
      eventType: AuditEventType.PERMISSION_DENIED,
      userId,
      apiKeyId,
      toolName,
      metadata: { requiredScope },
    });
  }

  /**
   * Flush buffer to file
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    try {
      const events = this.buffer.splice(0, this.buffer.length);
      const lines = events.map((event) => JSON.stringify(event)).join('\n') + '\n';

      await fs.appendFile(this.logFile, lines, 'utf-8');

      logger.debug('Audit log flushed', { eventCount: events.length });
    } catch (error) {
      logger.error('Failed to flush audit log', { error });
      // Put events back in buffer
      this.buffer.unshift(...this.buffer);
    }
  }

  /**
   * Rotate log file daily
   */
  private rotateLogFile(): void {
    this.flush();
    this.logFile = path.join(this.logDir, `audit-${this.getDateString()}.jsonl`);
    logger.info('Audit log file rotated', { newFile: this.logFile });
  }

  /**
   * Get date string for log file
   */
  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Query audit logs
   */
  async query(
    eventType?: AuditEventType,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    try {
      // Flush current buffer first
      await this.flush();

      // Read log file
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n');

      // Parse events
      let events: AuditEvent[] = lines
        .filter((line) => line.trim())
        .map((line) => {
          try {
            const event = JSON.parse(line);
            event.timestamp = new Date(event.timestamp);
            return event;
          } catch {
            return null;
          }
        })
        .filter((event) => event !== null) as AuditEvent[];

      // Filter by event type
      if (eventType) {
        events = events.filter((event) => event.eventType === eventType);
      }

      // Filter by date range
      if (startDate) {
        events = events.filter((event) => event.timestamp >= startDate);
      }
      if (endDate) {
        events = events.filter((event) => event.timestamp <= endDate);
      }

      // Sort by timestamp descending and limit
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return events.slice(0, limit);
    } catch (error) {
      logger.error('Failed to query audit logs', { error });
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getStats(hours: number = 24): Promise<Record<string, number>> {
    const startDate = new Date(Date.now() - hours * 3600000);
    const events = await this.query(undefined, startDate);

    const stats: Record<string, number> = {};

    for (const event of events) {
      stats[event.eventType] = (stats[event.eventType] || 0) + 1;
    }

    return stats;
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
