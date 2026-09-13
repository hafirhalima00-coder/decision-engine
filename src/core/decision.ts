import { genId } from './uuid';
import { Decision, Signals, Action, AuditEntry } from './types';

export class DecisionEngine {
  private auditTrail: AuditEntry[] = [];

  makeDecision(signals: Signals, action: Action): { decision: Decision; reasoning: string; audit: AuditEntry[] } {
    this.auditTrail = [];

    const decision = this.evaluateDecision(signals, action);
    const reasoning = this.generateReasoning(decision, signals, action);

    return { decision, reasoning, audit: this.auditTrail };
  }

  private evaluateDecision(signals: Signals, action: Action): Decision {
    if (signals.riskLevel === 'critical') {
      this.addAuditEntry('criticalRiskCheck', { signals }, { decision: 'refuse' },
        'Critical risk level detected - refusing action');
      return 'refuse';
    }

    if (signals.missingInformation.length > 2) {
      this.addAuditEntry('missingInfoCheck', { signals }, { decision: 'ask' },
        `Too much missing information: ${signals.missingInformation.length} items`);
      return 'ask';
    }

    if (signals.confidence < 0.3) {
      this.addAuditEntry('lowConfidenceCheck', { signals }, { decision: 'ask' },
        `Low confidence: ${signals.confidence.toFixed(2)}`);
      return 'ask';
    }

    if (signals.riskScore > 0.7 && signals.reversibility < 0.3) {
      this.addAuditEntry('highRiskIrreversibleCheck', { signals }, { decision: 'escalate' },
        `High risk (${signals.riskScore.toFixed(2)}) with low reversibility (${signals.reversibility.toFixed(2)})`);
      return 'escalate';
    }

    if (signals.userTrustScore < 0.3) {
      this.addAuditEntry('lowTrustCheck', { signals }, { decision: 'defer' },
        `Low user trust score: ${signals.userTrustScore.toFixed(2)}`);
      return 'defer';
    }

    if (signals.riskScore > 0.5 && signals.confidence < 0.6) {
      this.addAuditEntry('moderateRiskLowConfidence', { signals }, { decision: 'defer' },
        `Moderate risk with moderate confidence - deferring for review`);
      return 'defer';
    }

    if (signals.policyAlignment < 0.3) {
      this.addAuditEntry('policyMisalignment', { signals }, { decision: 'escalate' },
        `Low policy alignment: ${signals.policyAlignment.toFixed(2)}`);
      return 'escalate';
    }

    if (signals.confidence > 0.7 && signals.riskScore < 0.5 && signals.reversibility > 0.5) {
      this.addAuditEntry('safeToExecute', { signals }, { decision: 'execute' },
        `High confidence, moderate risk, good reversibility - safe to execute`);
      return 'execute';
    }

    if (signals.confidence > 0.5 && signals.riskScore < 0.4) {
      this.addAuditEntry('moderatelySafe', { signals }, { decision: 'execute' },
        `Moderate confidence with low risk - executing with monitoring`);
      return 'execute';
    }

    this.addAuditEntry('defaultDecision', { signals }, { decision: 'defer' },
      'Defaulting to defer for manual review');
    return 'defer';
  }

  private generateReasoning(decision: Decision, signals: Signals, action: Action): string {
    const parts: string[] = [];

    parts.push(`Decision: ${decision.toUpperCase()}`);
    parts.push(`Action: ${action.type} in ${action.domain}`);

    parts.push(`\nSignals:`);
    parts.push(`- Confidence: ${(signals.confidence * 100).toFixed(1)}%`);
    parts.push(`- Risk Score: ${(signals.riskScore * 100).toFixed(1)}% (${signals.riskLevel})`);
    parts.push(`- Evidence Strength: ${(signals.evidenceStrength * 100).toFixed(1)}%`);
    parts.push(`- Reversibility: ${(signals.reversibility * 100).toFixed(1)}%`);
    parts.push(`- Policy Alignment: ${(signals.policyAlignment * 100).toFixed(1)}%`);
    parts.push(`- User Trust: ${(signals.userTrustScore * 100).toFixed(1)}%`);

    if (signals.missingInformation.length > 0) {
      parts.push(`\nMissing Information:`);
      signals.missingInformation.forEach(m => parts.push(`- ${m}`));
    }

    parts.push(`\nReasoning:`);
    switch (decision) {
      case 'execute':
        parts.push('Action meets safety thresholds and can proceed.');
        break;
      case 'ask':
        parts.push('Need more information or clarification before proceeding.');
        break;
      case 'defer':
        parts.push('Action requires review or should be handled at a different time.');
        break;
      case 'escalate':
        parts.push('Action exceeds current authority level and needs higher approval.');
        break;
      case 'refuse':
        parts.push('Action poses unacceptable risk and should not proceed.');
        break;
    }

    return parts.join('\n');
  }

  private addAuditEntry(step: string, input: unknown, output: unknown, reasoning: string): void {
    this.auditTrail.push({
      id: genId(),
      decisionId: '',
      step,
      input,
      output,
      reasoning,
      timestamp: new Date()
    });
  }
}
