# The Decision Engine

An AI system that knows when it is allowed to act. Unlike most AI agents that execute every instruction, this system implements an explicit decision layer that evaluates confidence, risk, evidence, reversibility, and cost of being wrong before taking action.

## What It Does

The Decision Engine takes a proposed action + context and returns one of five decisions:

- **execute** - Action is safe to proceed
- **ask** - Need more information before acting
- **defer** - Action should be reviewed or handled later
- **escalate** - Action exceeds current authority level
- **refuse** - Action poses unacceptable risk

Each decision surfaces:
- Confidence score
- Risk score and risk level
- Evidence strength
- Missing information
- Reversibility score
- Policy alignment
- User trust score

Every decision includes a complete audit trail showing all reasoning steps.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    THE DECISION ENGINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   ACTION +   │────▶│   SIGNAL     │────▶│   DECISION   │ │
│  │   CONTEXT    │     │  EXTRACTION  │     │    LOGIC     │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │    DOMAIN    │     │    AUDIT     │     │   DECISION   │ │
│  │   ADAPTERS   │     │    TRAIL     │     │   RESULT     │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Input Flow
1. **Action** - What is being proposed (type, domain, parameters)
2. **Context** - User history, environment, policies, evidence
3. **Domain Adapter** - Domain-specific signal extraction

### Signal Extraction
- Confidence calculation based on evidence and user history
- Risk scoring based on action type, environment, and user behavior
- Evidence strength from multiple sources
- Missing information identification
- Reversibility assessment
- Policy alignment check

### Decision Logic
Priority-based evaluation:
1. Critical risk → REFUSE
2. Too much missing info → ASK
3. Low confidence → ASK
4. High risk + irreversible → ESCALATE
5. Low user trust → DEFER
6. Moderate risk + moderate confidence → DEFER
7. Low policy alignment → ESCALATE
8. High confidence + moderate risk → EXECUTE
9. Moderate confidence + low risk → EXECUTE
10. Default → DEFER

## Domains

### 1. Ticket Triage
Routes customer support tickets based on urgency, customer tier, and ticket type.

### 2. Refund Approval
Processes refund requests considering amount, reason, order age, and customer history.

### 3. Code Deploy
Manages deployment decisions based on environment, change size, test coverage, and system health.

### 4. Content Moderation
Handles content moderation decisions based on violation type, user reports, and confidence scores.

## Live Demo

**https://miss2.vercel.app** — interactive demo with all 4 domains wired in.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/hafirhalima00-coder/decision-engine.git
cd decision-engine

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:3000 in your browser to access the interactive demo.

## API Endpoints

### POST /api/decision
Make a decision on a proposed action.

**Request Body:**
```json
{
  "action": {
    "type": "refund",
    "domain": "refund-approval",
    "description": "Process refund for defective item",
    "parameters": { "amount": 150, "reason": "defective" },
    "requestedBy": "user-123"
  },
  "context": {
    "userRole": "admin",
    "userHistory": {
      "previousActions": 50,
      "successRate": 0.95,
      "violations": 0,
      "trustScore": 0.9
    },
    "environment": {
      "timeOfDay": "10",
      "dayOfWeek": "Monday",
      "systemLoad": 0.3,
      "activeIncidents": 0
    },
    "policies": [],
    "evidence": []
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "action": { ... },
  "decision": "execute",
  "signals": {
    "confidence": 0.85,
    "riskScore": 0.25,
    "riskLevel": "low",
    "evidenceStrength": 0.7,
    "missingInformation": [],
    "reversibility": 0.6,
    "policyAlignment": 0.7,
    "userTrustScore": 0.9
  },
  "reasoning": "Decision: EXECUTE\n...",
  "auditTrail": [ ... ]
}
```

### GET /api/decisions
List all decisions, optionally filtered by domain or decision type.

### GET /api/decisions/:id
Get a specific decision by ID.

### GET /api/statistics
Get aggregate statistics about all decisions.

### GET /api/domains
List all available domains.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Deliberate Failure Test

The test suite includes a deliberate failure test that demonstrates system limitations:

- **Ambiguous Input Test** - Tests behavior with insufficient context
- **Conflicting Signals Test** - Tests handling of contradictory risk signals
- **Adversarial Input Test** - Tests resistance to input designed to trick the system

These tests show that the system correctly identifies when it cannot make a safe decision and defaults to asking for more information or escalating.

## Project Structure

```
decision-engine/
├── src/
│   ├── core/
│   │   ├── types.ts           # Core type definitions
│   │   ├── signals.ts         # Signal extraction logic
│   │   ├── decision.ts        # Decision logic
│   │   ├── audit.ts           # Audit trail management
│   │   └── engine.ts          # Main engine orchestrator
│   ├── domains/
│   │   ├── ticket-triage.ts
│   │   ├── refund-approval.ts
│   │   ├── code-deploy.ts
│   │   └── content-moderation.ts
│   ├── server.ts              # Express API server
│   └── index.ts               # Package exports
├── public/
│   └── index.html             # Interactive demo UI
├── tests/
│   └── decision.test.ts       # Comprehensive test suite
├── package.json
├── tsconfig.json
└── README.md
```

## Key Design Decisions

### 1. Signal-Based Architecture
Instead of hard-coded rules, the engine uses composable signals that can be combined and weighted. This makes it extensible to new domains without changing core logic.

### 2. Domain Adapters
Each domain has its own adapter that knows how to extract domain-specific signals. This keeps domain expertise separate from core decision logic.

### 3. Audit-First Design
Every decision includes a complete audit trail showing exactly how the decision was made. This is critical for debugging, compliance, and building trust.

### 4. Graceful Degradation
When the system lacks information, it asks for more rather than guessing. When risk is too high, it refuses rather than proceeding. This is the core principle: knowing when not to act.

## Limitations

- Currently uses rule-based signal combination (not ML-based)
- Domain adapters require manual configuration for new domains
- Evidence sources are simulated (in production, would connect to real data sources)
- Policy engine is simplified (production would need full policy DSL)

## Future Directions

See [THESIS.md](./THESIS.md) for a two-year thesis on where decision layers go next.

## License

MIT
