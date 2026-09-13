import { v4 as uuidv4 } from 'uuid';
import { SignalExtractor } from './signals';
import { DecisionEngine } from './decision';
import { AuditTrail } from './audit';
import { 
  Action, 
  Context, 
  DecisionResult, 
  DomainAdapter,
  Decision,
  Signals,
  AuditEntry
} from './types';

import { TicketTriageAdapter } from '../domains/ticket-triage';
import { RefundApprovalAdapter } from '../domains/refund-approval';
import { CodeDeployAdapter } from '../domains/code-deploy';
import { ContentModerationAdapter } from '../domains/content-moderation';

export class DecisionEngineCore {
  private signalExtractor: SignalExtractor;
  private decisionEngine: DecisionEngine;
  private auditTrail: AuditTrail;
  private adapters: Map<string, DomainAdapter>;

  constructor() {
    this.signalExtractor = new SignalExtractor();
    this.decisionEngine = new DecisionEngine();
    this.auditTrail = new AuditTrail();
    this.adapters = new Map();

    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    this.registerAdapter(new TicketTriageAdapter());
    this.registerAdapter(new RefundApprovalAdapter());
    this.registerAdapter(new CodeDeployAdapter());
    this.registerAdapter(new ContentModerationAdapter());
  }

  registerAdapter(adapter: DomainAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  async makeDecision(action: Action, context: Context): Promise<DecisionResult> {
    const adapter = this.adapters.get(action.domain);
    
    let signals: Signals;
    let signalAudit: AuditEntry[] = [];

    if (adapter) {
      const domainSignals = await adapter.extractSignals(action, context);
      const baseSignals = await this.signalExtractor.extractSignals(action, context);
      
      signals = this.mergeSignals(baseSignals.signals, domainSignals);
      signalAudit = baseSignals.audit;
    } else {
      const result = await this.signalExtractor.extractSignals(action, context);
      signals = result.signals;
      signalAudit = result.audit;
    }

    const decisionResult = this.decisionEngine.makeDecision(signals, action);
    const allAudit = [...signalAudit, ...decisionResult.audit];

    const result = this.auditTrail.createDecisionResult(
      action,
      decisionResult.decision,
      signals,
      decisionResult.reasoning,
      allAudit
    );

    return result;
  }

  private mergeSignals(base: Signals, domain: Signals): Signals {
    return {
      confidence: (base.confidence + domain.confidence) / 2,
      riskScore: (base.riskScore + domain.riskScore) / 2,
      riskLevel: base.riskScore > domain.riskScore ? base.riskLevel : domain.riskLevel,
      evidenceStrength: (base.evidenceStrength + domain.evidenceStrength) / 2,
      missingInformation: [...new Set([...base.missingInformation, ...domain.missingInformation])],
      reversibility: (base.reversibility + domain.reversibility) / 2,
      policyAlignment: (base.policyAlignment + domain.policyAlignment) / 2,
      userTrustScore: base.userTrustScore
    };
  }

  getDecision(id: string): DecisionResult | undefined {
    return this.auditTrail.getDecision(id);
  }

  getAllDecisions(): DecisionResult[] {
    return this.auditTrail.getAllDecisions();
  }

  getDecisionsByDomain(domain: string): DecisionResult[] {
    return this.auditTrail.getDecisionsByDomain(domain);
  }

  getStatistics() {
    return this.auditTrail.getStatistics();
  }

  getAvailableDomains(): string[] {
    return Array.from(this.adapters.keys());
  }
}
