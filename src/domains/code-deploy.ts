import { DomainAdapter, Action, Context, Signals } from '../core/types';

export class CodeDeployAdapter implements DomainAdapter {
  name = 'code-deploy';

  async extractSignals(action: Action, context: Context): Promise<Signals> {
    const environment = action.parameters.environment as string || 'development';
    const changeSize = action.parameters.changeSize as string || 'small';
    const hasTests = action.parameters.hasTests as boolean || false;
    const hasReview = action.parameters.hasReview as boolean || false;

    let riskScore = 0.3;
    let confidence = 0.5;

    if (environment === 'production') riskScore += 0.4;
    else if (environment === 'staging') riskScore += 0.2;
    else if (environment === 'development') riskScore += 0.0;

    if (changeSize === 'large') riskScore += 0.2;
    if (changeSize === 'medium') riskScore += 0.1;

    if (hasTests) {
      confidence += 0.2;
      riskScore -= 0.1;
    }

    if (hasReview) {
      confidence += 0.2;
      riskScore -= 0.1;
    }

    if (context.environment.systemLoad > 0.8) {
      riskScore += 0.2;
    }

    if (context.environment.activeIncidents > 0) {
      riskScore += 0.3;
    }

    const missingInformation: string[] = [];
    if (!action.parameters.environment) missingInformation.push('Target environment');
    if (!action.parameters.commitHash) missingInformation.push('Commit hash');
    if (!action.parameters.repository) missingInformation.push('Repository');

    return {
      confidence: Math.min(1, confidence),
      riskScore: Math.min(1, Math.max(0, riskScore)),
      riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : riskScore < 0.8 ? 'high' : 'critical',
      evidenceStrength: context.evidence.length > 0 ? 0.7 : 0.3,
      missingInformation,
      reversibility: environment === 'production' ? 0.3 : 0.7,
      policyAlignment: 0.6,
      userTrustScore: context.userHistory.trustScore
    };
  }

  getRequiredEvidence(): string[] {
    return ['test_results', 'code_review', 'deployment_history', 'system_health'];
  }

  getRiskFactors(): string[] {
    return ['environment', 'change_size', 'test_coverage', 'review_status', 'system_load'];
  }
}
