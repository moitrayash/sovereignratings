# Handoff prompt for the next chat

Copy everything in the fenced block below into the first message of a new Claude session to fully bootstrap context. Edit `<latest commit>` and `<last task>` if you've pushed more changes since 2026-05-02 20:51.

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
   workflow, version history v37–v46, architectural lessons learned, what's
   pending, and how I like to communicate). The hover-glow / axis-arrow
   re-entry-guard saga is in §3.

2. Read HANDOFF.md in the same folder — it covers the broader Python data
   pipeline and the LaTeX paper goal (different layer of the project, but
   useful context for what the website is the companion to).

3. Read push_log.txt to confirm the last successful commit. As of the
   handoff, last push was v46, commit b4020e0, "new Relative Planetary
   Pressure Index tab structurally identical to Relative HDI; PPI recovered
   from UNDP HDR 2023-24 PHDI/HDI ratio for 88 countries 1990-2022;
   downloadable raw-data ZIP at the bottom of the page".

4. If your environment has auto-memory, read MEMORY.md plus
   project_credit_ratings.md and user_researcher_profile.md from the
   memory directory.

CRITICAL workflow notes (re-stated from the handoff doc because they're
the most error-prone part):

- Never run git from bash — OneDrive blocks .git operations from the Linux
  sandbox. The bash mount also lags behind the real filesystem; trust the
  Read/Write file tools, not bash `wc -l`. ALL pushes go through a
  self-deleting .bat file invoked via the Windows Run dialog (cmd+R or
  Win+R). The exact pattern is in §4 of WEBSITE_HANDOFF.md.
- Drive the Run dialog yourself with computer-use:
    * request_access for "Run" (and "File Explorer" if Win+R is blocked
      from the desktop shell)
    * Win+R, then triple_click + ctrl+a + Delete to clear (autocomplete
      will refill with the previous bat path otherwise — verify with
      a zoom screenshot before clicking OK)
    * type the absolute quoted path
    * Click the OK button at coordinate ~(138, 785) rather than pressing
      Return — Return sometimes silently fails to fire
- After every push, Read push_log.txt to confirm "=== DONE ===" and the new
  commit hash before reporting success to me.
- GitHub Pages takes ~40 s to rebuild after a push.

shared.js is the central nervous system of the site — every page loads it.
Be careful editing it; the re-entry guards (_scrInjectingArrows,
_scrThemingNow, _scrHooksWired) exist for hard-won reasons, don't remove
them. Reusable patterns:
  - window.SCR_REGION_OF / SCR_PRESET_GROUPS / scrRecomputeRelative
    drive the Compare-against selector on Relative HDI/Gini/PPI
  - window.scrAutoDecorateTerms (v43) auto-wraps technical vocabulary
    with hover tooltips; uses tips.js TIPS dictionary + TIPS_ALIASES map
  - the v45 Section-4 time-animation pattern (racing bar + scatter with
    Plotly frames + Play button + slider) is reusable across any
    Relative-* page; Relative HDI and Relative PPI both have it; Gini
    does not yet

Communication style: terse, no preamble, no apology theatre, push promptly
when a feature is done. I read the live site rather than your summary. If
I write "bruh" or "fugly" it just means something visual is broken; ask
for clarification only if truly ambiguous.

Pending work in priority order is in §6 of WEBSITE_HANDOFF.md. The most
likely next asks: glossary expansion with institutional vocabulary
(task #42), more historical stories, hover-text-in-dark-mode CSS fix,
time animation on Relative Gini (mirror the v45 HDI / v46 PPI pattern),
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

## Recent run quick-glance (v44–v46, 2026-05-02 evening)

- **v44** `90fe382` — Stories chart truncation fix; "By the numbers" callouts on all 5 stories citing real M1/M2/shadow-gap; Italy 2013 + India 2001/2008 added as "shadow caught what the headline missed" cases
- **v45** `803eb10` — Layman tooltips site-wide (tips.js rewrite + scrAutoDecorateTerms in shared.js); animated time slider added to Relative HDI Section 4 (racing bar + HDI×100-vs-M4 scatter, both Plotly frames + Play + slider, both peer-set-aware)
- **v46** `b4020e0` — New Relative Planetary Pressure Index tab; PPI recovered from UNDP PHDI/HDI for 88 countries 1990-2022; full mirror of Relative HDI page including Section-4 time animations; raw-data ZIP download block at bottom (`.raw-download` class with primary pill + manifest table)
