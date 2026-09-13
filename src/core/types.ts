export type Decision = 'execute' | 'ask' | 'defer' | 'escalate' | 'refuse';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Action {
  id: string;
  type: string;
  domain: string;
  description: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  timestamp: Date;
}

export interface Context {
  userRole: string;
  userHistory: UserHistory;
  environment: Environment;
  policies: Policy[];
  evidence: Evidence[];
}

export interface UserHistory {
  previousActions: number;
  successRate: number;
  violations: number;
  trustScore: number;
}

export interface Environment {
  timeOfDay: string;
  dayOfWeek: string;
  systemLoad: number;
  activeIncidents: number;
}

export interface Policy {
  id: string;
  name: string;
  condition: string;
  action: Decision;
  priority: number;
}

export interface Evidence {
  type: string;
  source: string;
  value: unknown;
  confidence: number;
  timestamp: Date;
}

export interface Signals {
  confidence: number;
  riskScore: number;
  riskLevel: RiskLevel;
  evidenceStrength: number;
  missingInformation: string[];
  reversibility: number;
  policyAlignment: number;
  userTrustScore: number;
}

export interface DecisionResult {
  id: string;
  action: Action;
  decision: Decision;
  signals: Signals;
  reasoning: string;
  timestamp: Date;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  decisionId: string;
  step: string;
  input: unknown;
  output: unknown;
  reasoning: string;
  timestamp: Date;
}

export interface DomainAdapter {
  name: string;
  extractSignals(action: Action, context: Context): Promise<Signals>;
  getRequiredEvidence(): string[];
  getRiskFactors(): string[];
}
