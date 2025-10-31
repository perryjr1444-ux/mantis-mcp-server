/**
 * Security Module Exports
 * Centralized security components for Mantis MCP Server
 */

export { AuthMiddleware, authMiddleware, AuthContext } from './authMiddleware';
export { RateLimiter, rateLimiter } from './rateLimiter';
export { AuditLogger, auditLogger, AuditEventType, AuditEvent } from './auditLogger';
export { InputValidator, inputValidator } from './inputValidator';
export { ResourceManager, resourceManager } from './resourceManager';
export {
  SecurityConfig,
  securityConfig,
  defaultSecurityConfig,
  updateSecurityConfig,
  getRequiredScopes,
  getRateLimitConfig,
} from './config';

/**
 * Initialize all security components
 */
export async function initializeSecurity(): Promise<void> {
  // Security components are initialized on import
  // This function can be used for async initialization if needed
}

/**
 * Security middleware wrapper for tool execution
 */
export async function secureToolExecution(
  toolName: string,
  apiKey: string | undefined,
  execute: () => Promise<any>
): Promise<any> {
  const { authMiddleware } = await import('./authMiddleware');
  const { rateLimiter } = await import('./rateLimiter');
  const { auditLogger, AuditEventType } = await import('./auditLogger');
  const { resourceManager } = await import('./resourceManager');
  const { securityConfig, getRequiredScopes } = await import('./config');

  // 1. Authentication
  let authContext;
  if (securityConfig.auth.enabled && apiKey) {
    authContext = await authMiddleware.validateApiKey(apiKey);

    if (!authContext.authenticated) {
      auditLogger.log({
        eventType: AuditEventType.AUTH_FAILURE,
        toolName,
        error: 'Invalid API key',
      });
      throw new Error('Authentication failed: Invalid API key');
    }

    auditLogger.logAuth(true, authContext.apiKeyId, authContext.userId);
  } else if (securityConfig.auth.requireAuth) {
    auditLogger.log({
      eventType: AuditEventType.AUTH_FAILURE,
      toolName,
      error: 'No API key provided',
    });
    throw new Error('Authentication required');
  } else {
    // No auth required
    authContext = {
      authenticated: false,
      scopes: ['admin'], // Allow all if auth disabled
    };
  }

  // 2. Authorization
  const requiredScopes = getRequiredScopes(toolName);
  if (!authMiddleware.hasAnyScope(authContext, requiredScopes)) {
    auditLogger.logPermissionDenied(
      toolName,
      requiredScopes.join(','),
      authContext.userId,
      authContext.apiKeyId
    );
    throw new Error(
      `Permission denied: Requires one of: ${requiredScopes.join(', ')}`
    );
  }

  // 3. Rate Limiting
  if (securityConfig.rateLimit.enabled) {
    const identifier = authContext.apiKeyId || authContext.userId || 'anonymous';
    const rateLimitResult = rateLimiter.check(identifier, toolName);

    if (!rateLimitResult.allowed) {
      auditLogger.logRateLimitExceeded(identifier, toolName);
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      throw new Error(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      );
    }
  }

  // 4. Resource Quotas (for specific tools)
  const userId = authContext.userId || authContext.apiKeyId || 'anonymous';

  if (toolName === 'deploy_decoy') {
    if (!resourceManager.canDeployDecoy(userId)) {
      throw new Error(
        `Decoy limit exceeded. Maximum ${securityConfig.resources.maxConcurrentDecoys} concurrent decoys allowed.`
      );
    }
  }

  if (toolName === 'analyze_session') {
    if (!resourceManager.canAnalyzeSession(userId)) {
      throw new Error(
        `Session limit exceeded. Maximum ${securityConfig.resources.maxSessionsPerUser} sessions allowed.`
      );
    }
  }

  // 5. Execute tool
  try {
    const startTime = Date.now();
    const result = await execute();
    const duration = Date.now() - startTime;

    // Track resource usage
    if (toolName === 'deploy_decoy') {
      resourceManager.trackDecoyDeployed(userId);
    } else if (toolName === 'analyze_session') {
      resourceManager.trackSessionAnalyzed(userId);
    }

    // Audit log success
    auditLogger.logToolInvocation(
      toolName,
      {},
      authContext.userId,
      authContext.apiKeyId,
      { duration, success: true }
    );

    return result;
  } catch (error: any) {
    // Audit log failure
    auditLogger.logToolInvocation(
      toolName,
      {},
      authContext.userId,
      authContext.apiKeyId,
      undefined,
      error.message
    );

    throw error;
  }
}

// Default export removed - use named exports instead
// export default {
//   authMiddleware,
//   rateLimiter,
//   auditLogger,
//   inputValidator,
//   resourceManager,
//   securityConfig,
//   initializeSecurity,
//   secureToolExecution,
// };
