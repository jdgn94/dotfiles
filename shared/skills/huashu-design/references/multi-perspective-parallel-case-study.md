# Multi-perspective parallel experiment · Case Study

> huashu-md-html v2.0 launch film project · 2026-05-11
> Parallel director's notes + HTML + keyframe experiment from 6 artist perspectives

---

## Background

When the user requested "produce a 30-second upgrade promotional video for huashu-md-html v2.0", the main thread first produced the v5 baseline (Anthropic / Penguin Classics publishing house grade). But the user thought it could be done better and gave a critical instruction:

> "Calling different subagents to generate 6 completely different versions of expression and visual design. You can try using different directors and artists. Then after all are completed, review and review."

This is the first systematic "multi-perspective parallel director's notes" experiment, which verifies a reusable workflow.

---

## Selection logic of 6 perspectives

Don’t choose 6 designers at random - they must be highly visually differentiated to avoid convergence.

Six perspectives of final selection (including reasons for selection):

| Perspective | Genre | Aesthetic anchor | Differences from other perspectives |
|------|------|---------|----------------|
| **v5 Baseline** | Modern Publishing House | Anthropic terra cotta + Penguin Classics serif + Vignelli grid | A safe "tasteful" choice |
| **v5a Wes Anderson** | Film Chapter Aesthetics | The French Dispatch Magazine Feel + 1960 Olivetti Industrial Catalog | Symmetrical Composition + Chapter Cards + Decorative Borders |
| **v5b Saul Bass** | 60s video title art | cut-paper + Trajan caps + flowing geometry | paper-cut silhouette + large characters + strong diagonal lines |
| **v5c Wong Kar-Wai** | Hong Kong-style new wave | "In the Mood for Love" "2046" letterboxing + Chinese serif | slow shot + fog halo + mainly Chinese |
| **v5d Massimo Vignelli** | 1970 Modernism | Knoll identity manual + NYC Subway map | Strict grid + 3-color iron law + rejection of decoration |
| **v5e Kenya Hara** | Minimalist Japanese style | MUJI poster + "White" | White space philosophy + no chrome + ma room |
| **v5f Yayoi Kusama** | Installation Art | Infinity Mirror Rooms + Polka Dot Obsession | obsessive repetition + single strong color + polka dots |

**Selection Principles**:
1. **3 different geographical cultures** (Western movies/Japanese design/Hong Kong-style Chinese)
2. **3 different eras** (1960s / 1970s / 2010s+)
3. **3 different carriers** (film/graphic design/installation art)
4. **Each has a visual signature that is “completely opposite to the common SaaS aesthetics in the training corpus”**

---

## Implementation process

### Step 1 · Write a separate brief for each perspective (about 15 minutes)

Each brief contains 8 fixed fields:

```
1. Project background (same copy)
2. Must-read reference (the same v5-director-notes.md is used as the methodology template)
3. What you have to do (4 deliverables)
4. The artist’s DNA (6 core fields):
   - Swatch (specific HEX)
   - font (specific name + alternative)
   - Visual language (core items)
   - identifiable signatures
   - Rhythm (different from other perspectives)
   - Enhanced version of anti-AI slop (off-limits in the context of this style)
5. 30 seconds structure reference (4-6 shot drafts)
6. Design requirements for destination cards (keep it real and readable)
7. Key constraints (30s / 1920×1080 / file:// / Google Fonts CDN)
8. Output verification list + complete report format
```

**Key**: Each brief must emphasize "**Do not repeat the aesthetics of v5**" - otherwise the subagent will be affected by the v5 director-notes and converge.

### Step 2 · Start 6 subagents in parallel (6 Agent tool calls in the same message)

```js
Agent({ subagent_type: "general-purpose", run_in_background: true, name: "v5a-anderson", ... })
Agent({ subagent_type: "general-purpose", run_in_background: true, name: "v5b-bass", ... })
// ... 6
```

Running in the background, expected 30-60 minutes.

### Step 3 · Idle work during waiting period

Don’t poll agent status. Subagent completes task-notification automatically. While waiting do:

