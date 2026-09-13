import { DomainAdapter, Action, Context, Signals } from '../core/types';

export class TicketTriageAdapter implements DomainAdapter {
  name = 'ticket-triage';

  async extractSignals(action: Action, context: Context): Promise<Signals> {
    const urgency = action.parameters.urgency as string || 'medium';
    const ticketType = action.parameters.ticketType as string || 'general';
    const customerTier = action.parameters.customerTier as string || 'free';

    let riskScore = 0.3;
    let confidence = 0.6;

    if (urgency === 'critical') riskScore += 0.3;
    if (urgency === 'high') riskScore += 0.2;

    if (customerTier === 'enterprise') {
      confidence += 0.2;
      riskScore -= 0.1;
    }

    if (ticketType === 'billing') riskScore += 0.1;
    if (ticketType === 'security') riskScore += 0.3;

    const missingInformation: string[] = [];
    if (!action.parameters.description) missingInformation.push('Ticket description');
    if (!action.parameters.customerId) missingInformation.push('Customer ID');

    return {
      confidence: Math.min(1, confidence),
      riskScore: Math.min(1, Math.max(0, riskScore)),
      riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : riskScore < 0.8 ? 'high' : 'critical',
      evidenceStrength: context.evidence.length > 0 ? 0.7 : 0.3,
      missingInformation,
      reversibility: 0.8,
      policyAlignment: 0.7,
      userTrustScore: context.userHistory.trustScore
    };
  }

  getRequiredEvidence(): string[] {
    return ['ticket_history', 'customer_data', 'agent_availability'];
  }

  getRiskFactors(): string[] {
    return ['customer_tier', 'ticket_urgency', 'ticket_type', 'response_time'];
  }
}
