import type { LoggingOption, SandboxHooks } from "@ai-hero/sandcastle";
import { claudeCode, createSandbox } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// Run this with: pnpm sandcastle
// or directly: npx tsx .sandcastle/main.mts
//
// One long-lived Docker sandbox works the backlog for a whole round: each
// iteration is a fresh agent session picking up one issue, so the context is
// cleared between issues while the container, the worktree and the installed
// node_modules stay put. Commits accumulate on ROUND_BRANCH, they do NOT land
// on dev; the review and merge commands are printed when the round ends.

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Restrict the round to these GitHub issue numbers. Leave empty to let the
 * agent pick freely from every open `ready-for-agent` issue.
 */
const ISSUES: number[] = [];

/**
 * One issue per iteration, so this needs headroom above `ISSUES.length`: a
 * failed or half-finished iteration burns a slot without closing anything.
 */
const MAX_ITERATIONS = 30;

const AGENT = claudeCode("claude-opus-5-5");
const COMPLETION_SIGNAL = "<promise>NO MORE TASKS</promise>";

/**
 * `undefined` keeps the default: everything is written to
 * `.sandcastle/logs/<branch>-<name>.log` and a `tail -f` banner is printed when
 * the agent starts, which is only after the container build and the install
 * hook. Set it to `{ type: "stdout" }` to follow the run live in this terminal.
 */
const LOGGING: LoggingOption | undefined = undefined;

const HOOKS: SandboxHooks = {
  sandbox: {
    onSandboxReady: [
      // Also runs husky's `prepare` script, wiring up the pre-commit hook so it
      // can fire. `timeoutMs` overrides the 60s default hook budget. Runs once
      // for the whole round, not once per iteration.
      { command: "pnpm install --frozen-lockfile", timeoutMs: 600_000 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Prompt arguments
// ---------------------------------------------------------------------------

const jsonFields = "number,title,body,comments";

/**
 * The shell command `prompt.md` runs to load the backlog. Both variants keep the
 * `ready-for-agent` filter: it is what drops an issue out of the list once the
 * agent hands it off to QA, which is how the loop knows the round is over.
 */
const ISSUE_LIST_COMMAND = (() => {
  const base = `gh issue list --state open --label ready-for-agent --limit 200 --json ${jsonFields}`;
  if (ISSUES.length === 0) return base;
  return `${base} --jq '[.[] | select(.number | IN(${ISSUES.join(",")}))]'`;
})();

const ISSUE_SCOPE =
  ISSUES.length === 0
    ? "Work on any open issue labelled `ready-for-agent`."
    : `This round is scoped to these issues only: ${ISSUES.map((n) => `#${n}`).join(", ")}. Ignore every other open issue, even if it looks more urgent. If all of them are done, output ${COMPLETION_SIGNAL}.`;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const slug =
  ISSUES.length === 0
    ? new Date().toISOString().slice(0, 10).replaceAll("-", "")
    : `${ISSUES[0]}-${ISSUES.at(-1)}`;
const ROUND_BRANCH = `sandcastle/round-${slug}`;

// createSandbox is silent while it builds the container and runs the install
// hook, which takes minutes: announce it so the terminal does not look stuck.
console.log(`Preparing sandbox on ${ROUND_BRANCH} (build + pnpm install)...`);

const sandbox = await createSandbox({
  branch: ROUND_BRANCH,
  sandbox: docker(),
  hooks: HOOKS,
  // The base branch is where the agent will merge its commits, leave blank and it will default to the current branch
  // baseBranch: "sandcastle/round-20260901",
});

console.log(`Sandbox ready: ${sandbox.worktreePath}`);

try {
  // A single `run` with maxIterations > 1 reuses this container and worktree for
  // every iteration, but spawns a brand-new agent session each time, so the
  // context is cleared between issues without paying for a new sandbox.
  const result = await sandbox.run({
    agent: AGENT,
    promptFile: "./.sandcastle/prompt.md",
    maxIterations: MAX_ITERATIONS,
    completionSignal: COMPLETION_SIGNAL,
    promptArgs: { ISSUE_LIST_COMMAND, ISSUE_SCOPE },
    name: "implementer",
    logging: LOGGING,
  });
  console.log(`\n${result.commits.length} commit(s) on ${ROUND_BRANCH}.`);
} finally {
  await sandbox.close();
}

console.log(
  `\nReview with:  git log --oneline HEAD..${ROUND_BRANCH}` +
    `\nMerge with:   git merge --no-ff ${ROUND_BRANCH}`,
);
