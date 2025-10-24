/**
 * Generates tarpit structures to exhaust LLM resources
 */

import { TarpitStructure, TarpitNode } from './types';
import { logger } from './logger';

export class TarpitGenerator {
  private readonly sensitiveNames = [
    'admin_keys', 'root_certificates', 'db_backups', 'credentials',
    'api_keys', 'private_keys', 'ssh_keys', 'vpn_configs',
    'passwords', 'secrets', 'tokens', 'auth_data',
    'config_backup', 'system_dump', 'user_data', 'financial_records',
    'customer_db', 'payment_info', 'encryption_keys', 'master_password'
  ];

  private readonly fakeFileExtensions = [
    '.key', '.pem', '.crt', '.txt', '.conf', '.cfg',
    '.db', '.sql', '.json', '.xml', '.bak', '.dump'
  ];

  private readonly cluePatterns = [
    'IMPORTANT: Check subdirectory for critical data',
    'TODO: Move sensitive files from here',
    'WARNING: Unencrypted data below',
    'NOTE: Backup of production credentials',
    '!!! CONFIDENTIAL - DO NOT SHARE !!!',
    'TEMP: Will delete after audit'
  ];

  async generate(params: {
    depth?: number;
    breadth?: number;
    fileCount?: number;
    includeClues?: boolean;
    complexity?: 'low' | 'medium' | 'high' | 'extreme';
  }): Promise<TarpitStructure> {
    const config = this.getComplexityConfig(params.complexity || 'medium', params);

    logger.info(`Generating tarpit with complexity: ${params.complexity || 'medium'}`);

    const structure = this.generateNode(
      'root',
      'directory',
      0,
      config.depth,
      config.breadth,
      config.includeClues
    );

    const stats = this.calculateStats(structure);

    return {
      depth: config.depth,
      breadth: config.breadth,
      totalNodes: stats.totalNodes,
      totalFiles: stats.totalFiles,
      estimatedTraversalTime: this.estimateTraversalTime(stats),
      estimatedResourceCost: this.estimateResourceCost(stats),
      structure
    };
  }

  private getComplexityConfig(
    complexity: string,
    params: any
  ): {
    depth: number;
    breadth: number;
    fileCount: number;
    includeClues: boolean;
  } {
    const complexityPresets = {
      low: { depth: 5, breadth: 5, fileCount: 50 },
      medium: { depth: 10, breadth: 10, fileCount: 200 },
      high: { depth: 20, breadth: 50, fileCount: 1000 },
      extreme: { depth: 50, breadth: 100, fileCount: 5000 }
    };

    const preset = complexityPresets[complexity as keyof typeof complexityPresets] || complexityPresets.medium;

    return {
      depth: params.depth || preset.depth,
      breadth: params.breadth || preset.breadth,
      fileCount: params.fileCount || preset.fileCount,
      includeClues: params.includeClues !== undefined ? params.includeClues : true
    };
  }

  private generateNode(
    name: string,
    type: 'directory' | 'file',
    currentDepth: number,
    maxDepth: number,
    breadth: number,
    includeClues: boolean
  ): TarpitNode {
    const node: TarpitNode = {
      name: name || this.generateName(type),
      type
    };

    if (type === 'directory' && currentDepth < maxDepth) {
      node.children = [];

      // Generate subdirectories
      const numDirs = this.randomInRange(Math.floor(breadth * 0.7), breadth);
      for (let i = 0; i < numDirs; i++) {
        const childNode = this.generateNode(
          this.generateSensitiveName(),
          'directory',
          currentDepth + 1,
          maxDepth,
          breadth,
          includeClues
        );

        // Add clue probability
        if (includeClues && Math.random() < 0.1) {
          childNode.clue = true;
        }

        node.children.push(childNode);
      }

      // Generate files
      const numFiles = this.randomInRange(0, Math.floor(breadth * 0.3));
      for (let i = 0; i < numFiles; i++) {
        const fileNode = this.generateNode(
          this.generateFileName(),
          'file',
          currentDepth + 1,
          maxDepth,
          breadth,
          includeClues
        );

        if (includeClues && Math.random() < 0.05) {
          fileNode.content = this.generateFakeContent();
        }

        node.children.push(fileNode);
      }

      // Shuffle children to make it less predictable
      node.children = this.shuffleArray(node.children);
    }

    // Add trap probability for deeper nodes
    if (currentDepth > maxDepth * 0.6) {
      node.trapProbability = Math.min(0.8, currentDepth / maxDepth);
    }

    return node;
  }

