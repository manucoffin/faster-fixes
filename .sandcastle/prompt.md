# ISSUES

Here are a set of GitHub issues:

!`{{ISSUE_LIST_COMMAND}}`

If all tasks are complete, output <promise>NO MORE TASKS</promise>.

# TASK SELECTION

{{ISSUE_SCOPE}}

Respect declared dependencies: if an issue has a `## Blocked by` section, do
not start it until every issue it names is closed or already handed off to QA.
If every remaining issue is blocked, output the completion signal rather than
starting one anyway.

Pick the next unblocked task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure

Getting development infrastructure like tests and types and dev scripts ready is an important precursor to building features.

3. Tracer bullets for new features

Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

4. Polish and quick wins
5. Refactors

# EXPLORATION

Explore the repo.

# IMPLEMENTATION

Complete the task.

# COMMIT

Make a git commit. The commit message must:

1. Include key decisions made
2. Include files changed
3. Blockers or notes for next iteration

# THE ISSUE

If the task is complete, hand it off for QA:

1. Remove the `ready-for-agent` label and add the `ready-for-human` label
2. Leave a QA checklist comment so a human (or a later QA pass) can verify the
   work before closing. The checklist must be:
   - Specific to what this issue changed, not generic boilerplate.
   - Written as GitHub task-list items (`- [ ] ...`) so they can be ticked off.
   - Framed as observable outcomes ("The Briefing email lists the selected
     posts with their links"), not implementation notes.
   - Include how to exercise each item (route, action, expected result) and any
     edge cases or regressions worth spot-checking.

   Use this shape:

   ```
   ## QA checklist

   How to verify before closing:

   - [ ] <observable behavior> — <how to trigger> → <expected result>
   - [ ] <edge case to spot-check>
   - [ ] No regression in <adjacent area touched>
   ```

If the task is NOT complete, keep the `ready-for-agent` label and leave a
comment on the GitHub issue describing what was done and what remains.

# FINAL RULES

ONLY WORK ON A SINGLE TASK. If you receive a multi-phase plan, only work on a single phase of that plan.
