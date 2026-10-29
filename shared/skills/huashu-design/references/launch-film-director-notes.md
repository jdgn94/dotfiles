# Launch Film workflow: first write 10,000 words director's notes, then animate

> Standard workflow for high-standard visual works (≥ 20 seconds, including brand narrative, including slogan reveal, and may be promoted on X/official account/Bilibili).
>
> Trigger conditions: The task is "product upgrade promotional video/brand launch film/launch trailer/superbowl-tier ad/brand campaign/hero animation video", and **users have clear expectations for quality** (such as "Super Bowl quality", "10x details", "Apple level").
>
> Anti-trigger: Don’t use this process when “making a quick animation demo”, “simple motion graphic” or “single icon animation” - it will be over-engineered.

---

## 1. Why write director's notes first?

Practical lessons (2026-05-11 huashu-md-html v2.0 project):

In the first round, I wrote HTML directly, and the output was "animation from a programmer's perspective" - each capability uses average effort, the rhythm is uniform, slogans collide with each other, and there is no narrative arc.
In the second round, I received the user’s instruction to “stop and write a 10,000-word storyboard script from Apple’s director’s perspective.” I wrote v5-director-notes.md (11,500 words, 13-shot shot-by-shot spec), and then implemented it according to the script—one pass, each frame of pause is watchable, and the rhythm has ups and downs.

**Core Difference**: Think is used to write scripts, and execute is used to write HTML. First think clearly, execute is mechanical translation. Execute first. Each shot is an on-the-spot decision, which is bound to be messy.

Writing director's notes is not "pretending", it is precipitating all visual decisions into documents before taking action - every shot has been visualized, reasoned, and contextually traced in the mind. HTML implementation no longer requires creative decisions, just faithful translation.

---

## 2. Trigger judgment (ask yourself 3 questions first)

Questions before starting the launch film workflow:

1. **Does this film carry a brand narrative? ** (with thesis / slogan reveal / sense of upgrade ceremony) - Yes → follow the director's notes process
2. **Will the audience pause watching? ** (Maybe take screenshots, make X poster, make cover, slow review) - Yes → Each frame should be watchable
3. **Does the customer/user have a reference of "I want to be like XXX"? ** (Apple / Anthropic / Nike / Penguin / Director) - Yes → Visual context must be clear

If any answer is "Yes", go through the process. If all three are "no", skip it and use the standard process of [animations.md](animations.md) directly.

---

## 3. 5 Most Structure of Director's Notes

Ten thousand words (10,000-12,000 words in Chinese/equivalent in English) director's notes must contain these 5 parts. **If any part is missing, it is incomplete and the quality will be affected**.

### Part I · Director's Statement (On Creation, about 1500-2000 words)

Answer 5 questions:

1. **What is this movie not? ** (explicitly excluded - such as "This is not a feature introduction film" "It is not a demo")
2. **Core thesis line** - Which sentence will the audience only remember after reading it?
3. **Whose contextual conversation are you talking to? **——List 5-8 visual references (director/designer/brand/photographer/title of work + year) and explain what was learned from each reference
4. **Three types of audience portraits + commitment to each type**: primary audience / secondary audience / external audience, each corresponding to a paragraph
5. **Rhythm Philosophy** - Curve description of slow beat/acceleration/peak/slow end + emotional climax at which second (**not necessarily the last second**)

Finally, add an anti-slop checklist: **Things this film does not do** (be specific, not vague).

### Part II · Visual System (full spectrum of visual system, about 1500-2500 words)

This is an engineered visual spec. After it is complete, any executor who gets it can produce consistent vision.

Required subsections:

