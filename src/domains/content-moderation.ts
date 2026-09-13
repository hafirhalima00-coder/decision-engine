import { DomainAdapter, Action, Context, Signals } from '../core/types';

export class ContentModerationAdapter implements DomainAdapter {
  name = 'content-moderation';

  async extractSignals(action: Action, context: Context): Promise<Signals> {
    const contentType = action.parameters.contentType as string || 'text';
    const violationType = action.parameters.violationType as string || '';
    const confidenceScore = action.parameters.confidenceScore as number || 0.5;
    const userReports = action.parameters.userReports as number || 0;

    let riskScore = 0.4;
    let confidence = confidenceScore;

    if (violationType === 'hate_speech' || violationType === 'harassment') riskScore += 0.3;
    if (violationType === 'spam') riskScore += 0.1;
    if (violationType === 'misinformation') riskScore += 0.2;

    if (userReports > 10) riskScore += 0.2;
    if (userReports > 5) riskScore += 0.1;

    if (contentType === 'video') riskScore += 0.1;

    if (context.userHistory.violations > 3) {
      riskScore += 0.2;
      confidence += 0.1;
    }

    const missingInformation: string[] = [];
    if (!action.parameters.contentId) missingInformation.push('Content ID');
    if (!action.parameters.content) missingInformation.push('Content text/media');
    if (!violationType) missingInformation.push('Violation type');

    return {
      confidence: Math.min(1, confidence),
      riskScore: Math.min(1, Math.max(0, riskScore)),
      riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : riskScore < 0.8 ? 'high' : 'critical',
      evidenceStrength: context.evidence.length > 0 ? 0.6 : 0.2,
      missingInformation,
      reversibility: violationType === 'spam' ? 0.8 : 0.4,
      policyAlignment: 0.7,
      userTrustScore: context.userHistory.trustScore
    };
  }

  getRequiredEvidence(): string[] {
    return ['content_analysis', 'user_history', 'report_data', 'policy_match'];
  }

  getRiskFactors(): string[] {
    return ['violation_type', 'user_reports', 'content_type', 'user_history'];
  }
}
