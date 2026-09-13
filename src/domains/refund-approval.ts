import { DomainAdapter, Action, Context, Signals } from '../core/types';

export class RefundApprovalAdapter implements DomainAdapter {
  name = 'refund-approval';

  async extractSignals(action: Action, context: Context): Promise<Signals> {
    const amount = action.parameters.amount as number || 0;
    const reason = action.parameters.reason as string || '';
    const orderAge = action.parameters.orderAgeDays as number || 0;

    let riskScore = 0.4;
    let confidence = 0.5;

    if (amount > 1000) riskScore += 0.3;
    else if (amount > 500) riskScore += 0.2;
    else if (amount > 100) riskScore += 0.1;

    if (orderAge > 90) riskScore += 0.2;
    if (orderAge > 30) riskScore += 0.1;

    const validReasons = ['defective', 'wrong_item', 'not_as_described', 'changed_mind'];
    if (validReasons.includes(reason)) {
      confidence += 0.2;
      riskScore -= 0.1;
    }

    if (context.userHistory.successRate > 0.9 && context.userHistory.violations === 0) {
      confidence += 0.2;
      riskScore -= 0.1;
    }

    const missingInformation: string[] = [];
    if (!action.parameters.orderId) missingInformation.push('Order ID');
    if (!action.parameters.reason) missingInformation.push('Refund reason');
    if (amount === 0) missingInformation.push('Refund amount');

    return {
      confidence: Math.min(1, confidence),
      riskScore: Math.min(1, Math.max(0, riskScore)),
      riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : riskScore < 0.8 ? 'high' : 'critical',
      evidenceStrength: context.evidence.length > 0 ? 0.8 : 0.2,
      missingInformation,
      reversibility: 0.6,
      policyAlignment: 0.8,
      userTrustScore: context.userHistory.trustScore
    };
  }

  getRequiredEvidence(): string[] {
    return ['order_data', 'return_policy', 'customer_history', 'fraud_check'];
  }

  getRiskFactors(): string[] {
    return ['refund_amount', 'order_age', 'refund_reason', 'customer_history'];
  }
}
