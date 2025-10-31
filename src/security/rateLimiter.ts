/**
 * Rate Limiter for Mantis MCP Server
 * Prevents abuse and ensures fair resource usage
 */

import { logger } from '../logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.limits = new Map();
    this.configs = new Map();

    // Default rate limits
    this.configs.set('default', { windowMs: 60000, maxRequests: 60 }); // 60/min
    this.configs.set('deploy_decoy', { windowMs: 300000, maxRequests: 10 }); // 10/5min
    this.configs.set('analyze_session', { windowMs: 60000, maxRequests: 100 }); // 100/min
    this.configs.set('generate_injection', { windowMs: 60000, maxRequests: 30 }); // 30/min

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string, tool?: string): { allowed: boolean; remaining: number; resetAt: number } {
    const config = this.configs.get(tool || 'default') || this.configs.get('default')!;
    const key = `${identifier}:${tool || 'default'}`;
    const now = Date.now();

    let entry = this.limits.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      this.limits.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        tool,
        count: entry.count,
        limit: config.maxRequests,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Set custom rate limit for a tool
   */
  setLimit(tool: string, windowMs: number, maxRequests: number): void {
    this.configs.set(tool, { windowMs, maxRequests });
    logger.info('Rate limit configured', { tool, windowMs, maxRequests });
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string, tool?: string): void {
    const key = `${identifier}:${tool || 'default'}`;
    this.limits.delete(key);
    logger.debug('Rate limit reset', { identifier, tool });
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt <= now) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned rate limit entries', { entriesRemoved: cleaned });
    }
  }

  /**
   * Get current stats
   */
  getStats(): { totalEntries: number; configs: number } {
    return {
      totalEntries: this.limits.size,
      configs: this.configs.size,
    };
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;