- **Complete color palette**: at least 8-10 colors, each color contains HEX + function definition + upper limit of screen ratio
- **Font system**: at least 6 font size levels, each level includes font name + weight + size + letter-spacing + purpose
- **Grid system**: canvas size + margin + column grid + baseline grid + key safety area + golden section anchor point
- **Animation system**: easing library (within 4 items) + duration dictionary + stagger rule + scene transition rule
- **Chrome elements**: small details throughout the film (counter / chip / ticker / watermark / texture), each including position + entry and exit timing
- **Audio System**: BGM 30-second trend curve (layered) + SFX dictionary (10+ cues including timecode + volume + band isolation)
- **Anti-AI slop checklist**: per-shot self-check list (10-15 items)

Iron rule: **All visual decisions are derived from the Visual System, do not improvise new values in the shot list**.

### Part III · Story Arc (story arc, about 500-800 words)

Three-act structure + emotional curve:

- **Act I · SETUP** (0 → 1/5th duration, e.g. 0-6s for 30s): Audience enters, questions are asked
- **Act II · ESCALATION** (Middle 2/3): The answer is expanded and the theme is laid out
- **Act III · PAYOFF** (last 1/4): sublimation, slogan reveal, brand seal

Contains ASCII emotion graph + emotional climax moment mark.

**Key Decision**: climatex doesn’t have to be at the end. The climax of a 30s movie is usually between 22-25s (not 29s) - the last few seconds are resolution/decay, not peak. Violation of this rule will inevitably make the work "anticlimactic".

### Part IV · Shot-by-Shot Storyboard (storyboard, about 5000-7000 words · 60% of the length)

Each mirror contains 10 fields (all are indispensable):

```
SHOT NN · NAME
[TIMECODE] start and end time + duration
[FUNCTION] The function of this mirror in the story arc (one sentence)
[VISUAL] Picture composition + element position + movement direction
[TYPE] Typesetting spec (font/font size/kerning/line height/color/alignment)
[ANIM] Each element in/out timing + easing + duration + stagger + delay
[AUDIO] music beat + SFX cue (each shot corresponds to BGM rhythm + must include SFX schedule)
[CHROME] Four corner element status (which chrome is in/which fade in/out/which pulse)
[ANTI-SLOP] What self-inspection items did this lens pass + what 120% detailed signature is there
[WHY] The logic of inheriting the previous shot + the hook of advancing the next shot
```

**Field average 30-80 words → 400-700 words per mirror → 12-15 mirrors → 5000-7000 words**.

Practical experience: After writing the storyboard, **read it yourself** - if any scene is deleted, will the entire film still stand? If it can be deleted, then the mirror is redundant and should be deleted.

### Part V · Production Manifest (production list, about 800-1200 words)

Project delivery list:

- Font loading URL (including preconnect)
- CSS variables (can be pasted directly)
- BGM source selection criteria + Suno/Udio prompt keywords + alternative libraries
- SFX dictionary (lists file paths + volume per cue by timecode)
- **Keyframe Verification Plan**: 12-15 pause-and-check keyframe timecodes, verification items listed for each frame (fonts/positions/chrome state)
- Recording parameters (fps/codec/bitrate/preset)
- ffmpeg audio mixing command (including audio stream verification)
- Deliverables list (mp4/mp4-60fps/gif/poster.png/silent.mp4/shot-list.csv)
- Full link time estimation (hour-level accuracy)

---

## 4. 5 tips for writing director’s notes

**4.1 Use the director’s tone, not the PM’s tone**

❌「This shot displays the product features.」
✅「This is the hero shot — if the audience pauses anywhere, I want it to be here.」

The director’s notes are for the executors to read, but they are also for the future self. First person + judgment expressions leave more clues for decision-making than description expressions.

**4.2 Cite specific works (including year), not just genre names**

❌「Apple-inspired」
✅ "Apple 'Designed by Apple in California' (2013, dir. Mark Romanek) — I learned slow beat + serif + white background"

The advantages of citing specific works: (a) Any audience can search for comparisons online (b) You force yourself to think clearly about the specific technology you are learning (c) Prevent "blurred inspiration".

**4.3 Each decision is traced back to the first principle**

