import { v4 as uuidv4 } from 'uuid';
import { DecisionResult, AuditEntry } from './types';

export class AuditTrail {
  private decisions: Map<string, DecisionResult> = new Map();

  recordDecision(result: DecisionResult): void {
    this.decisions.set(result.id, result);
  }

  getDecision(id: string): DecisionResult | undefined {
    return this.decisions.get(id);
  }

  getAllDecisions(): DecisionResult[] {
    return Array.from(this.decisions.values());
  }

  getDecisionsByDomain(domain: string): DecisionResult[] {
    return this.getAllDecisions().filter(d => d.action.domain === domain);
  }

  getDecisionsByDecision(decision: string): DecisionResult[] {
    return this.getAllDecisions().filter(d => d.decision === decision);
  }

  getDecisionsByTimeRange(start: Date, end: Date): DecisionResult[] {
    return this.getAllDecisions().filter(d => {
      const timestamp = new Date(d.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  getStatistics(): {
    total: number;
    byDecision: Record<string, number>;
    byDomain: Record<string, number>;
    averageConfidence: number;
    averageRiskScore: number;
  } {
    const decisions = this.getAllDecisions();
    
    const byDecision: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    let totalConfidence = 0;
    let totalRiskScore = 0;

    decisions.forEach(d => {
      byDecision[d.decision] = (byDecision[d.decision] || 0) + 1;
      byDomain[d.action.domain] = (byDomain[d.action.domain] || 0) + 1;
      totalConfidence += d.signals.confidence;
      totalRiskScore += d.signals.riskScore;
    });

    return {
      total: decisions.length,
      byDecision,
      byDomain,
      averageConfidence: decisions.length > 0 ? totalConfidence / decisions.length : 0,
      averageRiskScore: decisions.length > 0 ? totalRiskScore / decisions.length : 0
    };
  }

  createDecisionResult(
    action: any,
    decision: any,
    signals: any,
    reasoning: string,
    auditEntries: AuditEntry[]
  ): DecisionResult {
    const id = uuidv4();
    
    const updatedAuditEntries = auditEntries.map(entry => ({
      ...entry,
      decisionId: id
    }));

    const result: DecisionResult = {
      id,
      action,
      decision,
      signals,
      reasoning,
      timestamp: new Date(),
      auditTrail: updatedAuditEntries
    };

    this.recordDecision(result);
    return result;
  }
}
