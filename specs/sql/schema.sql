CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('user','operator','approver','auditor','developer');
CREATE TYPE entity_status AS ENUM ('active','inactive','suspended','quarantined','retired');
CREATE TYPE task_state AS ENUM (
  'draft','understanding','needs_clarification','researching','planning',
  'awaiting_governance','awaiting_approval','ready_to_execute','executing',
  'completed','failed','cancelled','denied','execution_pending_reconciliation'
);
CREATE TYPE action_state AS ENUM (
  'received','validating','denied','awaiting_approval','permitted','executing',
  'succeeded','failed','unknown','compensated'
);
CREATE TYPE decision_outcome AS ENUM ('allow','deny','review','allow_with_constraints');
CREATE TYPE reservation_state AS ENUM ('pending','reserved','committed','released','expired','reconciliation_required');
CREATE TYPE permit_state AS ENUM ('issued','consumed','expired','revoked','rejected');
CREATE TYPE approval_state AS ENUM ('pending','approved','rejected','expired');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  owner_user_id uuid REFERENCES users(id),
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id),
  version text NOT NULL,
  framework text NOT NULL,
  model_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  tool_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  artifact_digest text NOT NULL,
  status entity_status NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, version)
);

CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  protocol text NOT NULL CHECK (protocol IN ('mcp','rest','a2a')),
  risk_tier text NOT NULL CHECK (risk_tier IN ('R0','R1','R2','R3','R4')),
  reversibility text NOT NULL CHECK (reversibility IN ('reversible','compensatable','irreversible')),
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id),
  version text NOT NULL,
  description_hash text NOT NULL,
  input_schema_hash text NOT NULL,
  output_schema_hash text NOT NULL,
  endpoint_ref text NOT NULL,
  status entity_status NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tool_id, version)
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  original_request text NOT NULL,
  objective text,
  constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
  state task_state NOT NULL DEFAULT 'draft',
  trace_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id),
  version integer NOT NULL,
  objective text NOT NULL,
  steps jsonb NOT NULL,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, version)
);

CREATE TABLE permission_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('user','role','agent')),
  subject_id text NOT NULL,
  capability text NOT NULL,
  resource_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  effect text NOT NULL CHECK (effect IN ('allow','deny')),
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES policies(id),
  version text NOT NULL,
  source_rego text NOT NULL,
  bundle_digest text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','validated','approved','active','rolled_back','retired')),
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_id, version)
);

CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('user','project','category','task')),
  owner_id text NOT NULL,
  currency char(3) NOT NULL,
  limit_amount numeric(18,2) NOT NULL CHECK (limit_amount >= 0),
  approval_threshold numeric(18,2),
  period_type text NOT NULL CHECK (period_type IN ('task','day','week','month','lifetime')),
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE execution_requests (
  id uuid PRIMARY KEY,
  trace_id text NOT NULL,
  task_id uuid NOT NULL REFERENCES tasks(id),
  user_id uuid NOT NULL REFERENCES users(id),
  agent_version_id uuid NOT NULL REFERENCES agent_versions(id),
  tool_version_id uuid NOT NULL REFERENCES tool_versions(id),
  operation text NOT NULL,
  resource text,
  category text,
  amount numeric(18,2),
  currency char(3),
  parameters jsonb NOT NULL,
  parameters_hash text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_hash text NOT NULL,
  nonce text NOT NULL UNIQUE,
  state action_state NOT NULL DEFAULT 'received',
  requested_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE governance_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL UNIQUE REFERENCES execution_requests(id),
  outcome decision_outcome NOT NULL,
  permission_result jsonb NOT NULL,
  reason_codes jsonb NOT NULL,
  risk_tier text NOT NULL,
  policy_version_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_bundle_digest text,
  opa_decision_id text,
  input_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES execution_requests(id),
  signal_type text NOT NULL,
  source text NOT NULL,
  score numeric(8,5),
  confidence numeric(8,5),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE budget_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL UNIQUE REFERENCES execution_requests(id),
  budget_id uuid NOT NULL REFERENCES budgets(id),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency char(3) NOT NULL,
  state reservation_state NOT NULL DEFAULT 'pending',
  redis_key text NOT NULL,
  expires_at timestamptz NOT NULL,
  committed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES execution_requests(id),
  action_hash text NOT NULL,
  required_role user_role NOT NULL DEFAULT 'approver',
  state approval_state NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  decided_by uuid REFERENCES users(id),
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE execution_permits (
  id uuid PRIMARY KEY,
  action_id uuid NOT NULL UNIQUE REFERENCES execution_requests(id),
  reservation_id uuid REFERENCES budget_reservations(id),
  token_hash text NOT NULL,
  nonce text NOT NULL UNIQUE,
  audience text NOT NULL,
  revocation_epoch bigint NOT NULL,
  state permit_state NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL,
  not_before timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  rejected_reason text
);

CREATE TABLE tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES execution_requests(id),
  permit_id uuid NOT NULL REFERENCES execution_permits(id),
  idempotency_key text NOT NULL UNIQUE,
  state text NOT NULL CHECK (state IN ('requested','executing','succeeded','failed','unknown','compensated')),
  result jsonb,
  result_hash text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revocation_epoch bigint NOT NULL DEFAULT 0,
  emergency_stop_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_state(singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('agent','task','tool','permit','system')),
  scope_id text,
  epoch bigint NOT NULL,
  reason text NOT NULL,
  issued_by uuid REFERENCES users(id),
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE decision_receipts (
  id uuid PRIMARY KEY,
  chain_index bigint NOT NULL UNIQUE,
  action_id uuid NOT NULL REFERENCES execution_requests(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  previous_receipt_hash text,
  receipt_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluation_suites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

CREATE TABLE evaluation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id uuid NOT NULL REFERENCES evaluation_suites(id),
  external_id text NOT NULL,
  title text NOT NULL,
  scenario jsonb NOT NULL,
  expected jsonb NOT NULL,
  UNIQUE(suite_id, external_id)
);

CREATE TABLE evaluation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id uuid NOT NULL REFERENCES evaluation_suites(id),
  candidate_manifest jsonb NOT NULL,
  state text NOT NULL CHECK (state IN ('queued','running','completed','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES evaluation_runs(id),
  case_id uuid NOT NULL REFERENCES evaluation_cases(id),
  actual jsonb NOT NULL,
  passed boolean NOT NULL,
  latency_ms integer,
  model_cost numeric(18,6),
  trace_id text,
  failure_reason text,
  UNIQUE(run_id, case_id)
);

CREATE INDEX idx_tasks_user_state ON tasks(user_id, state, updated_at DESC);
CREATE INDEX idx_actions_task_state ON execution_requests(task_id, state, created_at DESC);
CREATE INDEX idx_decision_action ON governance_decisions(action_id);
CREATE INDEX idx_reservations_state ON budget_reservations(state, expires_at);
CREATE INDEX idx_permits_state ON execution_permits(state, expires_at);
CREATE INDEX idx_receipts_action ON decision_receipts(action_id, chain_index);
