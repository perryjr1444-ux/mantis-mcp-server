/**
 * Security Configuration for Mantis MCP Server
 */

export interface SecurityConfig {
  // Authentication
  auth: {
    enabled: boolean;
    apiGatewayUrl: string;
    cacheTimeout: number;
    requireAuth: boolean;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    default: { windowMs: number; maxRequests: number };
    perTool: Record<string, { windowMs: number; maxRequests: number }>;
  };

  // Audit Logging
  audit: {
    enabled: boolean;
    logDir: string;
    flushInterval: number;
    maxBufferSize: number;
  };

  // Resource Limits
  resources: {
    maxConcurrentDecoys: number;
    maxSessionsPerUser: number;
    maxPayloadSize: number;
    commandTimeout: number;
  };

  // Tool Permissions
  toolPermissions: Record<string, { scopes: string[]; rateLimit?: { windowMs: number; maxRequests: number } }>;
}

export const defaultSecurityConfig: SecurityConfig = {
  auth: {
    enabled: true,
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    cacheTimeout: 300000, // 5 minutes
    requireAuth: process.env.REQUIRE_AUTH !== 'false',
  },

  rateLimit: {
    enabled: true,
    default: {
      windowMs: 60000, // 1 minute
      maxRequests: 60,
    },
    perTool: {
      deploy_decoy: { windowMs: 300000, maxRequests: 10 }, // 10 per 5 minutes
      stop_decoy: { windowMs: 60000, maxRequests: 30 },
      analyze_session: { windowMs: 60000, maxRequests: 100 },
      generate_injection: { windowMs: 60000, maxRequests: 30 },
      generate_tarpit: { windowMs: 300000, maxRequests: 5 },
      monitor_attacks: { windowMs: 300000, maxRequests: 10 },
      run_integrated_exercise: { windowMs: 3600000, maxRequests: 5 }, // 5 per hour
    },
  },

  audit: {
    enabled: true,
    logDir: process.env.AUDIT_LOG_DIR || './logs/audit',
    flushInterval: 5000, // 5 seconds
    maxBufferSize: 100,
  },

  resources: {
    maxConcurrentDecoys: parseInt(process.env.MAX_CONCURRENT_DECOYS || '10', 10),
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '100', 10),
    maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB
    commandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '300000', 10), // 5 minutes
  },

  toolPermissions: {
    // Decoy Management
    deploy_decoy: { scopes: ['admin', 'write', 'decoy:deploy'] },
    stop_decoy: { scopes: ['admin', 'write', 'decoy:manage'] },
    list_active_decoys: { scopes: ['admin', 'read', 'decoy:manage'] },

    // Detection
    analyze_session: { scopes: ['admin', 'write', 'detection:analyze'] },
    get_attack_stats: { scopes: ['admin', 'read', 'stats:view'] },

    // Injection
    generate_injection: { scopes: ['admin', 'write', 'injection:generate'] },
    test_injection: { scopes: ['admin', 'write', 'injection:generate'] },

    // Monitoring
    monitor_attacks: { scopes: ['admin', 'read', 'monitoring:view'] },

    // Configuration
    configure_mantis: { scopes: ['admin'] },

    // Purple Team
    generate_tarpit: { scopes: ['admin', 'write', 'exercise:run'] },
    run_integrated_exercise: { scopes: ['admin', 'exercise:run'] },
  },
};

export let securityConfig: SecurityConfig = { ...defaultSecurityConfig };

/**
 * Update security configuration
 */
export function updateSecurityConfig(updates: Partial<SecurityConfig>): void {
  securityConfig = {
    ...securityConfig,
    ...updates,
  };
}

/**
 * Get required scopes for a tool
 */
export function getRequiredScopes(toolName: string): string[] {
  return securityConfig.toolPermissions[toolName]?.scopes || ['admin'];
}

/**
 * Get rate limit config for a tool
 */
export function getRateLimitConfig(toolName: string): { windowMs: number; maxRequests: number } {
  return (
    securityConfig.toolPermissions[toolName]?.rateLimit ||
    securityConfig.rateLimit.perTool[toolName] ||
    securityConfig.rateLimit.default
  );
}

export default securityConfig;