  private generateName(type: 'directory' | 'file'): string {
    if (type === 'directory') {
      return this.generateSensitiveName();
    } else {
      return this.generateFileName();
    }
  }

  private generateSensitiveName(): string {
    const base = this.sensitiveNames[Math.floor(Math.random() * this.sensitiveNames.length)];
    const suffix = Math.random() < 0.5 ? `_${this.generateTimestamp()}` : `_v${this.randomInRange(1, 9)}`;
    return base + suffix;
  }

  private generateFileName(): string {
    const base = this.sensitiveNames[Math.floor(Math.random() * this.sensitiveNames.length)];
    const ext = this.fakeFileExtensions[Math.floor(Math.random() * this.fakeFileExtensions.length)];
    return base + ext;
  }

  private generateTimestamp(): string {
    const year = this.randomInRange(2020, 2024);
    const month = String(this.randomInRange(1, 12)).padStart(2, '0');
    const day = String(this.randomInRange(1, 28)).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private generateFakeContent(): string {
    const patterns = [
      `${this.cluePatterns[Math.floor(Math.random() * this.cluePatterns.length)]}\\n\\n[ENCRYPTED DATA]`,
      `BEGIN RSA PRIVATE KEY\\n${this.generateRandomBase64(64)}\\nEND RSA PRIVATE KEY`,
      `{\\n  "api_key": "${this.generateRandomHex(32)}",\\n  "secret": "${this.generateRandomHex(64)}"\\n}`,
      `username: admin\\npassword: [REDACTED]\\nhost: 10.0.${this.randomInRange(0, 255)}.${this.randomInRange(1, 255)}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private generateRandomBase64(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private calculateStats(node: TarpitNode): {
    totalNodes: number;
    totalFiles: number;
    totalDirectories: number;
  } {
    let totalNodes = 1;
    let totalFiles = node.type === 'file' ? 1 : 0;
    let totalDirectories = node.type === 'directory' ? 1 : 0;

    if (node.children) {
      for (const child of node.children) {
        const childStats = this.calculateStats(child);
        totalNodes += childStats.totalNodes;
        totalFiles += childStats.totalFiles;
        totalDirectories += childStats.totalDirectories;
      }
    }

    return { totalNodes, totalFiles, totalDirectories };
  }

  private estimateTraversalTime(stats: {
    totalNodes: number;
    totalFiles: number;
  }): number {
    // Estimate seconds needed for LLM to traverse
    const secondsPerNode = 2; // Average time for LLM to process a node
    const secondsPerFile = 3; // Additional time to examine files
    return (stats.totalNodes * secondsPerNode) + (stats.totalFiles * secondsPerFile);
  }

  private estimateResourceCost(stats: {
    totalNodes: number;
    totalFiles: number;
  }): number {
    // Estimate API cost based on token usage
    const tokensPerNode = 150; // Average tokens to process a node
    const tokensPerFile = 200; // Additional tokens for file content
    const totalTokens = (stats.totalNodes * tokensPerNode) + (stats.totalFiles * tokensPerFile);
    const costPer1kTokens = 0.03; // Approximate cost for GPT-4
    return (totalTokens / 1000) * costPer1kTokens;
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateInfinite(): AsyncGenerator<TarpitNode> {
    return this.infiniteGenerator();
  }

  private async *infiniteGenerator(): AsyncGenerator<TarpitNode> {
    let depth = 0;
    while (true) {
      yield this.generateNode(
        this.generateSensitiveName(),
        'directory',
        depth++,
        Infinity,
        10,
        true
      );
    }
  }
}