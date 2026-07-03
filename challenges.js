/*
 * challenges.js — content data layer for the "System Design Lab" mode.
 *
 * Pure DATA (no functions). Read via loadChallenges() (window.CHALLENGE_DB).
 * A scraper (scraper/normalize.py) appends more challenges over time; a future
 * Supabase migration only changes loadChallenges() — this schema is stable.
 *
 * Model: a challenge is a PROBLEM STATEMENT + a suggested skeleton of STAGES.
 * The user edits the skeleton (add / remove / reorder) and, at each stage,
 * PICKS one option and JUSTIFIES it. Grading rewards defensible picks + the
 * quality of the trade-off reasoning (LLM-grilled).
 *
 * Schema (all JSON-serializable):
 *   id, topic (must match DOMAIN_OF for mastery), title, brief
 *   constraints : [str]        the constraints that make the choices non-trivial
 *   skeleton    : [stageId]    default ordered stages shown on load
 *   addable     : [stageId]    stages not in the skeleton the user may add
 *   stages      : { stageId: {
 *       name, prompt, required:bool,
 *       options: [{ id, label, verdict:"best"|"solid"|"weak", why }]
 *                   best  = ideal for these constraints
 *                   solid = defensible with good justification
 *                   weak  = poor fit / trap for these constraints
 *       mustMention: [str]     points a strong justification should cover
 *   }}
 *   grills : [{ q, a }]        overall follow-up interrogation (offline reference)
 */