- Fix v5 baseline bug of main thread
- Write review framework (dimensions/Q&A for each version)
- Precipitation methodology into skill (this is the source of this case study)
- Prepare final summary document skeleton

### Step 4 · Failure handling (about 16% failure rate, acceptable)

Practical observation: About 1 of the 6 subagents will fail due to network or token exceeding the limit (Bass first round socket error). Processing:

1. When receiving the completion notification, check the output folder of the agent immediately
2. Missing key deliverables → Restart the agent (same brief, can be marked "Last time failed, please re-execute")
3. Partially completed (if there is html but no screenshot) → the main thread will make up Playwright screenshots without restarting the agent

### Step 5 · System review after version 6 is completed

Review framework (5 dimensions + 3 top-level questions + use case allocation):

```
5 dimension score (1-10 per dimension):
- Distinctiveness visual differentiation
- Coherence Aesthetic consistency
- Anti-slop anti-AI slop execution
- Story arc Rhythm and story arc
- Pause-and-look detail density

3 Top-level question:
- Q1 Screenshot sharing? (Can trigger pause on social platforms)
- Q2 Remember a sentence? (Can leave proposition-level memory)
- Q3 Across generations? (Looking back in 5 years, it doesn’t look cheap)

use case distribution (by platform and audience):
- Official account / X / Station B / Moments / Dribbble / Customer demo / Private domain / ...
```

For details, see REVIEW.md in the same directory as `assets/director-notes-samples/launch-film-30s-sample.md`.

---

## Experimental output (facts)

### Volume of documents

- v5 baseline director-notes: 11500 words
- 6 perspectives director-notes 4000-12000 words each
- Total document volume: approximately 55,000-70,000 words
- 5 Mostly structured: 6/6 version

### HTML implementation

- independent animation.html for each version, 30 seconds, 1920×1080
- File size 28-74KB
- All file:// can be opened (does not depend on server)

### Keyframe

- 10-18 PNGs per edition, covering the full 30 second story arc
- Total screenshots: 80+
- Average PNG size: 100-200KB

### Duration

- 6 subagents running in parallel: ~12-15 minutes (duration_ms shown)
- Main thread parallel idle work (v5 revision + writing methodology): completed at the same time
- Overall "from starting 6 perspectives to having all deliverables in place": about 60 minutes

---

## Key insights (written for future users of huashu-design)

### Insight 1 · "Write 10,000 words first director's notes" methodology **completely reproducible**

All 6 subagents produced a complete spec of 4000-12000 words according to most of the 5 structures, and all achieved marketing-ready quality when implementing HTML. This proves that the methodology itself does not rely on the talent of a single executor - **as long as the brief is given clearly, multiple independent executors can produce consistent high-quality results**.

### Insight 2 · "Perspective" must be specific to "work + year"

Each brief lists specific work dialogues:
- Anderson → *The French Dispatch* (2021) + *Moonrise Kingdom* (2012) + Penguin Classics dust jackets + 1960s Olivetti catalogues
- WKW → *In the Mood for Love* (2000) + *2046* (2004)
- Vignelli → 1972 NYC Subway map + Knoll identity manual + *The Vignelli Canon*
- Hara → MUJI brand 1995-2023 + White + Junya Ishigami transparency
- Kusama → Infinity Mirrored Rooms (2013-2023) + Polka Dot Obsession installation

**Practical results**: All subagents accurately captured the core visual DNA of the work, rather than the "average" of the genre.

### Insight 3 · The “style-enhanced version” of anti-AI slop is the key

Universal anti-slop (purple gradient / emoji / SVG character) applies to all versions. But **each style also needs to write "exclusive anti-slop"**:

- Bass: No need for Helvetica (too clean, Bass is rough)
- Vignelli: no rounded corners (all corners 90°)
- Hara: No gradient + no sans display
- Kusama: Without the modern SaaS look
- Anderson: No cyber color scheme
- WKW: No Inter (WKW uses serifs)

After adding these, the 6 versions have extremely high style purity, and none of them converge with each other.

