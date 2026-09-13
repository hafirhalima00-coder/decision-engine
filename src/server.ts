import express, { Request, Response } from 'express';
import path from 'path';
import { DecisionEngineCore } from './core/engine';
import { genId } from './core/uuid';
import { Action, Context } from './core/types';

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const engine = new DecisionEngineCore();

app.post('/api/decision', async (req: Request, res: Response) => {
  try {
    const { action, context } = req.body;

    if (!action || !context) {
      res.status(400).json({ error: 'Missing action or context' });
      return;
    }

    const actionWithTimestamp: Action = {
      ...action,
      id: action.id || genId(),
      timestamp: new Date()
    };

    const result = await engine.makeDecision(actionWithTimestamp, context);
    res.json(result);
  } catch (error) {
    console.error('Decision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/decisions', (req: Request, res: Response) => {
  const { domain, decision } = req.query;

  let decisions;
  if (domain) {
    decisions = engine.getDecisionsByDomain(domain as string);
  } else {
    decisions = engine.getAllDecisions();
  }

  if (decision) {
    decisions = decisions.filter(d => d.decision === decision);
  }

  res.json(decisions);
});

app.get('/api/decisions/:id', (req: Request, res: Response) => {
  const decision = engine.getDecision(req.params.id as string);
  if (!decision) {
    res.status(404).json({ error: 'Decision not found' });
    return;
  }
  res.json(decision);
});

app.get('/api/statistics', (req: Request, res: Response) => {
  const stats = engine.getStatistics();
  res.json(stats);
});

app.get('/api/domains', (req: Request, res: Response) => {
  const domains = engine.getAvailableDomains();
  res.json(domains);
});

export default app;
export { app, engine };
