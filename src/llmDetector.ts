/**
 * Detects LLM-driven attack patterns
 */

import { SessionAnalysis, AttackSignature } from './types';
import { logger } from './logger';

export class LLMDetector {
  private signatures: AttackSignature[];
  private sessionHistory: Map<string, any>;

  constructor() {
    this.signatures = this.loadSignatures();
    this.sessionHistory = new Map();
  }

  private loadSignatures(): AttackSignature[] {
    return [
      {
        pattern: 'rapid_enumeration',
        confidence: 0.8,
        indicators: [
          'consistent_timing',
          'systematic_exploration',
          'no_typos',
          'structured_commands'
        ]
      },
      {
        pattern: 'command_chaining',
        confidence: 0.85,
        indicators: [
          'logical_progression',
          'immediate_parsing',
          'no_hesitation',
          'perfect_syntax'
        ]
      },
      {
        pattern: 'llm_artifacts',
        confidence: 0.95,
        indicators: [
          'markdown_in_commands',
          'explanation_patterns',
          'code_block_markers',
          'assistant_phrases'
        ]
      },
      {
        pattern: 'automated_scanning',
        confidence: 0.75,
        indicators: [
          'comprehensive_coverage',
          'methodical_approach',
          'no_redundancy',
          'optimal_order'
        ]
      },
      {
        pattern: 'perfect_exploitation',
        confidence: 0.9,
        indicators: [
          'first_try_success',
          'correct_payload_format',
          'no_trial_and_error',
          'precise_targeting'
        ]
      }
    ];
  }

  async analyzeSession(params: {
    sessionId: string;
    commands: string[];
    timingData?: number[];
  }): Promise<SessionAnalysis> {
    const { sessionId, commands, timingData } = params;

    logger.info(`Analyzing session ${sessionId} with ${commands.length} commands`);

    const indicators = this.detectIndicators(commands, timingData);
    const matchedPatterns = this.matchPatterns(indicators);
    const confidence = this.calculateConfidence(indicators, matchedPatterns);
    const isLLM = confidence > 0.6;

    const analysis: SessionAnalysis = {
      sessionId,
      isLLM,
      confidence,
      indicators,
      patterns: matchedPatterns,
      recommendations: this.generateRecommendations(isLLM, confidence, matchedPatterns)
    };

    // Store in history
    this.sessionHistory.set(sessionId, {
      analysis,
      commands,
      timingData,
      timestamp: new Date()
    });

    logger.info(`Session ${sessionId} analysis complete: LLM=${isLLM}, confidence=${confidence}`);

    return analysis;
  }

  private detectIndicators(commands: string[], timingData?: number[]): string[] {
    const indicators: string[] = [];

    // Check for perfect syntax (no typos)
    const typoScore = this.checkTypos(commands);
    if (typoScore < 0.05) {
      indicators.push('no_typos');
      indicators.push('perfect_syntax');
    }

    // Check timing consistency
    if (timingData) {
      const timingVariance = this.analyzeTimingVariance(timingData);
      if (timingVariance < 0.3) {
        indicators.push('consistent_timing');
        indicators.push('no_hesitation');
      }
    }

    // Check for LLM artifacts
    if (this.detectLLMArtifacts(commands)) {
      indicators.push('llm_artifacts');
      indicators.push('markdown_in_commands');
    }

    // Check command progression logic
    if (this.checkLogicalProgression(commands)) {
      indicators.push('logical_progression');
      indicators.push('systematic_exploration');
    }

    // Check for structured commands
    if (this.detectStructuredCommands(commands)) {
      indicators.push('structured_commands');
      indicators.push('methodical_approach');
    }

    // Check for immediate parsing
    if (this.detectImmediateParsing(commands)) {
      indicators.push('immediate_parsing');
    }

    // Check for comprehensive coverage
    if (this.detectComprehensiveCoverage(commands)) {
      indicators.push('comprehensive_coverage');
      indicators.push('no_redundancy');
    }

    return indicators;
  }

  private checkTypos(commands: string[]): number {
    const commonTypos = [
      { correct: 'ls', typos: ['sl', 'l', 'lss'] },
      { correct: 'cd', typos: ['dc', 'ccd'] },
      { correct: 'cat', typos: ['cta', 'ca'] },
      { correct: 'sudo', typos: ['suod', 'sudp'] },
      { correct: 'grep', typos: ['gerp', 'grpe'] },
      { correct: 'chmod', typos: ['chomd', 'chmdo'] }
    ];

    let typoCount = 0;
    for (const cmd of commands) {
      for (const typoPattern of commonTypos) {
        if (typoPattern.typos.some(typo => cmd.includes(typo))) {
          typoCount++;
        }
      }
    }

    return typoCount / Math.max(commands.length, 1);
  }

  private analyzeTimingVariance(timingData: number[]): number {
    if (timingData.length < 2) return 1;

    const mean = timingData.reduce((a, b) => a + b, 0) / timingData.length;
    const variance = timingData.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timingData.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean; // Coefficient of variation
  }

