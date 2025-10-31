/**
 * Authentication Middleware for Mantis MCP Server
 * Validates API keys and enforces access control
 */

import { logger } from '../logger';
import axios from 'axios';

export interface AuthContext {
  authenticated: boolean;
  apiKeyId?: string;
  userId?: string;
  scopes: string[];
  metadata?: Record<string, any>;
}

export class AuthMiddleware {
  private apiGatewayUrl: string;
  private cache: Map<string, { context: AuthContext; expiresAt: number }>;
  private cacheTimeout: number = 300000; // 5 minutes

  constructor(apiGatewayUrl: string = 'http://localhost:3000') {
    this.apiGatewayUrl = apiGatewayUrl;
    this.cache = new Map();

    // Clean cache periodically
    setInterval(() => this.cleanCache(), 60000);
  }

  /**
   * Validate API key via API Gateway
   */
  async validateApiKey(apiKey: string): Promise<AuthContext> {
    // Check cache first
    const cached = this.cache.get(apiKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Auth cache hit', { apiKeyId: cached.context.apiKeyId });
      return cached.context;
    }

    try {
      // Validate with API Gateway
      const response = await axios.get(`${this.apiGatewayUrl}/api/v1/auth/me`, {
        headers: {
          'X-API-Key': apiKey,
        },
        timeout: 5000,
      });

      const context: AuthContext = {
        authenticated: true,
        apiKeyId: response.data.data?.apiKey?.id,
        userId: response.data.data?.user?.id,
        scopes: response.data.data?.apiKey?.scopes || [],
        metadata: response.data.data,
      };

      // Cache the result
      this.cache.set(apiKey, {
        context,
        expiresAt: Date.now() + this.cacheTimeout,
      });

      logger.info('API key validated successfully', { apiKeyId: context.apiKeyId });
      return context;
    } catch (error: any) {
      logger.warn('API key validation failed', {
        error: error.message,
        status: error.response?.status,
      });

      return {
        authenticated: false,
        scopes: [],
      };
    }
  }

  /**
   * Check if context has required scope
   */
  hasScope(context: AuthContext, requiredScope: string): boolean {
    if (!context.authenticated) {
      return false;
    }

    // Admin scope has all permissions
    if (context.scopes.includes('admin')) {
      return true;
    }

    // Check for specific scope
    return context.scopes.includes(requiredScope);
  }

  /**
   * Check if context has any of the required scopes
   */
  hasAnyScope(context: AuthContext, requiredScopes: string[]): boolean {
    if (!context.authenticated) {
      return false;
    }

    // Admin scope has all permissions
    if (context.scopes.includes('admin')) {
      return true;
    }

    // Check if has any of the required scopes
    return requiredScopes.some((scope) => context.scopes.includes(scope));
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned auth cache', { entriesRemoved: cleaned });
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Auth cache cleared');
  }
}

export const authMiddleware = new AuthMiddleware();
export default authMiddleware;
