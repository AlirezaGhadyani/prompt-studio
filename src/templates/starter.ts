import type { Template } from './schema.ts';

/**
 * The engineering prompt library written for OpenChamber snippets, carried over
 * as starter templates. Loaded only when the user asks for them.
 */
export const starterTemplates: Template[] = [
  {
    "id": "starter-arch",
    "name": "Arch",
    "description": "Explain an existing architecture, its boundaries, and its real risks. Read-only.",
    "categoryId": "architecture",
    "body": "OBJECTIVE\nExplain how an existing system is structured and where its real risks are. Description before judgement.\n\nINPUTS\n- [SYSTEM OR MODULE]\n- [SCOPE: repository, package, service, or feature path]\n- [CONCERN: onboarding, change safety, scaling, debt]\n\nMETHOD\n1. Identify entry points and the main runtime paths. Follow one representative request or job end to end.\n2. Map modules with one responsibility each. Name the actual files or packages.\n3. Record dependency direction and cycles. Note where a lower layer imports a higher one.\n4. Describe data flow and ownership: who writes, who reads, the source of truth, how failure propagates.\n5. Assess coupling and cohesion at the seams: shared state, implicit contracts, duplicated rules.\n6. Compare the code with the stated conventions and list divergences instead of assuming intent.\n7. List technical debt with cost and trigger conditions, and risks with likelihood and impact.\n8. Cite path:line for every structural claim.\n\nOUTPUT\n- Context and scope\n- Module map with responsibilities and files\n- Dependency direction and cycles\n- Data flow for the traced path\n- Conventions observed and violated\n- Coupling and cohesion findings\n- Debt and risks, ranked\n- Recommendations, only where the evidence supports one\n- Unknowns\n\nRULES\n- Separate observed structure from inference. Mark inference.\n- Do not redesign here; note where design work is needed.\n- Avoid a file-by-file inventory. Describe structure, not volume.\n\nDONE WHEN\nA new engineer could locate any major responsibility from the map, and every risk has evidence.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 1,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-bug",
    "name": "Bug",
    "description": "Reproduce, diagnose to root cause, then apply a minimal fix with a regression test.",
    "categoryId": "bugs",
    "body": "OBJECTIVE\nFind the cause of a defect and fix it without masking it.\n\nINPUTS\n- [BUG DESCRIPTION]\n- [EXPECTED BEHAVIOR]\n- [ACTUAL BEHAVIOR]\n- [REPRODUCTION STEPS OR COMMAND]\n- [EVIDENCE: logs, stack trace, failing test, screenshot]\n\nMETHOD\nReproduce:\n1. Reproduce with the smallest command, test, or input. Record the exact steps.\n2. If reproduction is impossible, say what blocks it and what evidence would confirm the defect. Do not guess a fix.\n\nDiagnose:\n3. Read the failing path from the observed symptom back to the source. Cite path:line.\n4. Form one hypothesis at a time. State the evidence for and against it, and falsify it before moving on.\n5. Identify the root cause: the condition that makes the defect possible, not the line where it surfaces.\n6. Check whether other callers share the condition, and whether the defect lives in our code, a dependency, or the data.\n\nFix:\n7. Make the smallest change that removes the cause. Do not add defensive code that hides it, broaden catches, or disable checks.\n8. Add a regression test that fails before the fix and passes after.\n9. Check side effects: other callers, error paths, performance, concurrency, data already written.\n10. If the correct fix is large or crosses a boundary, propose it and stop rather than patching around it.\n\nOUTPUT\n- Reproduction, with the exact command or steps\n- Root cause with evidence (path:line)\n- Why the fix addresses the cause\n- Change summary and files\n- Regression test with before/after result\n- Side effects checked\n- Residual risk or follow-up\n\nDONE WHEN\nThe cause is evidenced, the regression test demonstrates the before/after difference, and the fix contains no unrelated changes.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 2,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-design",
    "name": "Design",
    "description": "Design a feature or architectural change with options and trade-offs. No code.",
    "categoryId": "architecture",
    "body": "OBJECTIVE\nDesign a change that satisfies the requirements with the least necessary complexity.\n\nINPUTS\n- [REQUIREMENTS OR PROBLEM]\n- [CONSTRAINTS: scale, latency, compatibility, team, deadline]\n- [EXISTING SYSTEM AND PATTERNS]\n\nMETHOD\n1. Restate the requirements and the quality attributes that actually constrain the design. Separate must-have from nice-to-have.\n2. Identify the forces: data volume, read/write ratio, consistency, failure tolerance, deployment model, backward compatibility.\n3. Produce 2-3 options, including \"smallest change to the current design\". For each: shape, cost, risk, and what it makes harder later.\n4. Compare them in a trade-off table against those forces, not against taste.\n5. Recommend one option and state the condition that would reverse the decision.\n6. Define module responsibilities and boundaries. Assign each responsibility once.\n7. Define contracts at the boundaries: inputs, outputs, errors, invariants, versioning.\n8. Define dependency direction and forbid cycles.\n9. Define failure handling: timeouts, retries, partial failure, idempotency, degradation, and what the user sees.\n10. State scalability limits and the first thing that breaks at 10x.\n11. Plan migration and rollout: compatibility window, backfill, feature flag, rollback.\n12. State what you deliberately will not build, and why.\n\nRULES\n- Justify every new module, abstraction, or dependency by a requirement or a force. Otherwise remove it.\n- Apply SOLID and separation of concerns where they lower the cost of change; do not add layers to satisfy a principle.\n- Prefer the existing architecture. A new pattern needs a reason the old one cannot meet.\n- No code. No file-level task plan.\n\nOUTPUT\n- Requirements and forces\n- Options and trade-off table\n- Recommendation and reversal condition\n- Module responsibilities\n- Contracts\n- Dependency rules\n- Failure handling\n- Limits at 10x\n- Migration and rollback\n- Out of scope\n- Open questions\n\nDONE WHEN\nEvery requirement is addressed by the design, every boundary has a contract, and each added element has a stated justification.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 3,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-implement",
    "name": "Implement",
    "description": "Implement an approved change with a minimal diff and executed checks.",
    "categoryId": "implementation",
    "body": "OBJECTIVE\nImplement the approved change so it meets its acceptance criteria with a minimal, reviewable diff.\n\nINPUTS\n- [FEATURE OR CHANGE]\n- [REQUIREMENTS, ACCEPTANCE CRITERIA, OR APPROVED PLAN]\n- [AFFECTED MODULE]\n- [CONSTRAINTS]\n\nMETHOD\nBefore editing:\n1. Read the affected code and its nearest tests. Identify conventions to follow: structure, naming, error handling, logging, validation, state management.\n2. Restate the acceptance criteria you will satisfy. List assumptions separately. If a missing requirement would change the design, ask before editing; otherwise proceed and label the assumption.\n3. If the plan conflicts with the code, follow the code's reality and report the deviation.\n\nIMPLEMENTATION RULES\n- Follow the repository's AGENTS.md and local conventions; this template does not restate them.\n- Trace each change to a requirement or acceptance criterion. No speculative features, options, or abstractions.\n- Reuse existing components, helpers, types, and patterns before adding new ones.\n- Keep the diff focused. Do not refactor, rename, or reformat unrelated code; list it as a follow-up.\n- Handle error, loading, empty, and unauthorized states where the flow can reach them.\n- Use strong typing. No `any`, unchecked casts, or non-null assertions without justification.\n- Validate untrusted input at the boundary. Do not log secrets or personal data.\n- Preserve backward compatibility of public APIs, schemas, and config unless the requirement says otherwise.\n- Add or update tests for changed behavior, including the edge cases named in the requirements.\n\nVERIFICATION\nRun the repository's real checks: typecheck, lint, relevant tests, build. Use the project's scripts; do not invent commands. Record exact commands and outcomes.\n\nOUTPUT\n- Summary of the behavior change\n- Files changed, one line each\n- Requirement traceability: criterion to change\n- Tests added or updated, with exact commands and results\n- Deviations from the plan and why\n- Assumptions made\n- Not verified and residual risk\n\nDONE WHEN\nAcceptance criteria are met, checks were executed and reported, and the diff contains nothing unrelated.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 4,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-perf",
    "name": "Perf",
    "description": "Measure, locate, and fix a real performance bottleneck.",
    "categoryId": "performance",
    "body": "OBJECTIVE\nFix a measured performance problem without regressing correctness.\n\nINPUTS\n- [SLOW PATH OR FEATURE]\n- [SYMPTOM AND METRIC: latency, throughput, memory, CPU, query count]\n- [ENVIRONMENT AND DATA SCALE]\n- [TARGET OR SLO]\n\nMETHOD\n1. Establish a baseline with a reproducible measurement: command, dataset, environment, and the number. No number, no optimization.\n2. Profile or trace to find where time or memory is spent. Cite the profile output or query plan.\n3. Name the bottleneck and its share of the total. If the bottleneck is elsewhere, say so and stop.\n4. List 2-3 options with expected gain, cost, and risk. Prefer the smallest change with the largest measured effect.\n5. Implement one change. Keep it separate from unrelated edits.\n6. Re-measure with the identical method and dataset. Report before and after.\n7. Add a guard: benchmark, budget test, query-count assertion, or documented threshold.\n8. Check correctness, error paths, and behavior under load or concurrency.\n\nCONSTRAINTS\n- No speculative micro-optimization, caching, or parallelism without a measurement that justifies it.\n- Do not trade correctness, durability, or readability for an unmeasured gain.\n- Do not benchmark on data that does not resemble production.\n\nOUTPUT\n- Baseline measurement and method\n- Bottleneck with evidence\n- Options considered\n- Change made\n- After measurement, same method\n- Remaining bottleneck\n- Correctness checks\n- Trade-offs and risks\n\nDONE WHEN\nBefore and after numbers come from the same method, the change is justified by the measurement, and correctness checks pass.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 5,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-plan",
    "name": "Plan",
    "description": "Produce an implementation plan before editing. Planning only, no file changes.",
    "categoryId": "requirements",
    "body": "OBJECTIVE\nProduce an implementation plan for an approved requirement set. Planning only.\n\nHARD STOP\nDo not create, edit, delete, move, or format files. Do not run state-changing commands (installs, migrations, generators, git writes). Read-only inspection only. If something cannot be verified without changing state, report it as unknown.\n\nINPUTS\n- [APPROVED REQUIREMENTS OR THE CHANGE TO MAKE]\n- [AFFECTED MODULE OR ENTRY POINT]\n- [CONSTRAINTS: compatibility, deadline, dependencies]\n\nMETHOD\n1. Locate current behavior: entry points, call path, data stores, tests. Cite path:line for each claim.\n2. Map affected modules and the dependency-direction change each one implies.\n3. List dependencies: internal modules, external packages, config, migrations, environment variables.\n4. Propose the smallest coherent change. Extend existing patterns before introducing abstractions.\n5. For each step, name files and symbols, the expected change, and how it is verified.\n6. State architectural impact: boundaries, contracts, data shapes, failure modes.\n7. List risks with likelihood, impact, and mitigation.\n8. Define the test strategy: which level covers which behavior, and which existing tests may break.\n9. Order steps so the repository stays working after each one.\n\nOUTPUT\n1. Current behavior, with evidence\n2. Affected modules and dependencies\n3. Proposed changes, numbered, with file paths\n4. Architectural impact\n5. Risks and mitigations\n6. Test strategy\n7. Step sequence\n8. Out of scope\n9. Unresolved questions\n\nRULES\n- One step = one reviewable change.\n- Follow existing conventions and AGENTS.md; do not restate them.\n- Do not assume an API, schema, or helper exists. Verify it or mark it as an assumption.\n- If two designs are viable, recommend one and name, in one line, what would change the recommendation.\n\nDONE WHEN\nEvery requirement maps to at least one step, every step is verifiable, no step depends on an undecided choice, and nothing has been modified.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 6,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-refactor",
    "name": "Refactor",
    "description": "Improve internal structure while preserving observable behavior.",
    "categoryId": "refactoring",
    "body": "OBJECTIVE\nImprove internal structure while preserving observable behavior exactly.\n\nINPUTS\n- [TARGET AREA]\n- [GOAL: readability, duplication, coupling, naming, testability]\n- [MUST NOT CHANGE: public API, schema, behavior, performance envelope]\n\nMETHOD\n1. State the concrete problem this refactor solves. If it is a preference with no measurable cost, stop and say so.\n2. Capture a baseline: run the relevant tests and record behavior that must not change.\n3. Work in small increments. After each increment, run the checks and keep the repository working.\n4. Change structure only. Do not fix nearby bugs, add features, or reformat unrelated code; report them instead.\n5. Introduce an abstraction only when it removes real duplication or marks a real boundary. A single use is not a pattern.\n6. Preserve public contracts, caller-visible error messages, and ordering guarantees.\n7. Re-run the same baseline checks and compare results.\n\nOUTPUT\n- Objective and problem\n- Baseline: checks run and results\n- Steps taken, each independently reviewable\n- Evidence that behavior is unchanged\n- The new structure in one paragraph\n- Unrelated issues found but not fixed\n- Not verified\n\nDONE WHEN\nThe same checks pass before and after, no external behavior changed, and the diff contains only the refactor.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 7,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-research",
    "name": "Research",
    "description": "Answer specific questions about unfamiliar code with cited evidence.",
    "categoryId": "research",
    "body": "OBJECTIVE\nAnswer specific questions about unfamiliar code so a decision or implementation can proceed.\n\nINPUTS\n- [QUESTION]\n- [AREA: path, symbol, module, or dependency]\n- [DECISION THIS INFORMS]\n\nMETHOD\n1. Start from the named area. Find entry points by searching symbols and call sites, not by reading directories.\n2. Answer each question with evidence: path:line plus a short quote or paraphrase.\n3. Trace the relevant path end to end: input, transformation, storage, output, error path.\n4. Record existing patterns the solution should reuse, including naming, error handling, and test style.\n5. Record constraints that limit the solution: versions, API contracts, feature flags, config.\n6. Label each statement VERIFIED (evidence cited) or INFERRED (reasoning only).\n7. Stop when the questions are answered. Do not summarize the repository.\n\nCONSTRAINTS\n- Read only files relevant to the questions.\n- Do not modify code or produce a full design.\n- Do not repeat file contents. Quote the minimum needed.\n- Prefer symbol search and call-site tracing over whole-file reads.\n\nOUTPUT\n- Answer: one short paragraph per question\n- Evidence: bullets with path:line\n- Data flow: numbered path for the relevant flow\n- Patterns to reuse\n- Constraints discovered\n- Unknowns needing a decision or an owner\n\nDONE WHEN\nEach question has an evidence-backed answer or is explicitly unresolved, and every claim is marked verified or inferred.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 8,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-review",
    "name": "Review",
    "description": "Independent review of a diff with severity-ranked, evidenced findings. Read-only.",
    "categoryId": "review",
    "body": "OBJECTIVE\nIndependently assess a change for defects and risk. Do not modify code.\n\nINPUTS\n- [DIFF, BRANCH, OR FILE SCOPE]\n- [INTENDED BEHAVIOR, if known]\n- [RISK AREAS: auth, payments, data, concurrency, migrations]\n\nMETHOD\n1. Read the diff, then the surrounding code needed to judge it. Check callers and contracts, not just changed lines.\n2. Verify each finding against the code before reporting it. If it depends on an assumption, label it POSSIBLE and state the condition.\n3. Check categories in this order: correctness, security, race conditions, data integrity and migrations, performance, architectural violations, maintainability, test coverage.\n4. For tests: do they fail when the behavior breaks? Do they cover the stated edge cases? Are they isolated and deterministic?\n5. Check for accidental changes: debug output, secrets, commented code, unrelated edits, dependency drift.\n6. Do not report formatting or naming preferences as defects unless a project convention is violated.\n\nOUTPUT\nVerdict: APPROVE / APPROVE WITH NITS / REQUEST CHANGES\n\nFindings, ordered by severity:\n- Severity: BLOCKER / MAJOR / MINOR / NIT\n- Location: path:line\n- Evidence: what the code actually does\n- Impact: what goes wrong, and when\n- Fix: the smallest correct change\n\nThen: open questions, and what was not reviewed.\n\nRULES\n- No finding without evidence. \"Could be slow\" is not a finding without a hot path or measurement.\n- Do not restate the diff. If there are no findings, say so plainly.\n\nDONE WHEN\nEvery finding is evidenced and actionable, and the verdict follows from the findings.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 9,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-spec",
    "name": "Spec",
    "description": "Turn a vague feature request into testable requirements. No design, no code.",
    "categoryId": "requirements",
    "body": "OBJECTIVE\nProduce a requirements specification another engineer can plan and test from without asking follow-up questions.\n\nINPUTS\nFill these fields from the task text that follows the template.\n- [FEATURE DESCRIPTION]\n- [BUSINESS CONTEXT]\n- [TARGET USERS]\n- [CONSTRAINTS: policy, compatibility, deadline]\n\nMETHOD\n1. Restate the request in one sentence. If your restatement differs from the intent, stop and ask.\n2. Identify actors and their goals. Describe the job to be done, not the proposed solution.\n3. Derive functional requirements R1..Rn. Each must be observable and testable. Reject \"fast\", \"robust\", \"user-friendly\" as requirements.\n4. Derive non-functional requirements with thresholds where possible: latency, throughput, availability, privacy, accessibility, compatibility.\n5. List edge cases and failure paths: empty, boundary, invalid input, permission denied, partial failure, retry, concurrency, existing-data migration.\n6. Write acceptance criteria AC1..ACn. Each states an observable outcome and cites the requirement it verifies.\n7. Record open questions as BLOCKING or NON-BLOCKING. For non-blocking ones, state the assumption you will proceed with.\n8. Keep requirements separate from implementation suggestions. Put suggestions in one short, clearly labelled section or drop them.\n\nCONSTRAINTS\n- Do not design, plan files, or write code.\n- Do not invent business rules, limits, or integrations. Unknowns become open questions.\n- Read code only to confirm a constraint you must state, and cite path:line. No codebase tour.\n- Use the domain's language, not UI labels.\n- Aim for one page. Cut restatement and adjectives that carry no requirement.\n\nOUTPUT\nProblem · Context and actors · Functional requirements · Non-functional requirements · Edge cases · Acceptance criteria · Open questions · Assumptions\n\nDONE WHEN\nEvery requirement is testable, every acceptance criterion maps to a requirement ID, no implementation steps appear, and every unknown is an open question or a labelled assumption.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 10,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-tests",
    "name": "Tests",
    "description": "Design the smallest test set that gives real confidence in a change.",
    "categoryId": "testing",
    "body": "OBJECTIVE\nDesign the smallest test set that gives real confidence in the change.\n\nINPUTS\n- [BEHAVIOR OR CHANGE]\n- [RISK AREAS]\n- [TEST STACK: framework, existing suites, fixtures]\n\nMETHOD\n1. Map each requirement or risk to the level that can actually catch it: unit for pure logic and branching, integration for contracts, persistence, HTTP, and config boundaries, end-to-end only for critical paths that cross the system.\n2. For each behavior, list the cases: happy path, boundary values, empty and invalid input, error and timeout paths, permission failure, concurrency or retry where relevant.\n3. Choose fixtures and fakes at the boundary (network, clock, filesystem, database). Do not mock the unit under test or its internal collaborators.\n4. Make tests deterministic: fixed time, seeded randomness, no shared state, no ordering dependence, no real network.\n5. For defects, add a regression test that fails without the fix.\n6. Name tests by behavior and expected outcome, not by method name.\n7. State what you deliberately do not test, and why: cost, flakiness, or covered elsewhere.\n\nOUTPUT\n- Requirement to test-level map\n- Test list: name, level, setup, expected result\n- Fixtures and mocks\n- Commands to run them\n- Gaps with justification\n\nDONE WHEN\nEvery stated requirement and risk has a covering test or a justified gap, and no test depends on execution order.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 11,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  },
  {
    "id": "starter-verify",
    "name": "Verify",
    "description": "Check readiness to ship by running real checks and reporting evidence.",
    "categoryId": "testing",
    "body": "OBJECTIVE\nConfirm the change is ready to ship, or state precisely what blocks it.\n\nINPUTS\n- [CHANGE SCOPE: branch, diff, files]\n- [ACCEPTANCE CRITERIA]\n\nMETHOD\n1. Discover the real commands from package scripts, Makefile, CI config, or docs. Do not invent commands.\n2. Run typecheck, lint, the tests relevant to the change, and the production build. Run the full suite when the change touches shared code.\n3. Map each acceptance criterion to evidence: a test, a manual check, or a code reference. Mark unmet criteria.\n4. Inspect the diff for unintended changes: debug output, secrets, commented code, unrelated files, lockfile or dependency drift, generated artifacts.\n5. Check that checks were not weakened: skipped tests, loosened assertions, disabled lint rules, new ignore entries.\n6. Report exact commands and outcomes. A check that could not run is BLOCKED, not passed.\n\nOUTPUT\nVerdict: READY / NOT READY\n\n| Check | Command | Result | Evidence |\n\nUse PASSED / FAILED / SKIPPED / BLOCKED. For a failure, include the first actionable line of output.\nThen: unmet acceptance criteria, unintended changes, unverified items, residual risk.\n\nRULES\n- Never claim a command succeeded unless you ran it and saw the output.\n- Do not fix issues here; report them. Fixing is a separate step with its own verification.\n\nDONE WHEN\nEvery check has an outcome, every acceptance criterion is marked met or unmet, and nothing is reported as passing without evidence.\n\nIf an essential input is missing, ask one question before proceeding; do not invent requirements, data, or constraints.\n\n**Task input:**",
    "fields": [],
    "tags": [
      "engineering",
      "starter"
    ],
    "favorite": false,
    "order": 12,
    "createdAt": "2026-11-08T00:00:00.000Z",
    "updatedAt": "2026-11-08T00:00:00.000Z",
    "revision": 1
  }
];
