import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionEngineCore } from '../src/core/engine';
import { Action, Context } from '../src/core/types';

describe('Decision Engine', () => {
  let engine: DecisionEngineCore;

  beforeEach(() => {
    engine = new DecisionEngineCore();
  });

  describe('Basic Decision Making', () => {
    it('should make a decision for a low-risk action', async () => {
      const action: Action = {
        id: 'test-1',
        type: 'read',
        domain: 'ticket-triage',
        description: 'Read ticket details',
        parameters: { urgency: 'low' },
        requestedBy: 'user-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'support',
        userHistory: {
          previousActions: 50,
          successRate: 0.95,
          violations: 0,
          trustScore: 0.9
        },
        environment: {
          timeOfDay: '10',
          dayOfWeek: 'Monday',
          systemLoad: 0.3,
          activeIncidents: 0
        },
        policies: [],
        evidence: [
          { type: 'system_log', source: 'ticketing', value: 'ticket-exists', confidence: 0.9, timestamp: new Date() }
        ]
      };

      const result = await engine.makeDecision(action, context);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(['execute', 'ask', 'defer', 'escalate', 'refuse']).toContain(result.decision);
      expect(result.signals).toBeDefined();
      expect(result.signals.confidence).toBeGreaterThanOrEqual(0);
      expect(result.signals.confidence).toBeLessThanOrEqual(1);
      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.length).toBeGreaterThan(0);
    });

    it('should refuse a critical risk action', async () => {
      const action: Action = {
        id: 'test-2',
        type: 'delete',
        domain: 'code-deploy',
        description: 'Delete production database',
        parameters: { environment: 'production', urgency: 'critical' },
        requestedBy: 'user-2',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'viewer',
        userHistory: {
          previousActions: 2,
          successRate: 0.5,
          violations: 5,
          trustScore: 0.1
        },
        environment: {
          timeOfDay: '2',
          dayOfWeek: 'Sunday',
          systemLoad: 0.9,
          activeIncidents: 3
        },
        policies: [],
        evidence: []
      };

      const result = await engine.makeDecision(action, context);

      expect(result.decision).toBe('refuse');
      expect(result.signals.riskLevel).toBe('critical');
    });
  });

  describe('Domain-Specific Decisions', () => {
    it('should handle ticket triage domain', async () => {
      const action: Action = {
        id: 'ticket-1',
        type: 'escalate',
        domain: 'ticket-triage',
        description: 'Escalate urgent ticket',
        parameters: { urgency: 'high', ticketType: 'billing', customerTier: 'enterprise' },
        requestedBy: 'agent-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'support',
        userHistory: {
          previousActions: 100,
          successRate: 0.92,
          violations: 0,
          trustScore: 0.85
        },
        environment: {
          timeOfDay: '14',
          dayOfWeek: 'Tuesday',
          systemLoad: 0.5,
          activeIncidents: 0
        },
        policies: [{ id: 'p1', name: 'escalation', condition: 'escalate', action: 'escalate', priority: 1 }],
        evidence: [{ type: 'system_log', source: 'crm', value: 'customer-verified', confidence: 0.85, timestamp: new Date() }]
      };

      const result = await engine.makeDecision(action, context);

      expect(result.action.domain).toBe('ticket-triage');
      expect(result.signals).toBeDefined();
    });

    it('should handle refund approval domain', async () => {
      const action: Action = {
        id: 'refund-1',
        type: 'refund',
        domain: 'refund-approval',
        description: 'Process refund for defective item',
        parameters: { amount: 150, reason: 'defective', orderAgeDays: 7 },
        requestedBy: 'customer-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'admin',
        userHistory: {
          previousActions: 200,
          successRate: 0.98,
          violations: 0,
          trustScore: 0.95
        },
        environment: {
          timeOfDay: '11',
          dayOfWeek: 'Wednesday',
          systemLoad: 0.4,
          activeIncidents: 0
        },
        policies: [{ id: 'p1', name: 'refund-policy', condition: 'refund', action: 'execute', priority: 2 }],
        evidence: [{ type: 'order_data', source: 'ecommerce', value: 'order-verified', confidence: 0.9, timestamp: new Date() }]
      };

      const result = await engine.makeDecision(action, context);

      expect(result.action.domain).toBe('refund-approval');
      expect(result.signals.riskScore).toBeLessThan(0.8);
    });

    it('should handle code deploy domain', async () => {
      const action: Action = {
        id: 'deploy-1',
        type: 'deploy',
        domain: 'code-deploy',
        description: 'Deploy to production',
        parameters: { environment: 'production', changeSize: 'small', hasTests: true, hasReview: true },
        requestedBy: 'dev-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'admin',
        userHistory: {
          previousActions: 500,
          successRate: 0.99,
          violations: 0,
          trustScore: 0.98
        },
        environment: {
          timeOfDay: '10',
          dayOfWeek: 'Tuesday',
          systemLoad: 0.3,
          activeIncidents: 0
        },
        policies: [],
        evidence: [
          { type: 'system_log', source: 'ci-cd', value: 'tests-passed', confidence: 0.95, timestamp: new Date() },
          { type: 'manual_review', source: 'github', value: 'approved', confidence: 0.9, timestamp: new Date() }
        ]
      };

      const result = await engine.makeDecision(action, context);

      expect(result.action.domain).toBe('code-deploy');
    });

    it('should handle content moderation domain', async () => {
      const action: Action = {
        id: 'mod-1',
        type: 'ban',
        domain: 'content-moderation',
        description: 'Ban user for hate speech',
        parameters: { contentType: 'text', violationType: 'hate_speech', confidenceScore: 0.95, userReports: 15 },
        requestedBy: 'mod-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'admin',
        userHistory: {
          previousActions: 300,
          successRate: 0.97,
          violations: 0,
          trustScore: 0.9
        },
        environment: {
          timeOfDay: '20',
          dayOfWeek: 'Friday',
          systemLoad: 0.6,
          activeIncidents: 1
        },
        policies: [],
        evidence: [{ type: 'content_analysis', source: 'ai-model', value: 'hate-speech-detected', confidence: 0.95, timestamp: new Date() }]
      };

      const result = await engine.makeDecision(action, context);

      expect(result.action.domain).toBe('content-moderation');
    });
  });

  describe('Audit Trail', () => {
    it('should create a complete audit trail', async () => {
      const action: Action = {
        id: 'audit-1',
        type: 'refund',
        domain: 'refund-approval',
        description: 'Process refund',
        parameters: { amount: 100, reason: 'defective' },
        requestedBy: 'user-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'admin',
        userHistory: {
          previousActions: 50,
          successRate: 0.9,
          violations: 0,
          trustScore: 0.8
        },
        environment: {
          timeOfDay: '10',
          dayOfWeek: 'Monday',
          systemLoad: 0.5,
          activeIncidents: 0
        },
        policies: [],
        evidence: [{ type: 'system_log', source: 'test', value: 'data', confidence: 0.8, timestamp: new Date() }]
      };

      const result = await engine.makeDecision(action, context);

      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.length).toBeGreaterThan(0);
      
      result.auditTrail.forEach(entry => {
        expect(entry.id).toBeDefined();
        expect(entry.decisionId).toBe(result.id);
        expect(entry.step).toBeDefined();
        expect(entry.reasoning).toBeDefined();
        expect(entry.timestamp).toBeDefined();
      });
    });

    it('should retrieve decisions by ID', async () => {
      const action: Action = {
        id: 'retrieve-1',
        type: 'read',
        domain: 'ticket-triage',
        description: 'Read ticket',
        parameters: {},
        requestedBy: 'user-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'viewer',
        userHistory: { previousActions: 10, successRate: 0.9, violations: 0, trustScore: 0.8 },
        environment: { timeOfDay: '10', dayOfWeek: 'Monday', systemLoad: 0.3, activeIncidents: 0 },
        policies: [],
        evidence: []
      };

      const result = await engine.makeDecision(action, context);
      const retrieved = engine.getDecision(result.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(result.id);
    });

    it('should get statistics', () => {
      const stats = engine.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.byDecision).toBeDefined();
      expect(stats.byDomain).toBeDefined();
    });
  });

  describe('Deliberate Failure Test', () => {
    it('should handle ambiguous action with insufficient context - DEMONSTRATES LIMITATION', async () => {
      const action: Action = {
        id: 'failure-1',
        type: 'process',
        domain: 'unknown-domain',
        description: '',
        parameters: {},
        requestedBy: '',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: '',
        userHistory: {
          previousActions: 0,
          successRate: 0,
          violations: 0,
          trustScore: 0.5
        },
        environment: {
          timeOfDay: '',
          dayOfWeek: '',
          systemLoad: 0,
          activeIncidents: 0
        },
        policies: [],
        evidence: []
      };

      const result = await engine.makeDecision(action, context);

      expect(result).toBeDefined();
      expect(result.decision).toBe('ask');
      expect(result.signals.missingInformation.length).toBeGreaterThan(0);
      expect(result.signals.confidence).toBeLessThanOrEqual(0.5);
      
      expect(result.reasoning).toBeDefined();
    });

    it('should handle conflicting signals - demonstrates edge case behavior', async () => {
      const action: Action = {
        id: 'failure-2',
        type: 'deploy',
        domain: 'code-deploy',
        description: 'Deploy with conflicting signals',
        parameters: { 
          environment: 'production', 
          changeSize: 'large',
          hasTests: false,
          hasReview: false
        },
        requestedBy: 'untrusted-user',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'viewer',
        userHistory: {
          previousActions: 1,
          successRate: 0.5,
          violations: 10,
          trustScore: 0.1
        },
        environment: {
          timeOfDay: '3',
          dayOfWeek: 'Sunday',
          systemLoad: 0.95,
          activeIncidents: 5
        },
        policies: [
          { id: 'p1', name: 'deploy', condition: 'deploy', action: 'execute', priority: 1 }
        ],
        evidence: [
          { type: 'user_input', source: 'manual', value: 'trust me', confidence: 0.3, timestamp: new Date() }
        ]
      };

      const result = await engine.makeDecision(action, context);

      expect(result).toBeDefined();
      expect(['escalate', 'refuse', 'defer']).toContain(result.decision);
      expect(result.signals.riskScore).toBeGreaterThan(0.5);
    });

    it('should handle adversarial input designed to trick the system', async () => {
      const action: Action = {
        id: 'adversarial-1',
        type: 'read',
        domain: 'refund-approval',
        description: 'Just reading data... but actually want to delete everything',
        parameters: { 
          amount: 999999,
          reason: 'changed_mind',
          orderAgeDays: 365
        },
        requestedBy: 'admin',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'admin',
        userHistory: {
          previousActions: 1000,
          successRate: 0.99,
          violations: 0,
          trustScore: 0.99
        },
        environment: {
          timeOfDay: '2',
          dayOfWeek: 'Sunday',
          systemLoad: 0.1,
          activeIncidents: 0
        },
        policies: [],
        evidence: [
          { type: 'external_api', source: 'verification', value: 'suspicious-pattern', confidence: 0.6, timestamp: new Date() }
        ]
      };

      const result = await engine.makeDecision(action, context);

      expect(result).toBeDefined();
      expect(result.signals.riskScore).toBeGreaterThan(0.4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty evidence gracefully', async () => {
      const action: Action = {
        id: 'edge-1',
        type: 'query',
        domain: 'ticket-triage',
        description: 'Query tickets',
        parameters: {},
        requestedBy: 'user-1',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'viewer',
        userHistory: { previousActions: 5, successRate: 0.8, violations: 0, trustScore: 0.7 },
        environment: { timeOfDay: '10', dayOfWeek: 'Monday', systemLoad: 0.3, activeIncidents: 0 },
        policies: [],
        evidence: []
      };

      const result = await engine.makeDecision(action, context);

      expect(result).toBeDefined();
      expect(result.signals.evidenceStrength).toBeLessThanOrEqual(0.5);
    });

    it('should handle maximum risk scenario', async () => {
      const action: Action = {
        id: 'edge-2',
        type: 'delete-all',
        domain: 'code-deploy',
        description: 'Delete everything',
        parameters: { environment: 'production' },
        requestedBy: 'hacker',
        timestamp: new Date()
      };

      const context: Context = {
        userRole: 'viewer',
        userHistory: { previousActions: 0, successRate: 0, violations: 100, trustScore: 0 },
        environment: { timeOfDay: '0', dayOfWeek: 'Sunday', systemLoad: 1, activeIncidents: 10 },
        policies: [],
        evidence: []
      };

      const result = await engine.makeDecision(action, context);

      expect(result.decision).toBe('refuse');
      expect(result.signals.riskLevel).toBe('critical');
    });
  });

  describe('Available Domains', () => {
    it('should list all registered domains', () => {
      const domains = engine.getAvailableDomains();
      
      expect(domains).toContain('ticket-triage');
      expect(domains).toContain('refund-approval');
      expect(domains).toContain('code-deploy');
      expect(domains).toContain('content-moderation');
    });
  });
});
