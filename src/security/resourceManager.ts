/**
 * Resource Manager for Mantis MCP Server
 * Manages and enforces resource quotas
 */

import { logger } from '../logger';
import { securityConfig } from './config';

interface ResourceUsage {
  userId: string;
  decoys: number;
  sessions: number;
  lastActivity: Date;
}

export class ResourceManager {
  private usage: Map<string, ResourceUsage>;

  constructor() {
    this.usage = new Map();

    // Clean up inactive users periodically
    setInterval(() => this.cleanup(), 300000); // 5 minutes
  }

  /**
   * Check if user can deploy a decoy
   */
  canDeployDecoy(userId: string): boolean {
    const user = this.getOrCreateUser(userId);

    if (user.decoys >= securityConfig.resources.maxConcurrentDecoys) {
      logger.warn('Decoy limit exceeded', {
        userId,
        current: user.decoys,
        max: securityConfig.resources.maxConcurrentDecoys,
      });
      return false;
    }

    return true;
  }

  /**
   * Track decoy deployment
   */
  trackDecoyDeployed(userId: string): void {
    const user = this.getOrCreateUser(userId);
    user.decoys++;
    user.lastActivity = new Date();

    logger.debug('Decoy deployed tracked', {
      userId,
      totalDecoys: user.decoys,
    });
  }

  /**
   * Track decoy stopped
   */
  trackDecoyStopped(userId: string): void {
    const user = this.usage.get(userId);
    if (user && user.decoys > 0) {
      user.decoys--;
      user.lastActivity = new Date();

      logger.debug('Decoy stopped tracked', {
        userId,
        totalDecoys: user.decoys,
      });
    }
  }

  /**
   * Check if user can analyze session
   */
  canAnalyzeSession(userId: string): boolean {
    const user = this.getOrCreateUser(userId);

    if (user.sessions >= securityConfig.resources.maxSessionsPerUser) {
      logger.warn('Session limit exceeded', {
        userId,
        current: user.sessions,
        max: securityConfig.resources.maxSessionsPerUser,
      });
      return false;
    }

    return true;
  }

  /**
   * Track session analysis
   */
  trackSessionAnalyzed(userId: string): void {
    const user = this.getOrCreateUser(userId);
    user.sessions++;
    user.lastActivity = new Date();
  }

  /**
   * Get user's resource usage
   */
  getUsage(userId: string): ResourceUsage {
    return this.getOrCreateUser(userId);
  }

  /**
   * Get all users' resource usage
   */
  getAllUsage(): ResourceUsage[] {
    return Array.from(this.usage.values());
  }

  /**
   * Reset user's resource usage
   */
  resetUsage(userId: string): void {
    const user = this.usage.get(userId);
    if (user) {
      user.decoys = 0;
      user.sessions = 0;
      user.lastActivity = new Date();

      logger.info('Resource usage reset', { userId });
    }
  }

  /**
   * Get or create user entry
   */
  private getOrCreateUser(userId: string): ResourceUsage {
    let user = this.usage.get(userId);

    if (!user) {
      user = {
        userId,
        decoys: 0,
        sessions: 0,
        lastActivity: new Date(),
      };
      this.usage.set(userId, user);
    }

    return user;
  }

  /**
   * Clean up inactive users
   */
  private cleanup(): void {
    const now = Date.now();
    const inactiveThreshold = 3600000; // 1 hour
    let cleaned = 0;

    for (const [userId, user] of this.usage.entries()) {
      if (now - user.lastActivity.getTime() > inactiveThreshold && user.decoys === 0) {
        this.usage.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned inactive users', { count: cleaned });
    }
  }

  /**
   * Get resource statistics
   */
  getStats(): {
    totalUsers: number;
    totalDecoys: number;
    totalSessions: number;
    avgDecoysPerUser: number;
  } {
    const users = Array.from(this.usage.values());

    return {
      totalUsers: users.length,
      totalDecoys: users.reduce((sum, u) => sum + u.decoys, 0),
      totalSessions: users.reduce((sum, u) => sum + u.sessions, 0),
      avgDecoysPerUser: users.length > 0
        ? users.reduce((sum, u) => sum + u.decoys, 0) / users.length
        : 0,
    };
  }
}

export const resourceManager = new ResourceManager();
export default resourceManager;