### Insight 4 · The real value of multiple perspectives is not “selecting winners”

The original idea was to use A/B testing to select the best version. During the actual review, I found that: **6 versions each have a clear use case**:
- v5 baseline → Product page / WeChat reading (high information density)
- Anderson → Long header image of public account (strong sense of flipping through magazines)
- WKW → Station B / Chinese culture (nostalgic temperature)
- Vignelli → Design Circle / Dribbble (each frame is a printed poster)
- Hara → Customer Demonstration / Static Screenshot (Minimalist Philosophy)
- Kusama → X short video / viral (visual impact)

**Conclusion**: Marketing is not a single-shot, but a platform-specific multiplex. The real value of 6-perspective parallelism is to allow a project to have 6 differentiated weapons, not to make 5 versions unavailable.

### Insight 5 · Subagent failure rate ~16% is acceptable

1 out of 6 failed (Bass first round socket error). Processing cost: restart + 5 minutes of simplified version brief, wait 12-15 minutes. **Comparison vs. waiting for 1 agent to run 6 versions sequentially (90+ minutes)** - Parallel + retry is obviously more economical.

### Insight 6 · The main thread must do substantive idle work while waiting

subagent takes 12-15 minutes to complete. The main thread should never be idle during this time:

- **Main version bug** (already reported by users)
- **Write review framework** (fill in while waiting for review)
- **Precipitation methodology to skill** (such as this case study)
- **Prepare final summary** (it will be clear at a glance when users come back)

This is the "main thread responsibility" of parallel multi-agent workflow - not PM and other results, but orchestrator synchronous advancement.

---

## When to enable "Multi-View Parallel"

| Scenario | Whether to enable | Reason |
|------|---------|------|
| The user clearly said "I want to look at different directions" and "make a few more versions" | ✅ Activate immediately | Direct demand |
| The first version was made and users were dissatisfied but could not tell what they wanted | ✅ Enable | A/B selection is better than "I guess what you want" |
| The project is ready for multi-platform distribution (X/official account/Bilibili/moments) | ✅ Enabled | One version per platform |
| The customer has no decision-making style but has a budget (time + token) | ✅ Enable | Repeated changes = 5 times the cost |
| User has given clear style reference and only needs 1 version | ❌ Not enabled | Waste |
| Mission is simple motion graphic / icon animation | ❌ Not enabled | Over-engineered |
| Time is tight < 30 minutes | ❌ Not enabled | subagent cannot be finished |

---

## Complete methodology flow chart

```
User brief (including quality expectations)
       ↓
[Main thread] Write v5 baseline director's notes (most of 50,000 words)
       ↓
[Main thread] Implement v5 HTML + cut key frames (marketing baseline)
       ↓
[Decision Point] Enable multi-view?
       ↓ YES
[Main thread] Select 6 differentiated perspectives + write 6 independent briefs (8 fields each)
       ↓
[6 subagents parallel]
   ├── v5a brief → director-notes + html + keyframes + README
   ├── v5b brief → ...
   ├── v5c brief → ...
   ├── v5d brief → ...
   ├── v5e brief → ...
   └── v5f brief → ...
       ↓
[Main thread synchronization] Fix v5 bug · Write review framework · Precipitation methodology
       ↓
[All 6 notifications arrived]
       ↓
[Main thread] Failure detection + retry / supplementary screenshot
       ↓
[Main thread] 5-dimensional scoring + 3 top-level questions + use case allocation
       ↓
[Main thread] Write final REVIEW.md
       ↓
[Delivery] 6 full version + review + platform distribution recommendation
```

---

## Related documents

- Complete methodology: `references/launch-film-director-notes.md`
- Single view sample: `assets/director-notes-samples/launch-film-30s-sample.md` (v5 baseline)
- Actual project location: `~/.claude/skills/huashu-md-html/demos/` (including a full set of 6 + 1 perspective files)
- Review review：`~/.claude/skills/huashu-md-html/demos/REVIEW.md`

---

*Last updated: 2026-05-11*
*Real case study: huashu-md-html v2.0 launch film 6-perspective parallel experiment*
