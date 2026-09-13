import { v4 as uuidv4 } from 'uuid';
import { Action, Context, Signals, Evidence, AuditEntry } from './types';

export class SignalExtractor {
  private auditTrail: AuditEntry[] = [];

  async extractSignals(action: Action, context: Context): Promise<{ signals: Signals; audit: AuditEntry[] }> {
    this.auditTrail = [];

    const confidence = this.calculateConfidence(action, context);
    const riskScore = this.calculateRiskScore(action, context);
    const evidenceStrength = this.calculateEvidenceStrength(context.evidence);
    const missingInformation = this.identifyMissingInformation(action, context);
    const reversibility = this.calculateReversibility(action);
    const policyAlignment = this.calculatePolicyAlignment(action, context.policies);
    const userTrustScore = context.userHistory.trustScore;

    const riskLevel = this.determineRiskLevel(riskScore);

    const signals: Signals = {
      confidence,
      riskScore,
      riskLevel,
      evidenceStrength,
      missingInformation,
      reversibility,
      policyAlignment,
      userTrustScore
    };

    return { signals, audit: this.auditTrail };
  }

  private calculateConfidence(action: Action, context: Context): number {
    let confidence = 0.5;

    if (context.evidence.length > 0) {
      const avgEvidenceConfidence = context.evidence.reduce((sum, e) => sum + e.confidence, 0) / context.evidence.length;
      confidence += avgEvidenceConfidence * 0.3;
    }

    if (context.userHistory.previousActions > 10) {
      confidence += 0.1;
    }

    if (context.userHistory.successRate > 0.9) {
      confidence += 0.1;
    }

    this.addAuditEntry('calculateConfidence', { action, context }, { confidence }, 
      `Confidence calculated based on evidence strength and user history`);
    
    return Math.min(1, Math.max(0, confidence));
  }

  private calculateRiskScore(action: Action, context: Context): number {
    let risk = 0.3;

    const highRiskActions = ['delete', 'deploy', 'refund', 'ban', 'escalate'];
    if (highRiskActions.some(hra => action.type.toLowerCase().includes(hra))) {
      risk += 0.3;
    }

    if (context.environment.activeIncidents > 0) {
      risk += 0.2;
    }

    if (context.userHistory.violations > 0) {
      risk += 0.1 * Math.min(context.userHistory.violations, 3);
    }

    if (context.environment.systemLoad > 0.8) {
      risk += 0.1;
    }

    this.addAuditEntry('calculateRiskScore', { action, context }, { risk },
      `Risk calculated based on action type, environment, and user history`);

    return Math.min(1, Math.max(0, risk));
  }

  private calculateEvidenceStrength(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;

    const weights: Record<string, number> = {
      'system_log': 0.8,
      'user_input': 0.6,
      'external_api': 0.9,
      'manual_review': 0.7,
      'historical_data': 0.75
    };

    let totalWeight = 0;
    let weightedSum = 0;

    evidence.forEach(e => {
      const weight = weights[e.type] || 0.5;
      totalWeight += weight;
      weightedSum += weight * e.confidence;
    });

    const strength = totalWeight > 0 ? weightedSum / totalWeight : 0;

    this.addAuditEntry('calculateEvidenceStrength', { evidence }, { strength },
      `Evidence strength calculated from ${evidence.length} sources`);

    return Math.min(1, Math.max(0, strength));
  }

  private identifyMissingInformation(action: Action, context: Context): string[] {
    const missing: string[] = [];

    const requiredFields = ['description', 'type', 'domain'];
    requiredFields.forEach(field => {
      if (!action[field as keyof Action]) {
        missing.push(`Missing action.${field}`);
      }
    });

    if (!context.userHistory) {
      missing.push('Missing user history');
    }

    if (!context.environment) {
      missing.push('Missing environment context');
    }

    if (context.policies.length === 0) {
      missing.push('No applicable policies');
    }

    if (context.evidence.length === 0) {
      missing.push('No evidence provided');
    }

    this.addAuditEntry('identifyMissingInformation', { action, context }, { missing },
      `Identified ${missing.length} missing information items`);

    return missing;
  }

  private calculateReversibility(action: Action): number {
    const reversibleActions: Record<string, number> = {
      'read': 1.0,
      'query': 1.0,
      'search': 1.0,
      'update': 0.7,
      'modify': 0.7,
      'create': 0.5,
      'add': 0.5,
      'send': 0.3,
      'delete': 0.1,
      'remove': 0.1,
      'deploy': 0.2,
      'ban': 0.1,
      'refund': 0.4
    };

    let reversibility = 0.5;
    
    for (const [key, value] of Object.entries(reversibleActions)) {
      if (action.type.toLowerCase().includes(key)) {
        reversibility = value;
        break;
      }
    }

    this.addAuditEntry('calculateReversibility', { action }, { reversibility },
      `Reversibility score for action type: ${action.type}`);

    return reversibility;
  }

  private calculatePolicyAlignment(action: Action, policies: any[]): number {
    if (policies.length === 0) return 0.5;

    let alignedPolicies = 0;
    let totalPriority = 0;
    let alignedPriority = 0;

    policies.forEach(policy => {
      totalPriority += policy.priority;
      if (policy.condition.toLowerCase().includes(action.type.toLowerCase())) {
        alignedPolicies++;
        alignedPriority += policy.priority;
      }
    });

    const alignment = totalPriority > 0 ? alignedPriority / totalPriority : 0.5;

    this.addAuditEntry('calculatePolicyAlignment', { action, policies }, { alignment },
      `Policy alignment: ${alignedPolicies}/${policies.length} policies matched`);

    return Math.min(1, Math.max(0, alignment));
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.6) return 'medium';
    if (riskScore < 0.8) return 'high';
    return 'critical';
  }

  private addAuditEntry(step: string, input: unknown, output: unknown, reasoning: string): void {
    this.auditTrail.push({
      id: uuidv4(),
      decisionId: '',
      step,
      input,
      output,
      reasoning,
      timestamp: new Date()
    });
  }
}
