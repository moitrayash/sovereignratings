# Handoff prompt for the next chat

Copy everything in the fenced block below into the first message of a new Claude session to fully bootstrap context. Edit `<latest commit>` and `<last task>` if you've pushed more changes since 2026-05-02 18:20.

---

```
You are continuing work on the Sovereign Credit Rating Explorer — a static
website at https://sovereignratings.yashmoitra.com that I'm building as the
interactive companion to my methodology paper. The repo is at
https://github.com/moitrayash/sovereignratings, and the working folder on
my computer is:

  C:\Users\yashm\OneDrive - Cornell University\Desktop\Research\credit rating\cr rating

Before doing anything else, please:

1. Read WEBSITE_HANDOFF.md in that folder — it's the comprehensive briefing
   document for the website work specifically (file architecture, push
   workflow, version history v37–v41, architectural lessons learned, what's
   pending, and how I like to communicate). The hover-glow / axis-arrow
   re-entry-guard saga is in §3.

2. Read HANDOFF.md in the same folder — it covers the broader Python data
   pipeline and the LaTeX paper goal (different layer of the project, but
   useful context for what the website is the companion to).

3. Read push_log.txt to confirm the last successful commit. As of the
   handoff, last push was v41, commit de13cee, "preset peer groups
   (OECD, BRICS+, EU, etc.) on Compare-against dropdown".

4. If your environment has auto-memory, read MEMORY.md plus
   project_credit_ratings.md and user_researcher_profile.md from the
   memory directory.

CRITICAL workflow notes (re-stated from the handoff doc because they're
the most error-prone part):

- Never run git from bash — OneDrive blocks .git operations from the Linux
  sandbox. ALL pushes go through a self-deleting .bat file invoked via the
  Windows Run dialog (cmd+R). The exact pattern is in §4 of
  WEBSITE_HANDOFF.md.
- Click the OK button at coordinate ~(138, 785) rather than pressing Return
  in the Run dialog — Return sometimes silently fails to fire.
- After every push, Read push_log.txt to confirm "=== DONE ===" and the new
  commit hash before reporting success to me.
- GitHub Pages takes ~40 s to rebuild after a push.

shared.js is the central nervous system of the site — every page loads it.
Be careful editing it; the re-entry guards (_scrInjectingArrows,
_scrThemingNow, _scrHooksWired) exist for hard-won reasons, don't remove
them. The comparison-set selector pattern is reusable via
window.SCR_REGION_OF / SCR_PRESET_GROUPS / scrRecomputeRelative.

Communication style: terse, no preamble, no apology theatre, push promptly
when a feature is done. I read the live site rather than your summary. If
I write "bruh" or "fugly" it just means something visual is broken; ask
for clarification only if truly ambiguous.

Pending work in priority order is in §6 of WEBSITE_HANDOFF.md. The most
likely next asks: glossary expansion with institutional vocabulary
(task #42), more historical stories, hover-text-in-dark-mode CSS fix,
extending the comparison-set selector to paired_grouped_regional and
shadow pages, distance-map year animation, or a fresh feature I haven't
named yet.

Wait for me to tell you what to work on. Don't start randomly.
```

---

## When to use this prompt

- **Start of every new chat** about the website — paste it as your first message and Claude will orient itself in 3 file reads instead of asking 20 questions
- **After a long break** — Claude's auto-memory may have drifted; this re-anchors it on the current state
- **When switching computers** — the auto-memory is per-machine; this prompt + the two HANDOFF.md files travel with the repo

## How to update this prompt

After every meaningful push:
1. Edit the line with the version number / commit hash to reflect the latest
2. If you finished a pending item, remove it from the "most likely next asks" list
3. If you started a new track of work, add it to that list
