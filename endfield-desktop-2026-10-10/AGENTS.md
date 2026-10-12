# AGENTS.md — how to work in this folder

You are continuing a design project for Mario. Read `README.md` first, then `brief/12-endfield-space.md` in full,
then look at every image in `refs/`. This file is about **how** you work. Follow it exactly.

## The method

1. **Read before you touch anything.** Read all of the README, the whole brief, and `kit/CONCEPT-API.md`, plus the
   concept you start from (`concepts/12-endfield-space.js` + `.css`). Don't skim. If you haven't opened a file,
   don't make claims about it.
2. **Write the plan down before writing code.** Add a dated entry to `WORKLOG.md`:
   - what you'll build in this step;
   - which brief rules it covers;
   - which files you'll create or change;
   - how you'll check it worked.
   Keep it to 5-10 lines.
3. **One small step at a time.** A step is one thing, such as "the Firefox entrance" or "exits fade in place".
   Never "build all of 13". Finish, check and log one step before starting the next.
4. **Never overwrite.** New work goes in new files (`concepts/13-<name>.*`). Never edit `kit/harness.html`,
   `kit/build.py`, `brief/`, `refs/`, or another concept's files. If you think one of them needs to change, write
   that in `WORKLOG.md` and ask Mario.
5. **Check every step for real:**
   - build it: `python3 kit/build.py 13-<name>`, which must print `built ...`;
   - syntax-check the JS: `node --check concepts/13-<name>.js`, if node is available;
   - **look at it**: open `out/13-<name>.html` in a browser, or take screenshots if you can run a headless browser.
     Trigger the thing you built (keys and hooks are in `kit/CONCEPT-API.md`), and check it both at rest and
     mid-motion (use `?slow=10` to slow every animation 10x);
   - if you can't look at it, say exactly that. Don't say "it works".
6. **Self-review against the rules before you report.** Fill in `CHECKLIST.md` for your concept: one line per
   brief rule, saying done, partly done or not done, with a reason. Be harsh. "Generic dark boxes with a yellow
   accent" is the failure Mario keeps rejecting.
7. **Report honestly.** Say what you built, what you checked and how, and what you didn't check. Never say
   something is done when it isn't. A bug you mention is fine; a bug you hide is not.
8. **Stop when stuck.** If the same error comes back after 2 attempts at fixing it, stop. Write what you tried in
   `WORKLOG.md` and ask. Don't spiral into rewrite after rewrite.

## Don'ts (things that went wrong before)

- Don't rewrite a whole file to change one part. Make small, targeted edits.
- Don't invent features the brief doesn't ask for. If you have an idea, put it under "Ideas" in `WORKLOG.md`
  instead of building it.
- Don't use CSS transitions or `@keyframes` for the main motion. Use `requestAnimationFrame` + `performance.now()`
  tweens with the brief's curves. Headless screenshots freeze CSS animation, so CSS-only motion can't be checked.
- Don't use pure white, and don't spread the tri-band everywhere (once per view). Don't let exits move (rule 15).
- Don't copy one component's recipe onto another (rule 22): each gets its own design, with 6-9 layers.
- Don't touch anything outside this folder.

## Talking to Mario

- Plain English, short, no jargon walls. Raise **one decision at a time**, with your recommendation and why.
- He wants honest pushback if an idea of his won't work, plus a better option. It's still his call.
- When he gives you a new reference image, save it into `refs/` with a descriptive name, add a numbered rule to
  `brief/12-endfield-space.md` (the one brief edit you're allowed), and log it.

## Files you keep up to date

- `WORKLOG.md`: dated entries (plan -> what you did -> how you checked -> result). Append only.
- `CHECKLIST.md`: per concept, rules 1-23 with done / partly done / not done.
