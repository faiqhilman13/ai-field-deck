/*
 * challenges.js — content data layer for the "System Design Lab" mode.
 *
 * This file is pure DATA. The app reads it via loadChallenges() (window.CHALLENGE_DB).
 * A scraper (scraper/normalize.py) appends more challenge objects here over time;
 * a future Supabase migration just changes loadChallenges() to hit an API — the
 * schema below stays identical.
 *
 * Schema (all JSON-serializable — no functions):
 *   id      : unique slug
 *   topic   : must match a topic in DOMAIN_OF (RAG / Agents / Evals / ...) for mastery
 *   title   : short name
 *   brief   : the challenge prompt shown to the user
 *   palette : [{ id, label, kind, correct, note?, trap? }]
 *             kind ∈ source|compute|gate|model|store|agent|human|control
 *             correct:false + trap:"why it's wrong" = a distractor that gets flagged
 *   forks   : [{ id, q, options:[{ id, label, best, rationale }] }]  pointed trade-offs
 *   model   : { nodes:[id...], edges:[[from,to]...], tradeoffs:[str...] }  the answer key
 *   grills  : [{ q, a }]  verbatim interview Q + the answer to give (offline grill)
 *   rubric  : [{ id, type, label, critical?, ...args }]  declarative grading rules
 *             type "present" {node}     — node must be on the canvas
 *             type "absent"  {node}     — node must NOT be on the canvas (trap)
 *             type "precedes"{from,to}  — a directed path from→to must exist
 *             type "onpath"  {node}     — node present AND wired (>=1 edge)
 */