The whole film has a first principle (such as "Markdown is the new typewriter."). Every specific decision—color/font/tempo/chrome—should be able to trace back to this sentence.

The decision that is not traceable is to decorate and delete it.

**4.4 Writing anti-slop is more important than writing do-this**

A list of “things this movie doesn’t do” (purple gradient / emoji / Lorem ipsum / Inter display / SVG character drawing / rounded card + left border accent) is a better way to protect quality than a list of “things this movie does”.

There are infinite positive decisions, and the negative checklist is limited - but once the negative checklist is violated, it is a slop.

**4.5 Don’t implement it immediately after writing – read it again after 30 minutes**

When writing, the brain is in “production mode” and cannot see inconsistency. If you read the storyboard you wrote every 30 minutes, you will find:
- Some two mirrors have duplicate functions (delete one)
- The narrative jump in a certain scene is too big (add transition)
- emotional climax wrong position (move)
- chrome element and shot number mismatch (realignment)

What these 30 minutes save is 2 hours of rework later.

---

## 5. Director's Notes → HTML implementation process

After writing director's notes, HTML implementation steps:

1. **Reuse starter components** (Stage/Sprite/Easing/interpolate of `assets/animations.jsx`) - No reinvention
2. **CSS variables are pasted directly from Visual System Part II** — no temporary color changes in HTML
3. **Press Sprite start/end timeline to compare Part IV timecode** — Do not add lenses without permission
4. **Chrome elements are extracted into independent components** (ChromeA/B/C/D), and useTime() is used to drive state switching
5. **destination cards content must be real and readable** (not fake bar lines) - This is the most repeatedly mentioned 120% detailed signature in the v5 project
6. **Every time you finish writing a scene, immediately capture the keyframes for verification** (use `?t=NN` URL parameter + Playwright), do not write the entire film and then verify it together

---

## 6. Keyframe verification process

URL parameter implementation (must be added in Stage component):

```js
const urlMatch = window.location.search.match(/[?&]t=([\d.]+)/);
const frozenTime = urlMatch ? parseFloat(urlMatch[1]) : null;
const [time, setTime] = useState(frozenTime != null ? frozenTime : 0);
const [playing, setPlaying] = useState(frozenTime == null);
```

→ This way `file:///path/animation.html?t=14.5` directly freezes at 14.5 seconds.

Batch screenshots:

```bash
for t in 0.5 2.5 4.9 7.0 10.5 13.5 16.5 19.0 21.5 23.4 25.5 28.0 29.9; do
  npx -y playwright screenshot \
    "file://$PWD/animation.html?t=$t" \
    "keyframes/t-$t.png" \
    --viewport-size=1920,1136 \
    --wait-for-timeout=2500
done
```

Each screenshot must be verified:
- [ ] element without overflow 1920×1080 canvas
- [ ] Word spacing and line height visually correct (not crowded or scattered)
- [ ] key typography details (period color / em-dash / italic / small caps) identifiable
- [ ] chrome element position + status is correct
- [ ] Anti-AI slop checklist passed
- [ ] 120% of the details of "worth watching during pause" exist

---

## 7. Multi-perspective parallel strategy (advanced)

For complex projects (such as a launch film where you can’t choose a direction/want to see multiple aesthetic differences/the client doesn’t agree on the style), you can start multiple subagents in parallel to create versions from different director’s perspectives**.

Actual configuration (2026-05-11 huashu-md-html project, 6 versions in parallel):

```
v5 · Baseline (Anthropic / Penguin Classics Press Grade)
v5a · Wes Anderson (Symmetry + Vintage + Chapter Cards)
v5b · Saul Bass (paper cutting + 60s large characters + geometric cutting)
v5c · Wong Kar Wai (Chinese serif + slow motion + nostalgia)
v5d · Massimo Vignelli (modernism grid + red and black)
v5e · Kenya Hara (minimalist Japanese style + blank space)
v5f · Yayoi Kusama (polka dots + repetition + single strong color)
```