window.CHALLENGE_DB = [
  {
    id: "rag-system",
    topic: "RAG",
    title: "Design a RAG system",
    brief: `Build retrieval-augmented generation over an enterprise knowledge base so employees get accurate, cited answers. Walk the stages of the system and, at each one, choose an approach and defend the trade-off.`,
    constraints: [
      "~10M documents across 500 tenants",
      "p95 retrieval < 300ms",
      "Answers must cite sources — no hallucinated facts",
      "Documents change often; freshness matters",
      "Strict per-tenant isolation (compliance)"
    ],
    skeleton: ["ingest", "chunk", "embed", "store", "retrieve", "rerank", "generate", "guardrail"],
    addable: ["cache", "observability"],
    stages: {
      ingest: {
        name: "Ingestion & freshness", prompt: "How do documents get in and stay current?", required: true,
        options: [
          { id: "stream", label: "Event-driven ingestion (queue + idempotent workers)", verdict: "best", why: `Near-real-time freshness with idempotent workers that scale with load. Here staleness is a correctness bug, so push-based beats polling.` },
          { id: "batch", label: "Nightly batch ETL", verdict: "solid", why: `Simple and cheap, but up to 24h stale — only acceptable if the corpus changes slowly, which it doesn't here.` },
          { id: "manual", label: "Manual re-upload / re-index", verdict: "weak", why: `Doesn't scale and guarantees stale answers; no change detection at all.` }
        ],
        mustMention: ["freshness / staleness window", "idempotency / exactly-once", "change detection — re-embed only what changed"]
      },
      chunk: {
        name: "Chunking", prompt: "How do you split documents for retrieval?", required: true,
        options: [
          { id: "structure", label: "Structure-aware (keep headings/tables intact)", verdict: "best", why: `Preserves meaning and keeps tables and atomic facts whole, so fewer broken or misleading retrievals.` },
          { id: "fixed", label: "Fixed-size with overlap", verdict: "solid", why: `Easy and predictable, but splits tables and sentences and needs overlap tuning to avoid boundary loss.` },
          { id: "whole", label: "Whole document as one chunk", verdict: "weak", why: `Blows the context window and destroys retrieval precision — you retrieve the whole doc for one fact.` }
        ],
        mustMention: ["retrieval granularity vs context size", "table / structure integrity", "overlap / boundary loss"]
      },
      embed: {
        name: "Embedding strategy", prompt: "How do you embed, and future-proof it?", required: true,
        options: [
          { id: "versioned", label: "Versioned embeddings, model swappable via backfill", verdict: "best", why: `An embedding_version on every chunk makes a model upgrade a backfill job, not a re-architecture. Reversible beats optimal on day 0.` },
          { id: "single", label: "Pick one strong model, no versioning", verdict: "solid", why: `Fine until you want to switch models — then it's a full re-index with a stale-serving window.` },
          { id: "lexical", label: "No embeddings — BM25/keyword only", verdict: "weak", why: `Misses semantic matches; only defensible as one signal in a hybrid, never alone for this.` }
        ],
        mustMention: ["embedding versioning / backfill path", "domain fit (general vs finance/code)", "re-embed cost when docs change"]
      },
      store: {
        name: "Vector store", prompt: "Where do the embeddings live?", required: true,
        options: [
          { id: "pgvector", label: "pgvector on Postgres + row-level security", verdict: "best", why: `DB-enforced tenant isolation (RLS), one fewer service to run, and fine to ~100M vectors. Multi-tenant compliance makes this the call.` },
          { id: "managed", label: "Managed vector DB (Pinecone / Weaviate)", verdict: "solid", why: `Fast ANN that scales, but tenant isolation is now your app's job and it's another service to secure and operate.` },
          { id: "faiss", label: "FAISS in-process", verdict: "weak", why: `No persistence, no multi-node, no isolation — a POC tool, not multi-tenant production.` }
        ],
        mustMention: ["per-tenant isolation", "scale ceiling / ANN index type", "ops & cost of another service"]
      },
      retrieve: {
        name: "Retrieval", prompt: "How do you fetch candidate chunks?", required: true,
        options: [
          { id: "hybrid", label: "Hybrid: BM25 + dense, fused with RRF", verdict: "best", why: `Catches exact terms, IDs and acronyms AND semantics; fusion beats either alone on enterprise jargon.` },
          { id: "dense", label: "Dense (vector) only", verdict: "solid", why: `Strong semantics, but misses exact IDs, acronyms and rare terms users actually search for.` },
          { id: "keyword", label: "Keyword / BM25 only", verdict: "weak", why: `No semantic matching — brittle to paraphrase and synonyms.` }
        ],
        mustMention: ["exact-match vs semantic recall", "fusion / RRF", "recall before you rerank"]
      },
      rerank: {
        name: "Reranking", prompt: "How do you order candidates before the model?", required: true,
        options: [
          { id: "cross", label: "Cross-encoder reranker, proven on a golden set", verdict: "best", why: `Big precision win. Prove it offline (recall@k, context precision) per doc type — never trust the vendor benchmark. Cut 40 candidates to ~6.` },
          { id: "none", label: "No rerank — trust the vector scores", verdict: "solid", why: `Lower latency and cost; fine if retrieval is already precise, risky for nuanced queries.` },
          { id: "llmrank", label: "LLM reranks every candidate", verdict: "weak", why: `Accurate but too slow and expensive at p95 < 300ms and this volume.` }
        ],
        mustMention: ["precision@k vs latency / cost", "proving it on a golden set", "how many candidates reach the context window"]
      },
      generate: {
        name: "Generation & grounding", prompt: "How does the model actually answer?", required: true,
        options: [
          { id: "grounded", label: "Grounded with citations; refuse if unsupported", verdict: "best", why: `Every claim ties to a retrieved chunk, and low confidence returns 'I don't know'. Meets the must-cite / no-hallucination constraint.` },
          { id: "plainrag", label: "Standard RAG prompt (context in, answer out)", verdict: "solid", why: `Works, but without enforced citation and refusal it can still fabricate confidently.` },
          { id: "nogr", label: "No grounding constraints", verdict: "weak", why: `Invites hallucinated facts — disqualifying for a system that must cite.` }
        ],
        mustMention: ["citation / provenance per claim", "refusal on low support", "prompt injection from retrieved docs is untrusted"]
      },
      guardrail: {
        name: "Quality / safety gate", prompt: "What checks the answer before the user sees it?", required: true,
        options: [
          { id: "evalgate", label: "Groundedness + citation eval, human review on low confidence", verdict: "best", why: `Catches unsupported claims and PII before delivery and escalates the uncertain ones to a person.` },
          { id: "basic", label: "Basic PII / profanity filter only", verdict: "solid", why: `Necessary but not sufficient — it won't catch a well-phrased fabrication.` },
          { id: "none", label: "No gate", verdict: "weak", why: `Ships fabrications and leaks straight to the user.` }
        ],
        mustMention: ["groundedness / faithfulness check", "PII / safety", "escalation path to a human"]
      },
      cache: {
        name: "Caching", prompt: "Do you cache, and how?", required: false,
        options: [
          { id: "semantic", label: "Semantic + exact response cache, invalidate on doc change", verdict: "best", why: `Cuts cost and p95 for repeat and near-repeat queries; the hard part is invalidating when a source doc changes.` },
          { id: "exact", label: "Exact-match cache only", verdict: "solid", why: `Simple, but misses paraphrased repeats which are most of the real traffic.` },
          { id: "nocache", label: "No cache (yet)", verdict: "solid", why: `Fine early; revisit once cost or latency actually bite.` }
        ],
        mustMention: ["invalidation when a source doc changes", "hit rate vs staleness risk"]
      },
      observability: {
        name: "Observability & feedback", prompt: "How do you know it's working?", required: false,
        options: [
          { id: "traces", label: "Per-query traces + thumbs + an offline eval set", verdict: "best", why: `You can debug why one answer was wrong and catch regressions before shipping a prompt change.` },
          { id: "logs", label: "Basic logs only", verdict: "weak", why: `Can't trace a single bad answer or detect a quality regression from a prompt tweak.` }
        ],
        mustMention: ["trace a single answer end to end", "regression eval before shipping changes"]
      }
    },
    grills: [
      { q: "p95 latency creeps to 900ms. Where do you look first?", a: `Rerank and candidate count first — cross-encoder cost scales with k — then ANN params (HNSW ef_search) and cache hit rate. Measure per-stage latency; don't guess.` },
      { q: "A tenant reports seeing another firm's document in results. What failed?", a: `Tenant isolation. The filter must be enforced server-side at the DB (RLS) or index partition, never caller-optional. Add a cross-tenant retrieval regression test.` },
      { q: "Answers occasionally cite the wrong source. Fix?", a: `Bind citations to chunk IDs and verify each generated claim maps to a retrieved chunk in a post-generation check; refuse or flag when it doesn't. It's a grounding+verification problem, not a prompt tweak.` }
    ]
  },
  {
    id: "eval-platform",
    topic: "Evals",
    title: "Design an LLM quality-gate platform",
    brief: `Every AI-generated report must pass a quality gate before a human acts on it. Design the gate so a fabricated figure or a missing disclosure can never pass as a false green, the judge itself can't silently drift, and the people downstream actually trust the output.`,
    constraints: [
      "~550 generated reports/week must be gated",
      "A fabricated figure or missing disclosure must never pass as a false green",
      "The judge itself must not silently drift over time",
      "Downstream users must trust and act on the result",
      "Human review capacity ~8–12 reports/day"
    ],
    skeleton: ["intake", "l0", "l1", "aggregate", "route", "humanqa", "calibration", "trust"],
    addable: [],
    stages: {
      intake: {
        name: "Intake", prompt: "What actually arrives at the gate?", required: true,
        options: [
          { id: "bundle", label: "Report + evidence bundle (provenance)", verdict: "best", why: `The gate can only verify a claim it can trace back to a source, so provenance must come with the report.` },
          { id: "reportonly", label: "Just the report text", verdict: "weak", why: `You can't verify figures without the evidence they were derived from.` }
        ],
        mustMention: ["provenance / traceable claims", "what the gate needs to verify"]
      },
      l0: {
        name: "Deterministic gates (L0)", prompt: "What does code check before any model runs?", required: true,
        options: [
          { id: "det", label: "Deterministic checks first (identity, arithmetic, sections, dates)", verdict: "best", why: `Never spend model judgment on what code can prove. Every check you move to L0 is a check that cannot drift.` },
          { id: "skip", label: "Skip straight to the LLM judge", verdict: "weak", why: `The judge will occasionally miss an arithmetic or identity error that a one-line assertion always catches.` }
        ],
        mustMention: ["deterministic-first", "drift resistance", "cheap and exact checks"]
      },
      l1: {
        name: "LLM judge (L1)", prompt: "How does the model judge what code can't?", required: true,
        options: [
          { id: "percriterion", label: "Per-criterion, strict JSON, evidence quotes, 'unknown' allowed", verdict: "best", why: `Structured, quotable, and able to abstain. The judge reads only the residual — grounding and adequacy — that L0 can't prove.` },
          { id: "holistic", label: "One holistic 'is this good?' score", verdict: "weak", why: `Unauditable and gameable; you can't tell which criterion failed or why.` }
        ],
        mustMention: ["per-criterion scoring", "mandatory evidence quotes", "abstain / unknown option"]
      },
      aggregate: {
        name: "Aggregation", prompt: "How do you combine the criterion scores?", required: true,
        options: [
          { id: "mingate", label: "Min-gate — each critical criterion ≥ threshold", verdict: "best", why: `An average lets style bury a fabricated income figure. Critical criteria each pass or the report doesn't ship.` },
          { id: "average", label: "Average into one overall score", verdict: "weak", why: `A high average hides the single catastrophic failure that matters most.` }
        ],
        mustMention: ["never average critical criteria", "threshold ≈ review capacity", "false-pass rate is the number that matters"]
      },
      route: {
        name: "Routing", prompt: "Where do reports go after scoring?", required: true,
        options: [
          { id: "passfail", label: "Auto-pass + audit sample; uncertain or failing → human", verdict: "best", why: `Unknown routes to a human, never default-pass; a 2–5% audit sample measures the real false-pass rate.` },
          { id: "autopassall", label: "Auto-pass unless clearly failing", verdict: "weak", why: `Default-passing the uncertain ones is exactly how a missed disclosure ships.` }
        ],
        mustMention: ["unknown → human, never default-pass", "audit sample", "flag volume bounded by capacity"]
      },
      humanqa: {
        name: "Human QA", prompt: "What do the humans in the loop do?", required: true,
        options: [
          { id: "calibrate", label: "Review flagged + audit set, and calibrate the judge", verdict: "best", why: `Humans are the ground truth that keeps the judge honest — a calibration source, not just a backstop.` },
          { id: "nohuman", label: "No humans — fully automated", verdict: "weak", why: `No ground truth to detect judge drift or catch novel failure modes.` }
        ],
        mustMention: ["human as calibration source", "capacity-bounded flag volume"]
      },
      calibration: {
        name: "Calibration & versioning", prompt: "How do you stop the judge drifting?", required: true,
        options: [
          { id: "pinned", label: "Pinned model+prompt; frozen calibration set + seeded defects re-run on every change", verdict: "best", why: `The judge is a versioned release artifact. Benchmarks are bound to template versions — never grade a 17-section report against a 20-section rubric.` },
          { id: "latest", label: "Always use the latest model", verdict: "weak", why: `Every model update silently moves your scores; you can't separate a quality change from a judge change.` }
        ],
        mustMention: ["pinned / versioned judge", "frozen calibration + seeded defects", "benchmarks bound to template version"]
      },
      trust: {
        name: "What the human sees", prompt: "What do you surface to the person who acts on it?", required: true,
        options: [
          { id: "evidence", label: "Trust evidence: pass/fail gates, citations, unresolved warnings", verdict: "best", why: `'95%' means nothing to a reviewer; show why it passed and exactly what to double-check.` },
          { id: "rawscore", label: "The raw judge score", verdict: "weak", why: `Uninterpretable and falsely precise — raw scores stay internal.` }
        ],
        mustMention: ["trust evidence, not scores", "surface unresolved warnings", "what still needs a human look"]
      }
    },
    grills: [
      { q: "Eval was 87 on 50 reports; someone tweaks a prompt and it's 91. Is quality better?", a: `Only if the SAME frozen 50 improved on the intended criteria with no regression in seeded-defect recall or false-pass rate. Per-criterion deltas + read the prompt diff + spot-check. A score without decomposition is a vibe.` },
      { q: "Each report section is a separate one-shot prompt with no shared state — how do you stop a figure leaking across sections?", a: `Prompt-contract per section: expected facts + allowed sources + INCLUDE/SUPPRESS rules. Diff generated sections against the resolution map and fail any fact appearing where its contract suppresses it. Deterministic, per prompt ID.` }
    ]
  },
  {
    id: "agent-system",
    topic: "Agents",
    title: "Design an AI agent system",
    brief: `Build an assistant that handles both one-line lookups and open-ended research over internal systems — fast and cheap on the easy path, fully auditable on the hard one, and never performing a silent write. Choose an approach at each stage and defend it.`,
    constraints: [
      "Mix of trivial lookups and multi-step research",
      "Every step must be auditable (regulated)",
      "No silent write actions to systems of record",
      "Cost-bounded — the easy 80% must stay cheap",
      "Answers must be accurate and cite evidence"
    ],
    skeleton: ["entry", "router", "orchestration", "data", "knowledge", "analysis", "action", "synthesis"],
    addable: [],
    stages: {
      entry: {
        name: "Entry point", prompt: "How does a query enter the system?", required: true,
        options: [
          { id: "sse", label: "Session with streaming (SSE)", verdict: "best", why: `Long research tasks need progressive output and a stable session to checkpoint against.` },
          { id: "reqresp", label: "Single request/response", verdict: "solid", why: `Fine for lookups, poor for multi-step work that takes several seconds to assemble.` }
        ],
        mustMention: ["streaming for long tasks", "session / state to resume against"]
      },
      router: {
        name: "Router / tiering", prompt: "How do you decide the path for a query?", required: true,
        options: [
          { id: "tiered", label: "One small classify call → tier (direct / one specialist / orchestrated)", verdict: "best", why: `Keeps the easy 80% on a ~$0.0002 path and only escalates cost when the query actually needs it.` },
          { id: "alwaysbig", label: "Send everything through the full agent stack", verdict: "weak", why: `Pays orchestration cost on trivial lookups and blows the budget.` }
        ],
        mustMention: ["cost tiering", "cheap path for easy queries", "escalation is one-way upward"]
      },
      orchestration: {
        name: "Orchestration", prompt: "What runs the multi-step plans?", required: true,
        options: [
          { id: "code", label: "Durable code orchestrator (checkpointed plan DAG)", verdict: "best", why: `Deterministic, replayable and auditable — a regulator can ask 'why did it do that?'. Reserve LLM planning for the open-ended ~5% tail.` },
          { id: "llm", label: "An LLM orchestrator plans and calls tools freely", verdict: "weak", why: `Flexible but non-deterministic and hard to audit or replay under a compliance regime.` }
        ],
        mustMention: ["determinism / auditability", "checkpoint & resume", "LLM planning only for the tail"]
      },
      data: {
        name: "Client-data access", prompt: "How do agents read the systems of record?", required: true,
        options: [
          { id: "readonly", label: "Read-only tool via scoped MCP", verdict: "best", why: `Least privilege — the data path physically can't mutate state.` },
          { id: "readwrite", label: "Read/write access for convenience", verdict: "weak", why: `One prompt injection or bug away from corrupting a system of record.` }
        ],
        mustMention: ["least privilege", "read-only by default", "scoped per-agent permissions"]
      },
      knowledge: {
        name: "Knowledge access", prompt: "How do agents get documents into reasoning?", required: true,
        options: [
          { id: "packets", label: "Retrieval returns evidence packets (claims + provenance)", verdict: "best", why: `Token-disciplined and citable; every claim carries provenance a downstream judge can verify.` },
          { id: "rawdocs", label: "Dump raw documents into the context", verdict: "weak", why: `Expensive and uncitable — you can't prove which source backed which claim.` }
        ],
        mustMention: ["evidence packets vs raw docs", "provenance / citability", "token budget"]
      },
      analysis: {
        name: "Analysis / reasoning", prompt: "How does the reasoning agent get its data?", required: true,
        options: [
          { id: "notools", label: "Analysis agent has NO direct tools (one governed fetch point)", verdict: "best", why: `Costs one latency hop, but buys a single logged, scope-checked fetch and no runaway retrieval loops.` },
          { id: "tools", label: "Give it tools to fetch what it needs", verdict: "solid", why: `Faster, but scatters retrieval across an agent you can't easily bound or audit.` }
        ],
        mustMention: ["single governed fetch point", "no runaway retrieval loops", "latency vs control"]
      },
      action: {
        name: "Write actions", prompt: "How are writes to systems of record handled?", required: true,
        options: [
          { id: "gated", label: "Appendix-only, propose → confirm → execute", verdict: "best", why: `No silent writes — a human confirms before the system of record changes.` },
          { id: "autonomous", label: "Agents write autonomously when confident", verdict: "weak", why: `Unauditable side effects — disqualifying under the no-silent-write constraint.` }
        ],
        mustMention: ["no silent writes", "human confirm step", "least-privilege write scope"]
      },
      synthesis: {
        name: "Synthesis", prompt: "How is the final answer assembled?", required: true,
        options: [
          { id: "cited", label: "Synthesis with citations; refuse unsupported claims", verdict: "best", why: `Per-step verification plus refusal stops errors compounding into a confident wrong answer.` },
          { id: "freeform", label: "Free-form summary of everything gathered", verdict: "weak", why: `No provenance and no refusal — hallucinations slip straight through.` }
        ],
        mustMention: ["per-step verification", "citations", "refuse, don't guess, on low confidence"]
      }
    },
    grills: [
      { q: "The CRM dies mid-query. What does the user actually see?", a: `Product answer first: "Live values unavailable — this answer is incomplete, based on retrieved reports only." Never present partial as complete. Checkpoint completed steps and resume from the failed one.` },
      { q: "How do you manage lots of agents?", a: `Don't have lots. A small capability-bounded set (~4), a durable orchestrator running typed checkpointed plans, and scoped tool permissions per agent. Hundreds of free-running agents are unauditable.` }
    ]
  }
];