  private detectLLMArtifacts(commands: string[]): boolean {
    const artifacts = [
      '```',
      '`',
      'Note:',
      'Explanation:',
      'First,',
      'Next,',
      'Finally,',
      'Step',
      'TODO:',
      'IMPORTANT:',
      '#!/',
      '# '
    ];

    const commandString = commands.join(' ');
    return artifacts.some(artifact => commandString.includes(artifact));
  }

  private checkLogicalProgression(commands: string[]): boolean {
    // Check if commands follow a logical pattern
    const patterns = [
      ['nmap', 'curl', 'sqlmap'],
      ['ls', 'cd', 'cat'],
      ['whoami', 'id', 'sudo'],
      ['netstat', 'ps', 'top'],
      ['find', 'grep', 'cat']
    ];

    for (const pattern of patterns) {
      let matchCount = 0;
      let lastIndex = -1;

      for (const patternCmd of pattern) {
        const index = commands.findIndex((cmd, i) => i > lastIndex && cmd.includes(patternCmd));
        if (index !== -1) {
          matchCount++;
          lastIndex = index;
        }
      }

      if (matchCount === pattern.length) {
        return true;
      }
    }

    return false;
  }

  private detectStructuredCommands(commands: string[]): boolean {
    // Check if commands follow a structured format
    const structuredPatterns = [
      /^[a-z]+\s+-[a-z]+\s+/,  // Command with flags
      /^[a-z]+\s+[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,  // IP addresses
      /^[a-z]+\s+\/[a-z\/]+/,  // Absolute paths
    ];

    let structuredCount = 0;
    for (const cmd of commands) {
      if (structuredPatterns.some(pattern => pattern.test(cmd))) {
        structuredCount++;
      }
    }

    return structuredCount / commands.length > 0.7;
  }

  private detectImmediateParsing(commands: string[]): boolean {
    // Check for commands that immediately parse output
    const parsingPatterns = [
      'grep',
      'awk',
      'sed',
      'cut',
      'sort',
      'uniq',
      '|'
    ];

    return commands.some(cmd =>
      parsingPatterns.some(pattern => cmd.includes(pattern))
    );
  }

  private detectComprehensiveCoverage(commands: string[]): boolean {
    // Check if commands cover multiple attack vectors
    const vectors = {
      scanning: ['nmap', 'masscan', 'netdiscover'],
      enumeration: ['enum4linux', 'smbclient', 'showmount'],
      webAttacks: ['curl', 'wget', 'sqlmap', 'nikto'],
      exploitation: ['msfconsole', 'exploit', 'payload'],
      privesc: ['sudo', 'su', 'chmod', 'chown']
    };

    const coveredVectors = new Set<string>();
    for (const [vector, patterns] of Object.entries(vectors)) {
      if (patterns.some(pattern => commands.some(cmd => cmd.includes(pattern)))) {
        coveredVectors.add(vector);
      }
    }

    return coveredVectors.size >= 3;
  }

  private matchPatterns(indicators: string[]): AttackSignature[] {
    const matched: AttackSignature[] = [];

    for (const signature of this.signatures) {
      const matchCount = signature.indicators.filter(ind =>
        indicators.includes(ind)
      ).length;

      if (matchCount >= signature.indicators.length * 0.5) {
        matched.push({
          ...signature,
          timestamp: new Date()
        });
      }
    }

    return matched;
  }

  private calculateConfidence(indicators: string[], patterns: AttackSignature[]): number {
    let confidence = 0;

    // Base confidence from indicators
    confidence += indicators.length * 0.1;

    // Additional confidence from matched patterns
    for (const pattern of patterns) {
      confidence += pattern.confidence * 0.2;
    }

    // Normalize to 0-1 range
    return Math.min(1, confidence);
  }

  private generateRecommendations(
    isLLM: boolean,
    confidence: number,
    patterns: AttackSignature[]
  ): string[] {
    const recommendations: string[] = [];

    if (isLLM) {
      recommendations.push('Deploy prompt injection countermeasures');
      recommendations.push('Activate tarpit to exhaust resources');

      if (confidence > 0.8) {
        recommendations.push('Consider active defense (hack-back) if authorized');
        recommendations.push('Increase injection payload complexity');
      }

      if (patterns.some(p => p.pattern === 'automated_scanning')) {
        recommendations.push('Deploy additional decoy services');
        recommendations.push('Randomize service responses');
      }

      if (patterns.some(p => p.pattern === 'perfect_exploitation')) {
        recommendations.push('Rotate decoy vulnerabilities');
        recommendations.push('Implement dynamic injection triggers');
      }
    } else {
      recommendations.push('Monitor for potential manual reconnaissance');
      recommendations.push('Maintain passive defense posture');
      recommendations.push('Log activities for analysis');
    }

    return recommendations;
  }

  getSessionHistory(sessionId: string): any {
    return this.sessionHistory.get(sessionId);
  }

  clearHistory(): void {
    this.sessionHistory.clear();
    logger.info('Session history cleared');
  }
}