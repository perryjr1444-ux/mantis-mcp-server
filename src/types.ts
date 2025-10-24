/**
 * Type definitions for Mantis MCP Server
 */

export enum DefenseMode {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  TARPIT = 'tarpit',
  MONITOR = 'monitor'
}

export enum DecoyType {
  FTP = 'ftp',
  SSH = 'ssh',
  HTTP = 'http',
  SMB = 'smb',
  TELNET = 'telnet'
}

export enum HiddenMethod {
  ANSI = 'ansi',
  HTML_COMMENT = 'html_comment',
  UNICODE = 'unicode',
  CSS = 'css'
}

export interface DecoyConfig {
  type: DecoyType;
  port: number;
  mode: DefenseMode;
  injectionPayload?: string;
  enabled: boolean;
}

export interface MantisConfig {
  mode: DefenseMode;
  injectionThreshold: number;
  callbackIp: string;
  callbackPort: number;
  enableTarpit: boolean;
  tarpitComplexity: number;
  services: {
    [key: string]: {
      enabled: boolean;
      port: number;
    };
  };
  detection: DetectionConfig;
  logging: LoggingConfig;
}

export interface DetectionConfig {
  timingVarianceThreshold: number;
  typoThreshold: number;
  minCommandsForAnalysis: number;
  sessionTimeout: number;
}

export interface LoggingConfig {
  level: string;
  file: string;
  maxSizeMb: number;
  backupCount: number;
}

export interface AttackSignature {
  pattern: string;
  confidence: number;
  indicators: string[];
  timestamp?: Date;
}

export interface SessionAnalysis {
  sessionId: string;
  isLLM: boolean;
  confidence: number;
  indicators: string[];
  patterns: AttackSignature[];
  recommendations: string[];
}

export interface InjectionPayload {
  rawPayload: string;
  hiddenPayload: string;
  method: HiddenMethod;
  metadata: {
    mode: DefenseMode;
    targetType: string;
    timestamp: Date;
    effectiveness?: number;
  };
}

export interface DecoyService {
  id: string;
  type: DecoyType;
  port: number;
  status: 'running' | 'stopped' | 'error';
  startTime: Date;
  attacksDetected: number;
  sessionsTrapped: number;
  mode: DefenseMode;
}

export interface TarpitStructure {
  depth: number;
  breadth: number;
  totalNodes: number;
  totalFiles: number;
  estimatedTraversalTime: number;
  estimatedResourceCost: number;
  structure: TarpitNode;
}

export interface TarpitNode {
  name: string;
  type: 'directory' | 'file';
  children?: TarpitNode[];
  content?: string;
  clue?: boolean;
  trapProbability?: number;
}

export interface AttackStats {
  totalAttacks: number;
  llmAttacks: number;
  humanAttacks: number;
  successfulDefenses: number;
  failedDefenses: number;
  sessionsTrapped: number;
  resourcesExhausted: {
    estimatedApiCalls: number;
    estimatedCost: number;
    estimatedTime: number;
  };
  topAttackVectors: Array<{
    vector: string;
    count: number;
  }>;
  timeRange: string;
}

export interface MonitoringReport {
  duration: number;
  attacksDetected: number;
  activeDecoys: DecoyService[];
  llmSessions: string[];
  metrics?: {
    avgResponseTime: number;
    peakAttackTime: string;
    mostTargetedService: string;
    injectionSuccessRate: number;
  };
}

export interface InjectionTestResult {
  payload: string;
  targetModel: string;
  success: boolean;
  confidence: number;
  bypassed: boolean;
  recommendations: string[];
}