Each subagent receives an independent brief:
- Project background (same copy)
- Must-read reference (same v5-director-notes.md as methodology template)
- **Designated Artist DNA** (color palette / font / visual language / rhythm / signature elements / anti-slop enhanced version, 30-50 words each)
- Unified task list (director-notes.md + animation.html + keyframes/ + README.md)
- Uniform Constraints (30s / 1920×1080 / file:// / Google Fonts)

Parallel startup + background running, 6 complete versions will be produced in about 30-60 minutes.

Review and comparison after completion:
1. Core aesthetic decision-making table for each version
2. Side-by-side comparison of key frames (one frame in each version at the same time)
3. Vote: Which one best meets the real needs of users?

**Key**: Don't let subagents reference each other - they must produce independently, otherwise they will hit the "average". Each subagent's instructions should clearly state "Don't repeat the aesthetics of v5."

---

## 8. Several typical trigger scenarios

| User scenario | Whether to trigger | Remarks |
|---------|---------|------|
| "Make a SaaS upgrade promotional video" | ✅ Trigger | Complete the process by default |
| "Apple level/Super Bowl quality video" | ✅ Trigger + Upgrade | Highly recommended for multi-view parallelism |
| 「30 Seconds Brand Launch Film」 | ✅ Trigger | |
| "This project requires a 10,000-word script to be animated" | ✅ Trigger | User clearly specified |
| "Simple motion graphic, rotate the logo" | ❌ No triggering | Use animations.md standard process |
| "Make an onboarding animation demo" | ❌ Do not trigger | Use animations.md |
| 「Tutorial video with dubbing」 | ❌ Do not trigger | Go to voiceover-pipeline.md |
| 「Single hero animation」 | ⚠️ Look at the complexity | If it is a high-specification hero, trigger; for ordinary heroes, use hero-animation-case-study.md |

---

## 9. Reference sample

Complete director's notes reference sample (self-contained, within this skill):

`assets/director-notes-samples/launch-film-30s-sample.md` (about 78KB · 11500 words · 13 images · 5 mostly complete)

Original project location (including corresponding implementation HTML + keyframes):

- `~/.claude/skills/huashu-md-html/demos/v5-director-notes.md`（director's notes）
- `~/.claude/skills/huashu-md-html/demos/v5-six-forms.html` (HTML implementation)
- `~/.claude/skills/huashu-md-html/demos/v5-keyframes/` (keyframe verification screenshot)

When writing a new project, it is strongly recommended to **read this sample** first, understand the workload and density of details, and then decide whether to follow the entire process.

---

## 10. Anti-Pattern (Don’t Do This)

❌ **Write a condensed version of 1000 words on director's notes**
→ The streamlined version will inevitably miss a certain sub-item of Visual System, causing the spec to be constantly added during HTML implementation. If you want to do it, do it at the 10,000-word level. If you want to save, just skip it.

❌ **storyboard only writes 5-8 mirrors**
→ 30 second film with at least 12-15 shots (2-3 seconds per shot). Few mirrors = even rhythm = no climax.

❌ **director's notes will be delivered as soon as they are written, without implementation**
→ Documentation is not the deliverable, animation is. Documents + animations are delivered together, and the documents are included as an appendix to the "Design Basis".

❌ **Let the subagent see other versions when using multiple perspectives in parallel**
→ Each subagent must be independent, otherwise it will converge. Only compare during the review stage.

❌ **Skip keyframe verification and record directly to MP4**
→ Rework is inevitable. Keyframe verification is the cheapest quality gate.

❌ **Delay the decision-making on animation details until “I’ll think about it when I’m recording”**
→ The recording stage is a mechanical execution and no creative decisions can be made. All decisions must be documented in the director's notes.

---

*Last revision: 2026-05-11*
*Real case: huashu-md-html v2.0 launch film (v5-director-notes.md)*
