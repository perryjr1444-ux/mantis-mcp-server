/**
 * Real attack statistics tracking
 * Replaces mock data with actual session analysis results
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionAnalysis, AttackStats } from './types';

// Simple logger fallback
const logger = {
  info: (...args: any[]) => console.error('[INFO]', ...args),
  warn: (...args: any[]) => console.error('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.error('[DEBUG]', ...args)
};

interface AttackEvent {
  sessionId: string;
  timestamp: Date;
  isLLM: boolean;
  confidence: number;
  indicators: string[];
  patterns: string[];
  defenseSuccess: boolean;
  vector?: string;
}

export class AttackStatsTracker {
  private events: AttackEvent[] = [];
  private dataFile: string;
  private maxEvents: number = 10000; // Limit memory usage

  constructor(dataDir?: string) {
    const baseDir = dataDir || path.resolve(__dirname, '..', 'logs');
    this.dataFile = path.join(baseDir, 'attack-stats.jsonl');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing events from disk
      await this.loadEvents();
      logger.info(`Loaded ${this.events.length} attack events from disk`);
    } catch (error) {
      logger.warn('No existing attack data found, starting fresh');
      this.events = [];
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      const lines = data.trim().split('\n').filter(l => l.length > 0);

      this.events = lines.map(line => {
        const event = JSON.parse(line);
        event.timestamp = new Date(event.timestamp);
        return event;
      });

      // Keep only recent events (rolling window)
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
      this.events = this.events.filter(e => e.timestamp.getTime() > cutoffTime);

    } catch (error) {
      // File doesn't exist or is empty
      this.events = [];
    }
  }

  private async saveEvent(event: AttackEvent): Promise<void> {
    try {
      // Append to JSONL file
      const line = JSON.stringify(event) + '\n';
      await fs.appendFile(this.dataFile, line);
    } catch (error) {
      logger.error('Failed to save attack event:', error);
    }
  }

  async recordSession(analysis: SessionAnalysis, defenseSuccess: boolean = true): Promise<void> {
    // Extract attack vector from patterns
    let vector = 'unknown';
    if (analysis.patterns && analysis.patterns.length > 0) {
      const pattern = analysis.patterns[0];
      vector = pattern.pattern;
    }

    const event: AttackEvent = {
      sessionId: analysis.sessionId,
      timestamp: new Date(),
      isLLM: analysis.isLLM,
      confidence: analysis.confidence,
      indicators: analysis.indicators || [],
      patterns: analysis.patterns?.map(p => p.pattern) || [],
      defenseSuccess,
      vector
    };

    // Add to memory
    this.events.push(event);

    // Trim if too large
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Persist to disk
    await this.saveEvent(event);

    logger.debug(`Recorded attack event: ${event.sessionId}, LLM=${event.isLLM}, confidence=${event.confidence}`);
  }

  async getStats(timeRange: string): Promise<AttackStats> {
    const now = Date.now();
    let cutoffTime: number;

    // Parse time range
    switch (timeRange) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        cutoffTime = 0;
        break;
      default:
        cutoffTime = now - (24 * 60 * 60 * 1000); // Default 24h
    }

    // Filter events in time range
    const relevantEvents = this.events.filter(e =>
      e.timestamp.getTime() >= cutoffTime
    );

    // Calculate statistics
    const totalAttacks = relevantEvents.length;
    const llmAttacks = relevantEvents.filter(e => e.isLLM).length;
    const humanAttacks = totalAttacks - llmAttacks;
    const successfulDefenses = relevantEvents.filter(e => e.defenseSuccess).length;
    const failedDefenses = totalAttacks - successfulDefenses;

    // Count sessions trapped (high confidence LLM attacks)
    const sessionsTrapped = relevantEvents.filter(e =>
      e.isLLM && e.confidence > 0.8
    ).length;

    // Estimate resources exhausted
    const avgApiCallsPerSession = 500; // Tarpit causes ~500 API calls
    const avgCostPerCall = 0.01; // $0.01 per API call
    const avgTimePerSession = 120; // 120 seconds per trapped session

    const resourcesExhausted = {
      estimatedApiCalls: sessionsTrapped * avgApiCallsPerSession,
      estimatedCost: sessionsTrapped * avgApiCallsPerSession * avgCostPerCall,
      estimatedTime: sessionsTrapped * avgTimePerSession
    };

    // Count top attack vectors
    const vectorCounts = new Map<string, number>();
    relevantEvents.forEach(e => {
      if (e.vector && e.isLLM) {
        vectorCounts.set(e.vector, (vectorCounts.get(e.vector) || 0) + 1);
      }
    });

    const topAttackVectors = Array.from(vectorCounts.entries())
      .map(([vector, count]) => ({ vector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: AttackStats = {
      totalAttacks,
      llmAttacks,
      humanAttacks,
      successfulDefenses,
      failedDefenses,
      sessionsTrapped,
      resourcesExhausted,
      topAttackVectors,
      timeRange
    };

    return stats;
  }

  async getRecentEvents(limit: number = 100): Promise<AttackEvent[]> {
    return this.events.slice(-limit);
  }

  async clearOldEvents(daysToKeep: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const beforeCount = this.events.length;

    this.events = this.events.filter(e =>
      e.timestamp.getTime() >= cutoffTime
    );

    const removedCount = beforeCount - this.events.length;

    if (removedCount > 0) {
      // Rewrite file with remaining events
      const lines = this.events.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(this.dataFile, lines);
      logger.info(`Cleared ${removedCount} old events, kept ${this.events.length}`);
    }

    return removedCount;
  }

  getEventCount(): number {
    return this.events.length;
  }

  async exportStats(outputPath: string): Promise<void> {
    const stats = {
      totalEvents: this.events.length,
      timeRange: {
        earliest: this.events[0]?.timestamp,
        latest: this.events[this.events.length - 1]?.timestamp
      },
      stats_1h: await this.getStats('1h'),
      stats_24h: await this.getStats('24h'),
      stats_7d: await this.getStats('7d'),
      stats_30d: await this.getStats('30d'),
      recentEvents: this.events.slice(-50)
    };

    await fs.writeFile(outputPath, JSON.stringify(stats, null, 2));
    logger.info(`Exported stats to ${outputPath}`);
  }
}