window.CHALLENGE_DB = [
  {
    id: "rag-ingest",
    topic: "RAG",
    title: "RAG Ingestion + Serving Pipeline",
    brief: `Advisers upload firm documents (statements, factfinds, policies) to per-firm folders. Design the pipeline that ingests them and serves grounded answers — kept fresh, tenant-isolated, cheap to revise, and safe enough that a wrong figure never reaches a suitability report. Drag the components you'd use, wire the flow, and commit to the trade-offs.`,
    palette: [
      { id: "s3", label: "S3 upload (firm folder)", kind: "source", correct: true, note: "per-firm prefix" },
      { id: "worker", label: "Sidekiq ingest worker", kind: "compute", correct: true, note: "SQS event · idempotent" },
      { id: "parse", label: "Parse per doc type", kind: "compute", correct: true, note: "DOCX XML · Textract" },
      { id: "validate", label: "Validation gate", kind: "gate", correct: true, note: "confidence · tables · speaker labels" },
      { id: "quarantine", label: "Quarantine + human review", kind: "human", correct: true, note: "low-confidence docs" },
      { id: "chunk", label: "Chunk structure-first", kind: "compute", correct: true, note: "tables atomic" },
      { id: "chunkhash", label: "Chunk-hash diff", kind: "compute", correct: true, note: "changed only · ~10% re-embed" },
      { id: "embed", label: "Embed changed chunks", kind: "model", correct: true, note: "batched · versioned" },
      { id: "version", label: "Upsert vN+1 + atomic flip", kind: "store", correct: true, note: "old keeps serving · is_current N→N+1" },
      { id: "pgvector", label: "pgvector on RDS + RLS", kind: "store", correct: true, note: "firm partitions · HNSW" },
      { id: "filters", label: "Session-scoped filters", kind: "gate", correct: true, note: "firm · client · licence" },
      { id: "hybrid", label: "Hybrid retrieve (BM25+dense · RRF)", kind: "compute", correct: true },
      { id: "rerank", label: "Rerank 40 → 6–8", kind: "model", correct: true, note: "proven on a golden set" },
      { id: "generate", label: "Generate w/ evidence + citations", kind: "model", correct: true },
      { id: "judge", label: "LLM-as-judge gate", kind: "gate", correct: true, note: "L0 + L1 before adviser" },
      { id: "pinecone", label: "Dedicated vector DB (Pinecone)", kind: "store", correct: false, trap: `A second datastore you must re-secure for tenant isolation + another service to run. pgvector-on-their-RDS gave DB-enforced RLS for free. Only switch past pre-agreed exit triggers: >100M vectors or p95 > 150ms.` },
      { id: "reembed_all", label: "Re-embed all chunks on any change", kind: "model", correct: false, trap: `Throws away ~90% of the revision cost saving. Chunk-hash diff re-embeds only the ~10% that actually changed. Here staleness is a compliance failure, not a cache miss.` },
      { id: "overwrite", label: "Overwrite index in place", kind: "store", correct: false, trap: `Creates a stale-serving window during re-embed and destroys audit history. Atomic version flip keeps vN serving until vN+1 is fully live; old versions kept for audit, never served.` },
      { id: "globalretrieve", label: "Global retrieve (no tenant filter)", kind: "compute", correct: false, trap: `Cross-tenant leakage. Filters must be server-side and session-scoped, never caller-optional — this is an FCA breach, not a bug.` },
      { id: "skipjudge", label: "Ship answer, skip eval gate", kind: "control", correct: false, trap: `Ungated generation reaches advisers with no L0 arithmetic/identity checks and no L1 judge. A fabricated figure goes straight into a suitability report.` }
    ],
    forks: [
      { id: "store", q: "Where do the vectors live?", options: [
        { id: "pgvector", label: "pgvector on their RDS + RLS", best: true, rationale: `Traded peak ANN speed for DB-enforced tenant isolation (RLS) + one less service to run. Exit triggers pre-agreed: >100M vecs, p95 > 150ms.` },
        { id: "pinecone", label: "Dedicated vector DB", best: false, rationale: `Faster ANN, but a second store to secure for tenant isolation and another service to operate. Worth it only past their scale triggers — premature here.` }
      ]},
      { id: "revision", q: "How do you handle a re-uploaded/changed document?", options: [
        { id: "hashdiff", label: "Chunk-hash diff + atomic version flip", best: true, rationale: `Extra ingest machinery buys ~90% cheaper revisions and a zero stale-serving window. Staleness is a compliance failure here, so it's worth it.` },
        { id: "reembed", label: "Re-embed everything / overwrite in place", best: false, rationale: `Simpler code, but you pay full embedding cost every revision and open a window where old figures still serve.` }
      ]},
      { id: "embedmodel", q: "How do you pick the embedding model?", options: [
        { id: "versioned", label: "Version embeddings now, swap later via backfill", best: true, rationale: `embedding_version on every chunk means a model swap is a backfill job, not a redesign. A/B a finance-tuned model once real data lands. Reversible beats optimal on day 0.` },
        { id: "lockbest", label: "Lock in the best embedding model up front", best: false, rationale: `Optimises a number you can't yet measure and makes the eventual swap a migration. You don't have the real data to justify it on day 0.` }
      ]},
      { id: "reranker", q: "Which reranker — and how do you justify it?", options: [
        { id: "proven", label: "Named reranker, proven on a golden retrieval set", best: true, rationale: `e.g. bge-reranker-v2-m3 or Cohere Rerank. Prove it offline: recall@k + context precision, before vs after, per doc type. 40 → 6–8 into context. Measure it, don't vibe it.` },
        { id: "vendor", label: "Trust the vendor's benchmark", best: false, rationale: `Their benchmark isn't your corpus. Without a golden set on your own doc types you can't tell if it actually helps or quietly hurts recall.` }
      ]}
    ],
    model: {
      nodes: ["s3", "worker", "parse", "validate", "quarantine", "chunk", "chunkhash", "embed", "version", "pgvector", "filters", "hybrid", "rerank", "generate", "judge"],
      edges: [
        ["s3", "worker"], ["worker", "parse"], ["parse", "validate"],
        ["validate", "quarantine"], ["validate", "chunk"], ["chunk", "chunkhash"],
        ["chunkhash", "embed"], ["embed", "version"], ["version", "pgvector"],
        ["filters", "hybrid"], ["hybrid", "rerank"], ["rerank", "generate"],
        ["generate", "judge"], ["pgvector", "hybrid"]
      ],
      tradeoffs: [
        `★ Reversible beats optimal (day 0): embedding_version on every chunk means a model swap is a backfill job, not a redesign. Voyage/finance-2 A/B once real data lands.`,
        `★ pgvector on their RDS, not a vector DB: traded peak ANN speed for DB-enforced tenant isolation (RLS) + one less service to run. Exit triggers pre-agreed: >100M vecs, p95 > 150ms.`,
        `★ Chunk-hash diff + atomic version flip: extra ingest machinery buys ~90% cheaper revisions and zero stale-serving window — staleness is a compliance failure here.`
      ]
    },
    grills: [
      { q: "Which reranker — and how do you prove it's actually better?", a: `Name one: bge-reranker-v2-m3 (or Cohere Rerank). Prove it offline on a golden retrieval set: recall@k + context precision, before vs after, per doc type. 40 → 6–8 into context. Measure it, don't vibe it.` },
      { q: "Advisers uploaded a newer statement but reports still pull old figures. What happened?", a: `Stale retrieval — and is_current alone isn't the full answer: atomic version flip + the filter hard-coded server-side (never caller-optional) + nightly S3↔index reconciliation to catch partial failures. Old versions kept for audit, never served.` }
    ],
    rubric: [
      { id: "validate_before_store", type: "precedes", from: "validate", to: "pgvector", label: "Validation gate runs before anything is stored", critical: true },
      { id: "has_versioning", type: "present", node: "version", label: "Versioned upsert + atomic flip (no stale-serving window)", critical: true },
      { id: "tenant_filters", type: "present", node: "filters", label: "Session-scoped tenant filters on retrieval", critical: true },
      { id: "eval_gate", type: "onpath", node: "judge", label: "LLM-as-judge gate on the serving path before the adviser", critical: true },
      { id: "has_hash_diff", type: "present", node: "chunkhash", label: "Chunk-hash diff — only changed chunks re-embed" },
      { id: "human_review", type: "present", node: "quarantine", label: "Low-confidence docs quarantined to human review" },
      { id: "no_pinecone", type: "absent", node: "pinecone", label: "Didn't reach for a dedicated vector DB (pgvector+RLS was the call)" },
      { id: "no_reembed_all", type: "absent", node: "reembed_all", label: "Didn't re-embed the whole corpus on every change" },
      { id: "no_global", type: "absent", node: "globalretrieve", label: "No cross-tenant global retrieve" }
    ]
  },
  {
    id: "atlas-agents",
    topic: "Agents",
    title: "Atlas — Agent Topology",
    brief: `Atlas is the adviser-facing assistant. A query might be a one-liner ("what's this client's risk score?") or an open-ended research task. Design the agent topology that stays fast on the easy 80%, escalates safely on the hard tail, keeps every step auditable under FCA, and never lets an agent quietly perform a write. Drag, wire, and defend your trade-offs.`,
    palette: [
      { id: "session", label: "Adviser session (SSE)", kind: "source", correct: true },
      { id: "router", label: "Router — 1 small call", kind: "model", correct: true, note: "strict JSON: intent · entities · tier" },
      { id: "t0", label: "T0 direct lane", kind: "compute", correct: true, note: "tool + template · cached · ~$0.0002" },
      { id: "t1", label: "T1 one specialist", kind: "agent", correct: true, note: "book screening → SQL · ~$0.02" },
      { id: "t2", label: "T2 orchestrator (code, durable)", kind: "control", correct: true, note: "checkpointed plan DAG · not an LLM · ~$0.3" },
      { id: "clientdata", label: "Client Data agent", kind: "agent", correct: true, note: "CRM MCP · read only" },
      { id: "knowledge", label: "Knowledge agent", kind: "agent", correct: true, note: "retrieval MCP (Part 1 index)" },
      { id: "analysis", label: "Analysis agent", kind: "agent", correct: true, note: "extended thinking · NO direct tools" },
      { id: "action", label: "Action agent (appendix)", kind: "agent", correct: true, note: "write tools · propose→confirm→execute" },
      { id: "evidence", label: "Evidence packets", kind: "compute", correct: true, note: "claims + provenance" },
      { id: "synthesis", label: "Synthesis + citations", kind: "model", correct: true },
      { id: "llm_orchestrator", label: "LLM orchestrator (plans freely)", kind: "model", correct: false, trap: `Non-deterministic, uncheckpointed, unauditable — under FCA you need a durable, replayable plan. Keep planning as code; reserve LLM planning for the open-ended ~5% tail only.` },
      { id: "many_agents", label: "Many autonomous agents", kind: "agent", correct: false, trap: `Hundreds of free-running agents = unauditable and unbounded cost. The answer is a small capability-bounded set (4) with scoped MCP permissions, not more agents.` },
      { id: "analysis_tools", label: "Give Analysis agent direct tools", kind: "agent", correct: false, trap: `Removes the single governed, logged, scope-checked fetch point and invites runaway retrieval loops. The cost of no-tools is one latency hop per request — worth it.` },
      { id: "rawdocs", label: "Pass raw documents to the model", kind: "compute", correct: false, trap: `Blows the token budget and loses citability. Evidence packets carry provenance the judge can later verify — the model shouldn't 'see everything'.` },
      { id: "write_default", label: "Agents call write tools by default", kind: "agent", correct: false, trap: `De-scoped by Roshan — zero write actions in real queries. Writes are appendix-only and gated propose→confirm→execute, never a default capability.` }
    ],
    forks: [
      { id: "orchestration", q: "What runs the multi-step plan?", options: [
        { id: "code", label: "Orchestrator is code (durable, checkpointed)", best: true, rationale: `Traded runtime flexibility for determinism, checkpoints and auditability. Custom LLM planning only for the open-ended ~5% tail.` },
        { id: "llm", label: "An LLM orchestrator plans and calls tools", best: false, rationale: `Flexible, but non-deterministic and hard to audit or replay — unacceptable when a regulator can ask "why did it do that?"` }
      ]},
      { id: "analysistools", q: "Does the Analysis agent fetch its own data?", options: [
        { id: "notools", label: "Zero direct tools — one governed fetch point", best: true, rationale: `Costs one latency hop per data request; buys a single governed, logged, scope-checked fetch point and no runaway retrieval loops.` },
        { id: "tools", label: "Give it tools so it can fetch what it needs", best: false, rationale: `Saves a hop but scatters retrieval across an agent you can't easily bound — loops, cost, and audit gaps follow.` }
      ]},
      { id: "context", q: "What does the model actually see?", options: [
        { id: "packets", label: "Evidence packets (claims + provenance)", best: true, rationale: `Traded 'model sees everything' for token discipline + citability — every claim carries provenance the judge can later verify.` },
        { id: "raw", label: "Raw documents / full context", best: false, rationale: `Convenient but expensive and uncitable; you can't later prove which source backed which claim.` }
      ]},
      { id: "accuracy", q: "How does Atlas know its answers are accurate?", options: [
        { id: "perstep", label: "Per-step verification + refuse unsupported", best: true, rationale: `SQL results get schema/count checks; retrieval returns evidence packets with citations; synthesis refuses unsupported claims; low confidence → ask, don't guess. Part 3's gates consume Atlas traces too.` },
        { id: "trustfinal", label: "Trust the final answer", best: false, rationale: `No per-step checks means errors compound silently — and you'll admit live you 'hadn't thought about it'. Never repeat that.` }
      ]}
    ],
    model: {
      nodes: ["session", "router", "t0", "t1", "t2", "clientdata", "knowledge", "analysis", "action", "evidence", "synthesis"],
      edges: [
        ["session", "router"], ["router", "t0"], ["router", "t1"], ["router", "t2"],
        ["t2", "clientdata"], ["t2", "knowledge"], ["t2", "analysis"], ["t2", "action"],
        ["clientdata", "evidence"], ["knowledge", "evidence"], ["analysis", "evidence"],
        ["evidence", "synthesis"]
      ],
      tradeoffs: [
        `★ Orchestrator is code, not an LLM: traded runtime flexibility for determinism, checkpoints and auditability. Custom LLM planning only for the open-ended ~5% tail.`,
        `★ Analysis agent gets zero direct tools: costs one latency hop per data request; buys a single governed, logged, scope-checked fetch point — no runaway retrieval loops.`,
        `★ Evidence packets, not raw documents: traded 'model sees everything' for token discipline + citability — every claim carries provenance the judge can later verify.`
      ]
    },
    grills: [
      { q: "How does Atlas know its answers are accurate?", a: `Per-step verification: SQL results get schema/count checks; retrieval returns evidence packets with citations; synthesis refuses unsupported claims; low confidence → ask, don't guess. Part 3's gates consume Atlas traces too — eval in the loop, not bolted on.` },
      { q: "How do you manage lots of agents?", a: `Don't have lots. A small capability-bounded set (4), a durable orchestrator executing typed plans with checkpointed state, scoped MCP tool permissions per agent. Hundreds of free-running agents = unauditable under FCA.` },
      { q: "CRM dies mid-query — what does the adviser actually see?", a: `Product answer first, mechanics second: "Live CRM values unavailable — this answer is incomplete, based on retrieved reports only." Never present partial as complete. Checkpoint completed steps; resume from the failed step, not from scratch.` }
    ],
    rubric: [
      { id: "code_orchestrator", type: "present", node: "t2", label: "Orchestration is durable code, not a free-running LLM", critical: true },
      { id: "router_first", type: "precedes", from: "router", to: "t2", label: "Router classifies + tiers before escalating to the orchestrator" },
      { id: "evidence_packets", type: "present", node: "evidence", label: "Evidence packets with provenance, not raw docs", critical: true },
      { id: "readonly_crm", type: "present", node: "clientdata", label: "Client data via read-only CRM MCP" },
      { id: "no_llm_orch", type: "absent", node: "llm_orchestrator", label: "Didn't make the orchestrator an LLM" },
      { id: "analysis_no_tools", type: "absent", node: "analysis_tools", label: "Analysis agent kept tool-free (one governed fetch point)" },
      { id: "no_raw_docs", type: "absent", node: "rawdocs", label: "Didn't dump raw documents into context" },
      { id: "bounded_agents", type: "absent", node: "many_agents", label: "Kept a small, capability-bounded agent set" },
      { id: "no_default_writes", type: "absent", node: "write_default", label: "No write tools by default (appendix-only, gated)" }
    ]
  },
  {
    id: "eval-gate",
    topic: "Evals",
    title: "Three-Layer Eval Gate (LLM-as-Judge)",
    brief: `Every generated suitability report must pass a quality gate before an adviser sees it — at Emma's real volume (~550/week). Design the gate so a fabricated income or a missing vulnerable-client disclosure can never slip through as a false green, the judge itself can't silently drift, and advisers actually trust the output. Drag, wire, and commit to the trade-offs.`,
    palette: [
      { id: "report", label: "Emma report + evidence bundle", kind: "source", correct: true, note: "provenance" },
      { id: "l0", label: "L0 deterministic gates", kind: "gate", correct: true, note: "identity · figures · sections · arithmetic · dates · length" },
      { id: "block", label: "Block + regenerate", kind: "control", correct: true },
      { id: "l1", label: "L1 LLM judge", kind: "model", correct: true, note: "per-criterion · strict JSON · evidence quotes · unknown" },
      { id: "mingate", label: "Min-gate (all critical ≥ 4?)", kind: "gate", correct: true, note: "never average" },
      { id: "autopass", label: "Auto-pass → adviser", kind: "control", correct: true, note: "2–5% audit sample" },
      { id: "review", label: "Review queues", kind: "human", correct: true, note: "standard / priority" },
      { id: "humanqa", label: "L2 Human QA", kind: "human", correct: true, note: "calibrates the judge" },
      { id: "calibration", label: "Calibration loop", kind: "control", correct: true, note: "frozen set · seeded defects · pass^k · pinned judge versions" },
      { id: "avg_score", label: "Average the criteria into one score", kind: "gate", correct: false, trap: `An average lets style bury a fabricated income figure. Critical criteria must each score ≥ 4 (min-gate), never be averaged away.` },
      { id: "judge_first", label: "LLM judge does everything (no L0)", kind: "model", correct: false, trap: `Spends model judgment on what code can prove — identity, arithmetic, sections. Every deterministic check you move to L0 is a check that cannot drift.` },
      { id: "default_pass", label: "Default to pass when judge is unsure", kind: "control", correct: false, trap: `Unknown must route to a human, never default-pass. A silent false-green on a missed vulnerable-client disclosure is the dangerous failure.` },
      { id: "unpinned_judge", label: "Unversioned judge (latest model)", kind: "model", correct: false, trap: `The judge must be a versioned release artifact — pinned model + prompt, frozen calibration suite re-run on every change. 'Latest model' makes scores drift silently.` },
      { id: "raw_scores", label: "Show advisers the raw judge score", kind: "control", correct: false, trap: `"95%" means nothing to an adviser. Show trust evidence — pass/fail gates, citations, unresolved warnings — not internal scores. Raw judge scores stay internal.` }
    ],
    forks: [
      { id: "detvsjudge", q: "What checks the deterministic facts (names, figures, sections)?", options: [
        { id: "deterministic", label: "L0 deterministic gates first, judge second", best: true, rationale: `Never spend model judgment on what code proves. Every check moved to L0 is a check that cannot drift. The judge reads only the residual — grounding, adequacy.` },
        { id: "judgeall", label: "Let the LLM judge do it all", best: false, rationale: `The judge will sometimes miss an arithmetic or identity error a one-line assertion would always catch — and it can drift between model versions.` }
      ]},
      { id: "aggregate", q: "How do you combine per-criterion scores?", options: [
        { id: "mingate", label: "Min-gate — each critical criterion ≥ 4", best: true, rationale: `An average lets style bury a fabricated income. Critical criteria each score ≥ 4 or the report doesn't ship.` },
        { id: "average", label: "Average the scores into one number", best: false, rationale: `A high average can hide a single catastrophic criterion — exactly the failure that matters most here.` }
      ]},
      { id: "unsure", q: "What happens when the judge is unsure?", options: [
        { id: "unknown", label: "Return 'unknown' → route to human", best: true, rationale: `Unsure → "unknown" → human, never default-pass. Low-confidence is a routing signal, not a green light.` },
        { id: "pass", label: "Default to pass to keep throughput up", best: false, rationale: `Optimises throughput at the cost of the exact false-green — a missed disclosure — that the gate exists to stop.` }
      ]},
      { id: "versioning", q: "How do you stop the judge drifting over time?", options: [
        { id: "pinned", label: "Pinned, versioned judge + calibration suite", best: true, rationale: `The judge is a versioned release artifact: pinned model + prompt, frozen calibration suite + seeded defects re-run on every change, score-distribution monitoring, benchmarks bound to template versions.` },
        { id: "latest", label: "Always use the latest model", best: false, rationale: `Every model update silently changes your scores and you can't tell quality change from judge change. Never grade a 17-section report against a 20-section rubric.` }
      ]}
    ],
    model: {
      nodes: ["report", "l0", "block", "l1", "mingate", "autopass", "review", "humanqa", "calibration"],
      edges: [
        ["report", "l0"], ["l0", "block"], ["l0", "l1"], ["l1", "mingate"],
        ["mingate", "autopass"], ["mingate", "review"], ["review", "humanqa"],
        ["humanqa", "calibration"], ["calibration", "l1"]
      ],
      tradeoffs: [
        `★ Deterministic-first, judge second: never spend model judgment on what code proves — every check moved to L0 is a check that cannot drift.`,
        `★ Min-gate, never average: an average lets style bury a fabricated income — critical criteria each score ≥ 4 or the report doesn't ship.`,
        `★ Threshold is a capacity equation: flag volume ≈ review capacity (8–12/day at Emma's real ~550/wk); false-pass rate is measured by the 2–5% audit — not vibes.`
      ]
    },
    grills: [
      { q: "Each report section runs its own one-shot prompt, no communication between prompts — how do we stop a figure leaking into every section? (Brad, verbatim)", a: `It's a prompt-contract problem: each section = prompt ID + expected facts + allowed sources + INCLUDE/SUPPRESS rules. Diff generated sections against the QA Resolution Map and fail any fact appearing where its contract suppresses it. Deterministic, per prompt ID. (Content hashes = the wrong answer.)` },
      { q: "Eval said 87 on 50 reports; Brad changes a prompt, now it's 91. Is quality better?", a: `Only if the SAME frozen 50 improved on the intended criteria with no regression in seeded-defect recall or false-pass rate. Per-case, per-criterion deltas + read the actual prompt diff + human spot-check before believing it. A score without decomposition is a vibe.` },
      { q: "How do you actually build the judge?", a: `The judge is one layer, not the system. Deterministic gates own names, figures, arithmetic, prompt-ID compliance, suppressed sections, length budgets. The judge reads only the residual (grounding, adequacy) with strict JSON + mandatory evidence quotes; unsure → "unknown" → human, never default-pass.` },
      { q: "What about judge drift and benchmark updates?", a: `The judge is a versioned release artifact: pinned model + prompt, frozen calibration suite + seeded defects re-run on every change, score-distribution monitoring, benchmarks bound to template versions — never grade a 17-section report against a 20-section rubric.` },
      { q: "How do you make advisers trust the output? (Brad)", a: `Show trust evidence, not scores: pass/fail gates, key citations, unresolved warnings, and why a report needs review. Raw judge scores stay internal — "95%" means nothing to an adviser.` }
    ],
    rubric: [
      { id: "l0_before_l1", type: "precedes", from: "l0", to: "l1", label: "Deterministic gates run before the LLM judge", critical: true },
      { id: "has_mingate", type: "present", node: "mingate", label: "Min-gate on critical criteria (never an average)", critical: true },
      { id: "unknown_to_human", type: "present", node: "review", label: "Uncertain / failing reports route to human review", critical: true },
      { id: "has_calibration", type: "present", node: "calibration", label: "Calibration loop with frozen set + seeded defects" },
      { id: "no_average", type: "absent", node: "avg_score", label: "Didn't collapse criteria into an average" },
      { id: "judge_not_first", type: "absent", node: "judge_first", label: "Judge reads only the residual, not everything" },
      { id: "no_default_pass", type: "absent", node: "default_pass", label: "Never default-passes on judge uncertainty" },
      { id: "pinned_judge", type: "absent", node: "unpinned_judge", label: "Judge is versioned/pinned, not 'latest model'" }
    ]
  }
];
