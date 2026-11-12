# Practice: How we work on this project

Claude Code: read this file and SPEC.md at the start of every session.
Follow these rules on every request.

## 1. Before you start

- Read SPEC.md. It is the source of truth. If a request conflicts with
  it, stop and ask. Do not change SPEC.md without my approval.
- Check the current branch with git status. Never work on main.

## 2. Work on one feature at a time

For every request, follow this order:

1. Review: say in a few sentences what you will build and which files
   you will change. Wait for my OK.
2. Build: implement only that one feature. Do not add extras.
3. Test: open the page, check on a 360 px phone width, and go over the
   related items in "Done means" in SPEC.md. Report what you checked.
4. Show me the result and wait for my approval.

Exception for the dashboard batch (branch feature/dashboard): the
remaining SPEC features are built in one go, in the order I gave. Steps 1
to 3 still apply to each feature, but do not stop for approval between
features. Give me one report at the end and I approve once.

## 3. Commit and push on every approved feature

- Only after I approve a feature: commit and push. One feature, one
  commit. Never commit unapproved work.
- Commit message: short, English, starts with a verb.
  Examples: "Add call now list", "Fix score for far leads".
- Push right after the commit, to the feature branch.
- Never use force push.

Exception for the dashboard batch (branch feature/dashboard): there is
one branch and one pull request for all the features. Make one commit
per feature, each with its README line. Push once at the end, after the
last feature, and open one pull request. I approve once at the end, and
I review and merge the pull request.

## 4. Update the README on every approved feature

- The project has a README.md. After each approved feature, update its
  "Features" section: add or change one short line that describes what
  the dashboard can do now, in plain language.
- Keep the README current. It must always match what the dashboard
  really does.
- Include the README change in the same commit as the feature.

## 5. Branches and pull requests

- One branch per feature, named feature/short-name. Bug fixes use
  fix/short-name.
- Open a pull request on GitHub for each branch. I review and merge.
- After merge, switch to main, pull, and delete the old branch.

## 6. Bugs

- Every bug that is found becomes a GitHub issue with a clear title and
  the steps to reproduce.
- The fix commit message includes "Fixes #number".
- Findings from a code review count as bugs. Open one issue that lists
  all the findings before fixing them.
- No fix is merged without an issue.

## 7. Code rules

- Plain HTML, CSS and JavaScript. No external libraries.
- Mock data only, kept in data.js.
- Follow section 8 of SPEC.md: sea and sand colors, large buttons,
  accessibility, never color alone.
- Hebrew, right to left, for everything the user sees.

## 8. Never

- Never build several features in one go, unless I approved a batch in
  advance. The only approved batch so far is the dashboard batch
  described in sections 2 and 3.
- Never skip testing.
- Never edit SPEC.md or Practice.md without asking me.
- Never commit secrets or personal data.
