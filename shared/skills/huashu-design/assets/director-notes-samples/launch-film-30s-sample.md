# v5 · "Markdown is the new typewriter."

> Director's Notes for the **huashu-md-html v2.0** launch film
> 30 seconds · 1920×1080 · 25 fps · no voiceover
> Director: huashu-design (acting as Apple-tier launch film director)
> Composer: TBD (target: Max Richter / Ólafur Arnalds / Jóhann Jóhannsson minimal-cinematic register)
> Color base: ivory white #FAFAF6 · ink #1A1A1A · terracotta #C2410C
> Type: Newsreader (display + body) · JetBrains Mono (interface) · Noto Serif SC (Chinese)

---

## Directory

- [Part I · Director's Statement](#part-i--directors-statement)
- [Part II · Visual System](#part-ii--visual-system)
- [Part III · Story Arc](#part-iii--story-arc)
- [Part IV · Shot-by-Shot Storyboard](#part-iv--shot-by-shot-storyboard)
- [Part V · Production Manifest](#part-v--production-manifest)

---

# Part I · Director's Statement

## 1.1 This is not a “feature introduction film”

Most SaaS upgrade videos make the same mistake - treating the footage as a PPT. Open → slide through 6 functions → logo + slogan → end. Every second is "showing" and not a second is "telling". What the audience remembers when they leave is not the product, but “another page that looks like it was made by AI.”

**Don’t do this in this film**.

We’re going to tell a story. The story has only one line:

> **"md is the source code, and everything is the product."**

This is not a slogan, it is a world view. Markdown is not "a lightweight document format" - it is the source of writing. All downstream forms (html, docx, pdf, epub) are products derived from this same source. huashu-md-html v2.0 extends this product chain from 4 to 6 - but what is extended is not the "function list", but the influence radius of the source.

If the audience only remembers one thing after watching this film, I hope that thing is: "It turns out that md is the source code." The feature list can contain as many bonuses as you want.

## 1.2 Contextual dialogue of visual language

Every good promotional film is in dialogue with a set of predecessors. I hope the context of this conversation is:

**Apple — "Designed by Apple in California" (2013)**

That video is the ceiling of technology company promotional videos in my mind. Director Mark Romanek did three things right:
1. **Pure white background + serif font**——Tell the audience that this is a "design about design", not a demo
2. **Slow beat** - The subtitles of each sentence are half a beat slower than the audience's reading speed, forcing the audience to stay
3. **Jony Ive’s narration is almost like a whisper** – not selling, sharing

Our film **does not have voiceover**, so the first two principles must be strengthened to 200% by typography and timing.

**Apple Silicon Launch Films (M1 / M2 / M3, 2020-2024)**

This series of short films taught me that **typography can also be danced**. The three characters "M1" can disappear, appear, enlarge, rotate, explode into dust, and then regroup - the audience watched a logo become the protagonist of a dance drama in 30 seconds.

**The hero of this film is not the product UI, but the two characters `md.` + an orange period**. It has to be the star of the dance drama for 30 seconds.

**Anthropic Brand Language (2024-2026)**

Anthropic made “terracotta orange + serif + geometric abstraction” an anti-slop template for AI companies. It tells the industry: You can be a tech company, but you can also look like a little philosophy book published by Penguin Classics.

We inherit this color palette. But do it **more restrained** - Anthropic occasionally uses pure terracotta orange for large color blocks; our terracotta orange is always only used as accent (accounting for < 8% of the total image area), leaving 92% for ivory white and jet black.

**Penguin Classics (from 1947, after Romek Marber 1961 grid)**

Penguin taught me the bravery of **typography**. A book cover can have large serifs + a black horizontal line + no illustrations - and readers will stop.

The slogan reveal at seconds 25-29 uses this language: **ONE SOURCE.** and **SIX FORMS.** are not "decorative text", they are the picture itself.

**Pentagram (Paula Scher / Michael Bierut)**

Pentagram’s signature is **information architecture**—the distance between text and text, the distance between text and borders, and the font size ratio between text levels are not “intuitive” but mathematics.

Our grid system (Part II.3) comes from this tradition.

**Kenya Hara《White》(2008)**

Hara wrote: "White is not a color, it is a sensibility."

The real protagonist of this film is not `md.`, but the piece of ivory white that surrounds it. Leave at least 60% negative space for every shot. Negative space is not "not filled yet", it is the content itself.

**Massimo Vignelli — Modernism in design**

Vignelli’s 8-character motto: “If you can design one thing, you can design everything.” (If you can design one thing, you can design everything.)

Our design system does not allow "temporarily add a font to this mirror" or "temporarily add a rounded corner value to this mirror". All 12 shots share the same set of 5 color values, 3 fonts, and 4 easing curves.

## 1.3 Audience portrait

Three types of audiences, ranked by importance:

**Main audience A · Old users of huashu-md-html who have used v1 (accounting for about 60% of the traffic)**

They opened the film to find out "what was upgraded." Our promise to them: Within 30 seconds, you have to know for sure—
- New capability 5: md → publication-grade PDF
- New capability 6: md → Standard EPUB
- The visual quality of these two capabilities is higher than expected (not at the "I can do it with wkhtmltopdf" level)

→ Shot 08 and Shot 09 are 3 seconds each, and must have a "★ NEW" label + **visible professional-level details** such as "printer crop marks" and "Apple Books frame" must be visible on the destination card - allowing old users to quickly understand that "this is not a round-up function, it is a serious job."

** Audience B · AI Native creators who have heard of huashu-md-html but have no use for it (about 25%) **

What they care about is "What does this skill have to do with me?" Our promise to them: Within 30 seconds, you must realize—
- When you write articles/do research/make white papers, **md should be your source of truth**
- 6 downstream formats, solved with one command

→ Shot 04 (any → md) Let them see PDF/DOCX/PPTX/XLSX/HTML being absorbed by md together - this is the visual embodiment of "source thinking".

**Outside audience C · Completely unfamiliar designers/editors/publishers (about 15%)**

What they saw was a "beautiful technology short film" and they may not necessarily follow it up. Our promise to them: In 30 seconds, you have to make an impression—
- The things made by this company are **publisher's taste**
- It’s different from the AI tools you’ve seen in the past

→ The entire anti-AI slop self-test (Part II.7) is done for them. Any purple gradients, emoji icons, SVG hand-drawn characters - none of them appear.

## 1.4 Rhythm Philosophy

The rhythm of Apple’s promotional video is not uniform. It is a **slow beat-acceleration-peak-slow-down** curve (see Part III Emotional Curve Chart for details).

Specific to this film:

- **0-3s slow beat**: The audience enters. typography breathes character by character.
- **3-6s First Acceleration**: The md character is born, and 6 file cards fly in.
- **6-22s second acceleration segment**: 6 capabilities in one go, each without letting go for 3 seconds.
- **22-26s Peak**: slogan double line reveal, all chrome synchronized grooves.
- **26-30s slow-down**: capability map slowly fades in, leaving the last second for brand seal + very weak piano reverberation.

**Key Decision**: Second 22 is the climax of this film (not second 29). 29 seconds is resolution and 22 seconds is climax. Don't mix these two.

## 1.5 What this film **not** does (anti-AI slop self-check)

Ranked by importance:

| Not doing | Reason |
|------|------|
| No need for purple gradient | The universal formula of "technological sense" in the training corpus, it will be cyber slop in 2026 |
| Don’t use emojis for icons | The disease of “just use emojis if you are not professional” |
| Don’t draw SVG characters/hands/abstract human figures | SVG characters drawn by AI always have misaligned facial features and weird proportions |
| Don’t use Inter/Roboto/Arial for display | Too common, hit system fonts |
| No need for cyberneon / dark blue background #0D1117 | A bad copy of GitHub dark mode aesthetics |
| No stacking effects (blur/glow/particle) | An effect appearing twice is decoration, and three times is slop |
| No need for Lorem ipsum | Use real readable content for each fake paragraph (including hooks like "md is the source. Anything else is product.") |
| No stock photos | No real photos appear in the entire film (it's about typography, not lifestyle) |
| No progress bar + time code + copyright signature bar | These are player chrome, not content chrome - they will collide with external players |
| Don’t let the md character look the same in every scene | It should have 12 states in 12 mirrors, but keep the same core glyph |

## 1.6 Positioning in one sentence

> **"Markdown is the new typewriter."**
>
> A 30-second film about source-of-truth thinking, made for designers who write and writers who design.

---

# Part II · Visual System

## 2.1 Complete color palette

It’s not 3 colors, it’s 10 colors. Each color has a **function definition** (not "just use it if it looks good").

```
Name HEX Function Upper limit of screen ratio
─────────────────────────────────────────────────────────────────────
Ivory paper #FAFAF6 Main background color (ivory white, a touch of temperature) 60-70%
Mist #F2EDE4 Secondary background layer (dark under card shadow) < 15%
Mica #E6E1D6 thin line / separator / card border < 5%
Smoke #6B6B6B secondary text / metadata < 5%
Cinder #3D3530 Secondary dark color (dark brown black, not pure black) < 10%
Ink #1A1A1A Main black / Main text 20-25%
Charred #2A2620 Very dark brown black (only for cover card) < 5%
Terracotta #C2410C Main accent (Anthropic key) 5-8%
Terra Hot #E55D21 Highlight variant (only NEW label lights up for a moment) < 1%
Terra Deep #8B2D08 shade variant (terracotta orange shadow) < 1%
```

**Iron Rule**:
- No color other than the above 10 colors appears in any shot. **There is no "temporarily add some cold gray to this shot"**.
- The three colors of terracotta orange (Terracotta + variants) account for less than 10% of the screen, otherwise it will be visually overloaded.
- Any text can only be in one of 4 colors: Ink / Cinder / Smoke / Terracotta.

## 2.2 Font system

```
Font size level Font weight Purpose Kerning (em)
────────────────────────────────────────────────────────────────────────────────────
Display XXL Newsreader 700 slogan top word (200px) -0.035
Display XL     Newsreader            700       capability number（48px）   -0.020
Display L Newsreader 600 hero md characters (300-480px) -0.040
Display M      Newsreader            600       chapter title (32-44px)     -0.015
Body L Newsreader 400 essay Text (18-22px) 0
Body M (zh) Noto Serif SC 500 Chinese sub-line (20-26px) +0.04
Italic Newsreader italic 400 quotes, subtitles +0.01
Mono S JetBrains Mono 500 tag / capability counter +0.18
Mono XS        JetBrains Mono        700       NEW / version chip (11-14px) +0.22
Caret          (block 3px wide)      —         typing cursor               —
```

**Font loading strategy**:
- Google Fonts preconnect `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- A single `<link>` request merges all weights, reducing round-trip
- `document.fonts.ready` must be completed before recording MP4 before starting timing (Stage has been implemented)

## 2.3 Grid system

**Main canvas**: 1920 × 1080

**Margin (safe zone)**: 80px top, bottom, left and right

**Main content area**: 1760 × 920

**12-column grid**：column-width = 132px，gutter = 16px

**Baseline grid**: 8px base grid. All vertical positions must be multiples of 8 (unless there is a special visual reason).

**Golden Section Anchor Point**:
- Upper 1/3 line: y = 360
- Lower 1/3 line: y = 720
- Center line: y = 540 (hero md default anchor)
- Golden Section: y = 412
- Under the golden section: y = 668

**Key safety area**:
- Top 60px: chrome element area (capability counter, version chip)
- Within 60px at the bottom: watermark / metadata area
- Central 800×600 area: main content restricted area (the hero element of each mirror must fall within this area)

## 2.4 Animation system

**Easing library** (4 items in total, others are disabled):

```
Name Curve formula Purpose
──────────────────────────────────────────────────────────────────
expoOut 1 - 2^(-10t) default ease (90% of entries use this)
overshoot cubic-bezier(0.34, 1.56, 0.64, 1) NEW label popup/button popup
linear t background color fade / paper texture movement
expoIn 2^(10(t-1)) Exit ease (10% of exits use this)
```

**Duration dictionary**:

```
Event Type Duration Remarks
────────────────────────────────────────────────────────
Character stagger 30-50ms Typing effect / slogan characters appear in sequence
Small element entrance 300ms file card / pill / chip
Medium element entrance 500ms destination card / capability number
hero element entry 700-900ms md character morph
slogan Character entry 800ms "ONE SOURCE." Overall
Transition between scenes 300ms overlap cross-dissolve + scale
Exit 200-300ms Exit is always faster than entry
```

**Stagger’s Law**:
- When multiple elements enter at the same time, adjacent elements delay 30-80ms (not 0, nor more than 100ms)
- 6 pills enter: cumulative stagger 250ms (50ms each)
- Slogan characters enter: cumulative stagger 280ms (each ~30ms × 10 characters)

**Transition between Scenes**:
- always **cross-dissolve + soft scale** (does not toggle hard cut)
- The last shot within 300ms of the end: opacity 1 → 0, scale 1 → 0.96
- Next shot within the first 300ms: opacity 0 → 1, scale 1.04 → 1
- The two shots overlap for 300ms (the Sprite end on the timeline is 0.3s larger than the start of the next shot)

## 2.5 Chrome elements (used throughout the film)

These are **little things** that stay in the frame and provide the feeling of "this is a complete film".

**Chrome A · top-left · capability counter（00-22s）**

```
   ┌─────────────┐
   │  ●  CAP·01  │     pulse dot (terracotta) + label
   │  ●●●●○○○○○  │     6-dot progress (filled = current)
   └─────────────┘
```

- Font: JetBrains Mono 12px, letter-spacing 0.24em
- Colors: Ink for label, Terracotta for current dots, Mica for upcoming dots
- Animation: Each time the scene is cut, the next dot changes from hollow → solid (500ms expoOut)

**Chrome B · top-right · version chip（02-30s）**

```
   ╔═════════════════════════╗
   ║ ● HUASHU-MD-HTML · v2.0 ║
   ╚═════════════════════════╝
```

- Font: JetBrains Mono 13px Bold, letter-spacing 0.22em
- Color: Terracotta dot + Ink label
- Entry: overall fade-in 600ms at 02s
- pulse dot: take a very weak breath every 4 seconds (opacity 1 → 0.6 → 1, 1500ms ease-in-out)

**Chrome C · bottom-center · timeline ticker（07-22s）**

```
   any→md  ━━━━●━━━━━━━━━━━━  md→html  ─  html→md  ─  md→docx  ─  md→pdf  ─  md→epub
```

- Font: JetBrains Mono 11px, letter-spacing 0.18em
- Terracotta + bold for current capability, Smoke for other capabilities
- A horizontal line connects 6 names, and the progress point (●) slides from left to right over time
- Entry: Full fade-in 500ms at 07s

**Chrome D · bottom-right · watermark (continuous) **

```
   CREATED BY HUASHU-DESIGN
```

- Font: JetBrains Mono 10px, letter-spacing 0.24em
- Color: rgba(26,26,26,0.32)
- Completely static, does not move

**Chrome E · Very light paper texture (continuous)**

- SVG noise + extremely slow 0.3% scale breathing
- opacity ≤ 0.04
- It’s almost invisible when recording, but it allows the picture to “breathe”

## 2.6 Audio system

### BGM trend (30-second segmented curve)

```
Strength
 │                            ╱╲
1│                          ╱╱  ╲╲
 │                       ╱╱      ╲╲
 │                    ╱╱             ╲
 │                ╱╱                   ╲
 │            ╱╱                          ╲
 │       ╱╱                                  ╲
 │   ╱╱                                          ╲
0└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴
   0  2  4  6  8 10 12 14 16 18 20 22 24 26 28 30s
   │  │     │              │           │  │
   Entrance│ Strings enter │ Rhythm joins │ Peak │ decay
      piano                              swell
```

**Levels (each level lasts for 30 seconds, intensity changes are controlled by envelope)**:

- **L0 · Room tone** (00-30s): extremely weak background noise, giving the screen a "not dead" breathing feeling
- **L1 · Piano single note** (00-08s): A single piano note is continuously struck, once every 1.2 seconds, slowly accumulating
- **L2 · Piano arpeggio** (03-22s): Piano arpeggio enters the scene, giving the feeling of "picking up the rhythm"
- **L3 · Cello drone** (08-22s): Low-frequency strings pave the way and give "weight"
- **L4 · Pulse** (15-22s): pianissimo sub-kick, 4/4 rhythm (not a dance beat, but a cinematic pulse)
- **L5 · String swell** (22-26s): The entire string swell up to climax
- **L6 · Decay + reverb tail** (26-30s): All levels of decay, leaving piano + reverb

**Style Goals**: *On the Nature of Daylight* by Max Richter + *Re:member* by Ólafur Arnalds + *Orphée* by Jóhann Jóhannsson

### SFX Dictionary

```
Cue Time Type Volume
────────────────────────────────────────────────────────────────────
keyboard click 00.5-02.0 keypress × 12 -18dB (30ms each time)
cursor blink                 02.0-02.8   subtle tick        -28dB
md morph swell               02.8-03.2   soft whoosh + bloom -16dB
file card whoosh × 6 05.5-08.0 short whoosh -20dB (200ms each time)
absorb / ink drop             08.0-08.4   "absorb" splash    -16dB
paper rustle                 08.5-09.0   paper turn         -22dB
chime: capability 02 →        09.0       single chime tone  -18dB
chime: capability 03 →        12.0       single chime tone  -18dB
chime: capability 04 →        15.0       single chime tone  -18dB
chime: NEW (05)               18.0       double chime + glow -14dB
chime: NEW (06)               21.0       double chime + glow -14dB
build sweep                  22.0-22.6   ascending sweep    -10dB
impact (slogan ONE)          22.6        deep impact         -8dB
impact (slogan SIX)          23.4        deep impact         -8dB
pen flourish                 24.0-24.4   pen on paper        -22dB
final stamp / sign-off       29.0-29.5   ink stamp           -14dB
```

**SFX band isolation** (to prevent fighting with each other):
- BGM accounts for low frequency (40Hz-2kHz)
- SFX whooshes / chimes occupy mid-high frequencies (2kHz-8kHz)
- SFX impacts account for low frequency sub (40Hz-120Hz) — overlaps with BGM cello but BGM simultaneously ducks -3dB

## 2.7 Anti-AI slop self-check list (per-shot)

Each mirror must go through this checklist before execution:

```
□ No purple (any saturation)
□ No combination of rounded card + left border accent (except the honest mica border of the destination card)
□ No emoji as icon
□ No SVG drawn characters/abstract humanoids
□ There are no colors that are not in the Part II.1 color palette
□ No Inter / Roboto / Arial as display
□ The character spacing, line height, and font size all come from the Part II.2 font system (there are no values added "by feel")
□ vertical position is a multiple of 8 (except for deliberate visual reasons)
□ Terracotta orange accounts for < 10% of the frame in this mirror
□ This shot has at least one detail that is “worthy of taking a screenshot when paused” (120% signature)
□ The transition from the previous shot to this shot is cross-dissolve + scale, not hard cut
□ At the end of this shot, a visual "make way" for the next shot (not "filling the entire screen to the end")
```

---

# Part III · Story Arc

## 3.1 Three-act structure

**ACT I · SET-UP (00.0 — 06.0s)**

The audience enters the screen. The question is raised: What is the source of truth?

- SHOT 01 (0.0-1.5s) · BLANK PAGE
- SHOT 02 (1.5-3.0s) · THE CURSOR
- SHOT 03 (3.0-5.0s) · THE TRANSFORMATION
- SHOT 04 (5.0-6.0s) · Enter gathering (overlaps with ACT II)

**ACT II · ESCALATION (06.0 — 22.0s)**

Answer expansion: md is the source. It radiates 6 product chains outward.

- SHOT 04 (5.0-8.5s) · GATHERING（any → md）
- SHOT 05 (8.5-11.5s) · FIRST FLOWER（md → html）
- SHOT 06 (11.5-14.5s) · REVERSE FLOW（html → md）
- SHOT 07 (14.5-17.5s) · PUBLISHER GRADE（md → docx）
- SHOT 08 (17.5-20.5s) · ★ NEW · PRINT（md → pdf）
- SHOT 09 (20.5-22.5s) · ★ NEW · EBOOK (md → epub, overlaps with ACT III by 0.5s)

**ACT III · PAYOFF (22.5 — 30.0s)**

Sublimation of the theme. slogan appears. Brand seal.

- SHOT 10 (22.5-24.0s) · THE CONVERGENCE
- SHOT 11 (24.0-26.5s) · ONE SOURCE.
- SHOT 12 (26.5-29.0s) · SIX FORMS.
- SHOT 13 (29.0-30.0s) · SIGN-OFF

## 3.2 Emotional Curve

```
Emotional intensity
 │                                       ╔═══╗
 │                                    ╔══╝   ╚══╗
 │                              ╔═════╝         ╚══╗
 │                          ╔═══╝                   ╚══╗
 │                       ╔══╝                          ╚══╗
 │                   ╔═══╝                                 ╚════════╗
 │             ╔═════╝                                              ╚══╗
 │       ╔═════╝                                                       ╚══
 │  ╔════╝
 │══╝
 0──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──>
    0     2     4     6     8    10    12    14    16    18    20    22    24    26    28    30s
    │     │     │            │           │            │            │     │     │
    blank cursor morph      gather       cap 02-04   cap 05/06 ★  slogan slogan sign-off
                                                                  ONE   SIX
                                                                  ──────►
                                                                  PEAK 24.5s
```

**Key emotional beats**:
- **02.0s**: The first keyboard click → the audience enters
- **03.0s**: md character is born → first time "awe"
- **08.0s**: 6 files cards are gathered into md → "Ah, it turns out that md is the source" click for the first time
- **18.0s**: The first NEW tag appears → Old users "Oh"
- **22.5s**: All chrome gathered, ready to enter Act III → tension build-up peak
- **24.5s**: SIX FORMS. Landing → emotional climax
- **30.0s**: md seal stays quietly → resolution

---

# Part IV · Shot-by-Shot Storyboard

The format of each shot:

```
SHOT NN · NAME
[TIMECODE]  |  FUNCTION
[VISUAL] Screen composition
[TYPE] Precise typesetting spec
[ANIM] per element in/out/easing/delay
[AUDIO]      music beat + SFX cue
[CHROME] Four-corner element status
[ANTI-SLOP] Passed self-test items
[WHY] Undertake + Promote
```

---

## SHOT 01 · "BLANK PAGE"

**[TIMECODE]** 00.00 — 01.50s (1.5s) `|` **FUNCTION** Opening. Invite the audience in. Give "empty" some time.

**[VISUAL]**

The whole 1920×1080 is Ivory paper #FAFAF6. **Nothing in the picture**.

The only thing that exists: a very light layer of paper texture (SVG noise + 0.3% scale very slow breathing), which is almost invisible, but gives the picture a subconscious feeling of "this is a real piece of paper".

Composition: completely empty. This is "white" in the sense of Kenya Hara - not "yet to be painted", but "the content itself".

**[TYPE]** No text.

**[ANIM]**

- 0.00s · paper texture opacity from 0 → 0.04 (500ms linear)
- 0.50-1.50s · The entire screen is held, no action. Allow the viewer's eyes to adjust to the white.
- 1.40-1.50s · A cursor position begins to appear in the center left of the screen (x=860, y=540) (transparent, will not be visible until the next shot)

**[AUDIO]**

- BGM: room tone in (300ms fade-in to -38dB)
- SFX: None

**[CHROME]** Hide all. Chrome A/B/C/D/E haven’t appeared yet.

**[ANTI-SLOP]**

- ✅ No logo, no "Loading...", no brand prefix
- ✅ No gradients, no effects
- ✅ The "pause-and-look" signature of this shot: the picture has a paper texture but does not steal the show.

**[WHY]**

Apple's "Designed by Apple in California" also opens like this - giving time for blankness. It tells the audience "This film requires you to slow down." If there are lots of logos and chrome at the beginning, the audience’s attention will be distracted and they won’t be able to take it back for the next 30 seconds.

This 1.5 seconds is one of the most important 1.5 seconds in this film.

---

## SHOT 02 · "THE CURSOR"

**[TIMECODE]** 01.50 — 03.00s (1.5s) `|` **FUNCTION** typewriter is born. The first content.

**[VISUAL]**

To the left of the center of the screen (x=860, y=540), a vertical black block (3px × 56px, Ink #1A1A1A) begins to flash. This is cursor.

After flashing twice (0.7s one cycle × 2), `# markdown.md` begins to appear word by word behind the cursor, font JetBrains Mono 56px, color Ink #1A1A1A, letter-spacing -0.01em.

Every time a character is typed, the keyboard click sounds once. After typing the last character (13 characters in total), the cursor continues to flash 1 time after `.md`.

**[TYPE]**

- Text: `# markdown.md`
- Font: JetBrains Mono 500 weight
- Size: 56px
- Color: Ink #1A1A1A
- Letter-spacing: -0.01em
- Position: horizontal center, y = 540 (baseline, text vertical center is slightly below this)

**[ANIM]**

- 01.50s · cursor block opacity 0 → 1 (200ms)
- 01.50-01.85s · cursor blink first time (off 200ms / on 200ms)
- 01.85-02.20s · cursor blink second time
- 02.20-02.85s · 13 characters staggered appear, each interval is 50ms (total 650ms to complete), each character fades + 1px slide-down (180ms expoOut)
- 02.85-03.00s · cursor blinks again at the end (last time, marking input completion)

**[AUDIO]**

- BGM: piano first note at 01.50s (-22dB)
- SFX: keyboard click × 13 (once per word, -18dB, 30ms each)
- SFX: 200ms of silence after the last cursor blink (to make way for the next morph)

**[CHROME]** remains hidden.

**[ANTI-SLOP]**

- ✅ cursor is not sci-fi blinking (not 0.1s extremely fast blinking), it is a real simulation of macOS terminal cursor rhythm
- ✅ typing is not "characters appear all at once", it is really rhythmic typing
- ✅ The font is JetBrains Mono, not Courier or Menlo, which is the default mono in the system.
- ✅ pause-and-look signature: 3px width of the cursor (not 2px or 4px) - a very precise detail, knowledgeable people will notice that this is "designed by a real terminal"

**[WHY]**

This mirror is the core of setup: **markdown is not a noun, it is an action** - it is the thing itself of "hitting the keyboard to turn characters into structures".

cursor is the smallest unit of writing. Starting from a cursor is the birth of "source code".

The morph in the next shot is based on the premise that the audience has accepted "we are writing markdown".

---

## SHOT 03 · "THE TRANSFORMATION"

**[TIMECODE]** 03.00 — 05.00s (2.0s) `|` **FUNCTION** Reveal hero. `# markdown.md` morphs into hero `md.`

**[VISUAL]**

Second 03.00: `# markdown.md` (56px mono) begins to shrink, enlarge, and deform toward the center.

**morph process** (detailed deconstruction):

- 03.00-03.30s (300ms): The `#` and `arkdown` parts of `# markdown.md` fade out (opacity 1 → 0), while the `m` and `md` parts of `d.md` remain.
- 03.30-04.10s (800ms): The remaining `md` morphs from mono font to Newsreader serif, enlarges from 56px to 480px, changes from Ink to Ink (does not change color), and remains in the same position (still in the center of the screen).
- ​​04.10-04.80s (700ms): In the lower right corner of the `md` character, a Terracotta period `.` emerges (fade-in + scale 0.6 → 1 + overshoot easing).
- 04.80-05.00s (200ms): period formally settle, hero complete. A 320px wide terracotta orange thin line (terracotta accent rule, 2px thick) appears 30px below, spreading out from the center to both ends.

**End Frame**: `md.` (Newsreader 600 weight, 480px, Ink with Terracotta dot) + a thin line of terracotta orange below. The rest of the screen is completely empty.

**[TYPE]**

- Text: `md.`（`md` Ink, `.` Terracotta）
- Font: Newsreader 600 weight
- Size: 480px (display L)
- Letter-spacing: -0.04em
- Color: `m`+`d` Ink #1A1A1A, `.` Terracotta #C2410C
- Center horizontally and vertically on hero midline (y = 540)
- accent rule bottom 30px, width 320px (grows from 0)

**[ANIM]**

- 03.00-03.30s · `#` `arkdown` `md` (middle) fade out (opacity 1 → 0, expoOut)
- 03.30-04.10s · `md` morph: fontFamily switch, fontSize from 56 → 480, weight from 500 → 600 (800ms expoOut, note that morph is not an abrupt switch, but a ghost afterimage superposition + scale up + opacity switch)
- 04.10-04.80s · `.` entry (700ms overshoot, scale 0.6 → 1)
- 04.80-05.00s · accent rule width 0 → 320px (300ms expoOut)

**[AUDIO]**

- BGM: piano second tone at 03.00s (-20dB), third tone at 04.20s (-18dB) — piano accumulation
- SFX: 03.00-03.20s soft whoosh (morph starts, -16dB)
- SFX: 04.10s subtle bloom (the moment the period appears, -20dB)
- SFX: 04.80s short paper rustle (accent rule expansion, -22dB)

**[CHROME]**

- 04.50s · Chrome B (version chip top-right) begins to emerge (fade-in 600ms)
  - Form: `● HUASHU-MD-HTML · v2.0`
  - terracotta dot, mono text, Ink color
  - Entering position: top: 78px, right: 80px
- Still hidden: Chrome A, C, E (visible only ≥ 06s)

**[ANTI-SLOP]**

- ✅ morph is not a cheap transition of "fade out + fade in", it is a real character deformation (including ghost overlay)
- ✅ The period is the hero’s “signature detail” (the one that 120% achieves): Terracotta The period is as small as a fingernail, but the visual anchor of this film, **this period remains as the hero logo in all subsequent shots**
- ✅ The accent rule is not a decoration, it is the base line of the hero - it will appear again in the slogan of Shot 11, establishing an echo between the beginning and the end.
- ✅ pause-and-look signature: 480px The kerning of Newsreader 'md' is -0.04em, which makes the m and d almost fit but not touch. This is the signature texture of the Newsreader font in large sizes.

**[WHY]**

This is a hero shot. The "protagonist" (`md.`) of the entire film in the next 25 seconds is born here.

morph's design philosophy: **From mono to serif, it is a metaphor from "I am typing" to "I am writing"**. mono is typewriter and serif is publishing. md is both at the same time - it's typing on the keyboard, but it's the source code for publishing.

When the next shot enters ACT II, ​​the hero has already stood still - it will be pushed to the top of the screen to make room for "materialized products".

---

## SHOT 04 · "GATHERING" (any → md)

**[TIMECODE]** 05.00 — 08.50s (3.5s) `|` **FUNCTION** CAPABILITY 01 Revealed. All things → md. Establish a world view of "md is the source".

**[VISUAL]**

05.00s: hero `md.` Slides up from the center of the screen (y=540) to y=280 (i.e. 1/4 height position), and shrinks to 220px at the same time.

Then 6 file cards appeared in the lower half of the screen (y=520 ~ y=900 area), flying in from outside the screen (y=1140 below) in order, and closing in on md hero along an invisible parabolic trajectory.

The design of 6 cards (**each is a mini demo of the real file type, not fake bar lines**):

```
.pdf │ Double column layout + header "doc.pdf" + page number "— 12 —" + a few lines of small text for real typesetting
.docx │ heading "On Markdown" + subscript italic + 6 lines of paragraph ascii
.pptx │ Title "MD AS SOURCE" + a simplified bar chart placeholder
.xlsx │ 6×4 spreadsheet grid + some numbers
.epub │ Apple Books-style page + chapter title "Chapter 01"
.html │ A browser chrome (three dots + URL bar "example.com") + title + paragraph
```

Each card size is 130×180px, white background + Mica border + 24° upper right corner fold.

**Flight trajectory**: Starting from y=1140 below, converge along the parabola to the "." position of md hero (about x=960+50, y=280+90). In the middle section (when in the middle of the screen), 6 cards are arranged in a fan shape, with a gap of 220px between every two adjacent cards. Finally, all 6 pictures are "absorbed" by md (scale 1 → 0.5 + opacity 1 → 0, and the position is reduced to a point).

Absorption timing: starting from 05.60s, one launch every 0.18s. Each flight is absorbed after 1.1s. The last absorb takes about 07.60s to complete.

After the absorption is completed (07.60-08.20s), tagline appears at 60px below: "Everything → md" (Chinese serif, 36px, Ink, italic)

08.20-08.50s · Overall hold, ready to enter Shot 05.

**[TYPE]**

- hero `md.`: reduced to 220px (same font size as SHOT 03)
- 6 cards Internal layout: JetBrains Mono 12-14px for labels, Newsreader 12-16px for content
- tagline「Everything → md」：Noto Serif SC 36px italic + middle → is Newsreader italic + Terracotta
- Top Chrome A Text: JetBrains Mono 12px

**[ANIM]**

- 05.00-05.30s · hero md zoom + move up (300ms expoOut)
- 05.30s · Chrome A capability counter entry (CAPABILITY · 01 shown, first dot solid)
- 05.60-07.60s · 6 cards are launched in sequence (each launch delay = 5.60 + i × 0.18s, flying 1.1s, absorb at launch+1.1)
- 07.60-08.20s · tagline "Everything → md" entry (fade-in 400ms + slight y slide 12px → 0)
- 08.20-08.50s · hold

**[AUDIO]**

- BGM: piano arpeggio L2 enter at 05.00s (-26dB → -20dB fade in)
- SFX: file card whoosh × 6 (once for each launch, 200ms each time, -20dB)
- SFX: absorb / ink drop (when the last card is absorbed, -16dB)
- SFX: paper rustle (tagline entry, -22dB)

**[CHROME]**

- A (top-left capability counter): ON, displays `CAPABILITY · 01`, the first dot is solid
- B（version chip）: ON, continuous display
- C (timeline ticker): OFF (will enter SHOT 05)
- D（watermark）: ON, always ON
- E（paper texture）: ON

**[ANTI-SLOP]**

- ✅ 6 cards are not emojis or icons, they are **mini demos with internal content** - each card is readable
- ✅ The flight trajectory is a parabola (sense of gravity), not a straight line (sense of computer)
- ✅ When folding, it is "absorbed" (scale + position are folded at the same time), not "superimposed"
- ✅ The md character is not given any glow or particle effects (no need to explain "md is absorbing", the audience can understand it by themselves)
- ✅ pause-and-look signature: When you pause and look at each card in the middle of the flight, you can read "This is a PDF / This is a DOCX" - this is the detail of 120%.
- ✅ tagline uses "→" instead of "to" or "to", which is markdown's own character

**[WHY]**

This is the door mirror of ACT II. If the audience doesn't realize "Oh, md is the source" after watching these 3.5 seconds, the subsequent shots will be in vain.

3 micro-narrative beats in 3.5 seconds:
1. hero gives way (md moves up) - implying "I give way to my products"
2. 6 products appear - revealing "what I can receive"
3. All return to md - "But they are all md in the end"

The next shot enters the forward flow of md → html - the audience has accepted "md is the source" and is now ready to see "how md changes".

---

## SHOT 05 · "FIRST FLOWER · HTML" (md → html)

**[TIMECODE]** 08.50 — 11.50s (3.0s) `|` **FUNCTION** CAPABILITY 02. The first forward output. Create a ScenePipeline mode (the subsequent 5 shots share this structure).

**[VISUAL]**

08.50s: hero `md.` slides from the upper center to the left side of the screen (x=480, y=540), keeping the size at 220px.

At the same time, a destination card appears on the right side of the screen (x=1400, y=540): simulating "Tufte CSS style essay html".

destination card design (**real readable content, not bar lines**):

```
┌─────────────────────────────────┐
│                                  │
│  On Markdown                     │  ← Newsreader 600, 32px, Ink
│  AN ESSAY · 2026                 │  ← Mono 11px, 0.18em, Smoke
│  ▬▬▬                             │  ← Terracotta rule 60×3px
│                                  │
│  md is the source of truth.      │  ← Newsreader 400, 18px, line-height 1.7
│  Anything else is product.       │
│  We write once. Publish six      │
│  ways. The river forks; the      │
│  spring stays the same.          │
│                                  │
│  ─ huashu, 2026.05.11            │  ← italic 14px, Smoke
│                                  │
│  article.html · TUFTE THEME      │  ← Mono 10px, 0.18em, Smoke (bottom)
└─────────────────────────────────┘
   Width 480px × Height 560px
   White background + Mica border + 24° corner fold
```

The md character is connected to the destination card with a thin terracotta line. Starting from the dot of md, it grows 380px to the right, and the arrow head touches the left border of the card. Display label "md → html" 30px above the line (JetBrains Mono 14px Terracotta, letter-spacing 0.14em).

09.80s: Chrome C (timeline ticker) enters the market for the first time, fixed at y=1000.

**[TYPE]**

- see visual description inline
- label "md → html" font size 14px, Mono Bold, Terracotta, letter-spacing 0.14em
- The chapter title at the top of the destination card is Newsreader 600, 32px, Ink
- destination card small print at the bottom mono 10px Smoke 0.18em

**[ANIM]**

- 08.50-08.80s · hero md slides from center-top to left-mid (300ms expoOut)
- 08.80-09.10s · arrow line grows to the right from the starting point of md.dot (300ms expoOut, 0 → 380px)
- 09.10s · arrow head emerges (200ms overshoot)
- 09.20-09.40s · label "md → html" entry (fade-in + 8px y slide-down, 300ms expoOut)
- 09.40-10.10s · destination card overall admission (700ms expoOut, scale 0.85 → 1 + opacity 0 → 1)
- 10.10-10.80s · destination card internal staggered entry: title (400ms delay 0) → subtitle metadata (delay 200ms) → terracotta rule (delay 400ms) → 6 lines of text (each delay 60ms cascade) → signature (delay 1000ms) → bottom mono (delay 1100ms)
- 10.80-11.50s · hold + micro breathing (overall scale 1 → 1.005 → 1, 600ms ease-in-out infinite, but this mirror only plays half a cycle)

**[AUDIO]**

- BGM: cello drone L3 entrance at 09.00s (-30dB → -24dB)
- SFX: chime: capability 02 at 09.00s (-18dB)
- SFX: paper rustle (when card enters, -22dB)
- SFX: micro ticks (staggered entry, -26dB each)

**[CHROME]**

- A: Advance to `CAPABILITY · 02`, second dot solid
- B: ON
- **C: First entry** at 09.80s, `any→md ━━━━●━━━━━ md→html ─ html→md ─ md→docx ─ md→pdf ─ md→epub`, progress point ● above the second cell
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ The content of destination card's "On Markdown" essay is a really readable English philosophy paragraph, not Lorem ipsum
- ​​✅ The small seal of "article.html · TUFTE THEME" is "a detailed signature that can be read during pause"
- ✅ No glow or particle is used to "emphasize" the md → html conversion - rely on typography and composition to make it clear.
- ✅ arrow line is not dashed or dotted (to avoid the "web tutorial" feeling), it is 1.5px solid line Terracotta
- ✅ pause-and-look signature: The "AN ESSAY · 2026" subscript at the top of the destination card uses Newsreader's small caps OpenType feature, 0.18em kerning - 120% of the details of this shot

**[WHY]**

This is the first creation of ScenePipeline mode. The next five capability shots will proceed according to this structure:
1. md is on the left, destination is on the right
2. arrow + label in the middle
3. Staggered entry inside destination card (each card has 6-8 text levels)
4. The card content is real and readable, not fake bar lines

The audience will understand this pattern after seeing it for the second time (SHOT 06), and will feel like "Ah, here we go again, but this time it's NEW" after seeing it for the sixth time (SHOT 09) - this is exactly the rhythm design of ACT II.

---

## SHOT 06 · "REVERSE FLOW · MD" (html → md)

**[TIMECODE]** 11.50 — 14.50s (3.0s) `|` **FUNCTION** CAPABILITY 03. Reverse archive: html → md. Establish the concept of "two-way flow".

**[VISUAL]**

cross-dissolve enter. The destination card in the previous shot shrinks and exits to the lower right corner within 11.50-11.80s, and the new destination card (this time showing markdown source code) enters from the right.

New destination card design: **Dark markdown source view** (visual contrast to SHOT 05’s shallow html).

```
┌─────────────────────────────────┐
│ │ ← Background Charred #2A2620
│  # On Markdown                   │  ← Terracotta, mono 14px
│                                  │
│  An essay · 2026                 │  ← Smoke, mono 14px
│                                  │
│  > md is the source.             │  ← italic Smoke, mono 14px
│ > Anything else is **product**. │ `**product**` highlight mica + bold
│                                  │
│  - 1 source                      │  ← mono 14px Smoke
│  - 6 forms                       │
│  - ∞ outputs                     │
│                                  │
│  essay.md · CLEAN MARKDOWN       │  ← bottom Mono 10px Smoke
└─────────────────────────────────┘
   480×560px, Charred bottom, top 24° angle fold is Cinder
```

arrow direction reverse: from right destination card to left md character direction (short Terracotta line + arrow head pointing left). The label is changed to "html → md".

**Key differences** (form visual rhythm with SHOT 05):
- ​​destination is on the right, md is on the left (same as SHOT 05)
- but the arrow direction is reverse (visual: we are archiving/pulling back)
- ​​card means deep bottom (visual contrast, emphasizing that this is source)

**[TYPE]**

- All cards are JetBrains Mono 14px
- ​​markdown syntax element color matching: `#` title Terracotta, `>` quote italic Smoke, `**bold**` Mica + bold, list dash Smoke
- bottom mono 10px Smoke

**[ANIM]**

- ​​11.50-11.80s · Previous shot card exits (shrink → lower right corner, fade out) + md character remains
- ​​11.80-12.10s · arrow line grows in reverse direction (this time from right to left, 300ms expoOut)
- 12.10s · arrow head (pointing left) emerges
- 12.20-12.40s · label "html → md" entry
- 12.40-13.10s · New destination card entry (same as SHOT 05 entry logic)
- 13.10-13.80s · markdown internal 6 lines staggered entry (100ms delay per line)
  - Special micro-detail: simulate typewriter when each line enters - line's character-by-character cascade reveal (making the audience feel "this is the process of markdown being "written"")
- 13.80-14.50s · hold

**[AUDIO]**

- BGM: continuous L1+L2+L3 layers
- SFX: chime: capability 03 at 12.00s (-18dB)
- SFX: paper rustle (12.40s)
- ​​SFX: extremely weak keyboard click ticker on each line entry (-26dB each, 100ms apart)

**[CHROME]**

- A: Advance to `CAPABILITY · 03`, third dot solid
- B: ON
- ​​C: Progress point ● Slide to "html→md" position
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ This is the only "deep" shot in the entire film - deliberately creating visual contrast to let the audience know that "this is source code", not "another destination"
- ✅ The color used for syntax highlighting inside markdown is not the cyber color scheme (not the VS Code Dark+ kind), but the publisher color scheme (Terracotta + Smoke + Mica)
- ​​✅ "essay.md · CLEAN MARKDOWN" small print at the bottom → pause-and-look signature
- ✅ Reverse arrow is not a "U-turn curve", it is a straight line + reverse arrow - maintain structural consistency

**[WHY]**

The real function of this shot is not to "show capability 03", but to tell the audience that this channel is two-way.

If the six capabilities of the entire film radiate outward from md, the audience will think that "md just goes out." The third capability reverses the flow and establishes a world view of "md is the center of everything".

This is why I chose the capability sequence 02 (md→html) → 03 (html→md) → 04 (md→docx) - deliberately placing the reverse capability in the 3rd position to maximize the cognitive surprise of "two-way flow".

---

## SHOT 07 · "PUBLISHER GRADE · DOCX" (md → docx)

**[TIMECODE]** 14.50 — 17.50s (3.0s) `|` **FUNCTION** CAPABILITY 04. Press taste docx. Establish the argument that "md is not just for programmers".

**[VISUAL]**

Back to the shallow bottom, back to "md is on the left, destination is on the right".

destination card design: **publisher grade docx chapter home page** (high density of information, but complete restraint).

```
┌─────────────────────────────────┐
│                       ON MARKDOWN│  ← page header, right-aligned, Smoke italic mono 9px
│  CHAPTER · 01                    │  ← Terracotta mono 11px bold 0.22em
│                                  │
│  On Markdown                     │  ← Newsreader 700, 36px, Ink, lh 1.1
│  A short essay on source-of-truth│  ← Newsreader italic 14px, Smoke
│  thinking                        │
│                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━     │  ← Terracotta full-width rule 3px
│                                  │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬       │  ← 10 lines of mica bar paragraphs
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬           │     (varied widths 76-95%)
│  ...                             │
│                                  │
│                — 1 —             │  ← page number, centered, mono 10px Smoke
└─────────────────────────────────┘
   480×580px, white card, Mica border, 24° corner fold
```

**Special details**:
- The "page header" in the upper right corner of the top (book title italic gray mono) is the detailed signature of the real publisher's docx
- ​​The prefix "CHAPTER · 01" allows the audience to realize at a glance that "this is a page of a book, not an article"
- ​​terracotta full-width rule (not a thin line, but a 3px thick rule) is the signature of the publisher’s chapter homepage
- The dashes before and after the page number "- 1 -" at the bottom are Newsreader's em-dash, not hyphen

**[TYPE]**

- page header: Newsreader italic 9px, Smoke, letter-spacing 0.14em
- CHAPTER · 01: JetBrains Mono Bold 11px, Terracotta, letter-spacing 0.22em
- main title: Newsreader 700, 36px, Ink, line-height 1.05
- subtitle: Newsreader italic 14px, Smoke
- terracotta rule: 3px thick, full card width
- bar paragraphs: Mica color #E6E1D6, height 6px
- page number: JetBrains Mono 10px, Smoke, letter-spacing 0.18em

**[ANIM]**

- 14.50-14.80s · Previous shot card exit + md keep
- ​​14.80-15.10s · arrow line forward growth
- ​​15.10s · arrow head, label "md → docx" enters
- ​​15.30-16.10s · destination card overall admission
- 16.10-17.00s · Internal stagger: page header (delay 0) → CHAPTER header (delay 100ms) → title (delay 300ms) → subtitle (delay 500ms) → rule (delay 700ms) → 10-line paragraph cascade (delay 850ms + 60ms cascade) → page number (delay 1600ms)
- 17.00-17.50s · hold

**[AUDIO]**

- ​​BGM: continuous; at 15.00s BGM overall swell +2dB (implying that we are advancing towards the climax)
- SFX: chime: capability 04 at 15.00s (-18dB)
- SFX: paper rustle (15.30s)

**[CHROME]**

- ​​A: `CAPABILITY · 04`, the fourth dot is solid
- B/C/D/E: ON

**[ANTI-SLOP]**

- ​​✅ Don’t write the explanation of “This is a mockup of the inside page of a book” (let the layout speak for itself)
- ✅ Use Mica (#E6E1D6), a very light gray for bar paragraphs, not black - an honest signal that "this is a preview of the layout style, not the real content"
- ✅ pause-and-look signature: top right-aligned page header italic mono - 99% of viewers will not read it, but 1% of designers will know "this company has done their homework" when they see it.
- ✅ This shot has the most saturated color among the 6 capabilities (Terracotta occupies page rule + chapter label + top right chrome counter) - just in the middle of the story arc, in line with the "build-up to climax" curve

**[WHY]**

CAPABILITY 04 is a key link between the past and the next:
- It confirms that "md is not just for the web" - it can do publisher-level docx
- It establishes the visual context of "print" in preparation for SHOT 08 (pdf) and SHOT 09 (epub)

After watching this shot, the audience is ready for the chain "md → printed matter". The NEW tags of the next two shots will be taken over.

---

## SHOT 08 · "★ NEW · PRINT" (md → pdf)

**[TIMECODE]** 17.50 — 20.50s (3.0s) `|` **FUNCTION** CAPABILITY 05. **NEW**. md → publication-grade PDF. The first "upgrade" sign lights up.

**[VISUAL]**

cross-dissolve enter. The visual intensity of this shot is **significantly higher** than SHOT 05-07 - because this is "new stuff" and needs to be remembered.

Visual differences:
1. **NEW tag**: top-left lights up a Terracotta rectangular box next to the capability counter, containing the "★ NEW" character (JetBrains Mono Bold 13px, Terracotta, letter-spacing 0.22em, 4px Terracotta border, 6px×12px padding)
2. **destination is not a single card, but two PDF fans coming out**: A4 in the back (slight +5° rotation), large 32K (176×240mm, domestic paper book specifications) in the front (slight -3° rotation), forming a vision of "both page-sizes supported"
3. **Each PDF has "crop marks" on it** - a small L-shaped line in each corner, 2px thick, Smoke color - this is the detail of the real printer's PDF
4. All arrow + label colors are Terracotta (not Ink), and the overall color scheme is warmer

**Two PDF contents**:

PDF A (A4, back):

```
┌──────────────────────────┐
│ ┌                      ┐ │  ← crop marks
│  A4 · 210×297mm           │  ← Mono Bold 10px Terracotta
│  ─── (Terracotta rule)    │
│  On Markdown              │  ← Newsreader 22px
│  ──────────────────       │
│  ▬▬▬▬▬▬▬▬▬▬▬             │  ← 7 lines mica bars
│  ▬▬▬▬▬▬▬▬▬▬▬▬            │
│  ...                      │
│                           │
│ └                      ┘ │  ← crop marks
└──────────────────────────┘
   360×460px, white card, +5° rotation
```

PDF B (Large 32K, front):

```
┌────────────────────┐
│ ┌                ┐ │  ← crop marks
│ Large 32K · 176×240mm│ ← Mono Bold 10px Terracotta
│  ───                │
│  On Markdown        │  ← Newsreader 19px
│  ──────────         │
│  ▬▬▬▬▬▬▬▬▬▬        │  ← 6 lines mica bars
│  ...                │
│ └                ┘ │
└────────────────────┘
   290×410px, white card, -3° rotation
```

**[TYPE]**

- ​​NEW Tags: Mono Bold 13px Terracotta, 0.22em letter-spacing, 1.5px Terracotta border
- arrow label「md → pdf」：Mono Bold 14px Terracotta, 0.14em
- PDF spec labels (A4 · 210×297mm, etc.): Mono Bold 10px Terracotta, 0.2em
- chapter titles inside PDFs：Newsreader 600 weight, 19-22px, Ink

**[ANIM]**

- 17.50-17.80s · Previous shot card exit + md keep
- 17.70s · **NEW label lights up** (special processing: scale 0.8 → 1.1 → 1.0 over 400ms with overshoot easing; at the same time, a very weak terracotta glow pulses briefly and then disappears)
- 17.80-18.10s · arrow + label entry (this time using Terracotta accent to emphasize "this is NEW")
- ​​18.20-18.60s · PDF B (the previous one) entry (400ms expoOut, scale 0.85 → 1 + clockwise -8° → -3°)
- ​​18.50-18.90s · PDF A (the one at the back) follows the entry (400ms expoOut, scale 0.85 → 1 + clockwise 0° → +5°, stagger delay 300ms)
- 18.90-19.70s · Two PDFs internal cascade staggered admission
- ​​19.70s · 4 crop marks (PDF B) appear one after another (80ms cascade, sign the details of the "printing factory process")
- 19.70-20.50s · hold

**[AUDIO]**

- ​​BGM: percussion pulse L4 added at 18.00s (-32dB) (very weak sub-kick 4/4 rhythm build)
- **SFX: chime: NEW (05) at 17.70s (double chime + soft glow + reverb tail, -14dB)** ← This is one of the most important SFX cues in the entire film
- SFX: paper rustle × 2 (-22dB each at PDF entry)
- ​​SFX: subtle "ink stamp" at 19.70s (when crop marks appear, -22dB)

**[CHROME]**

- A: `CAPABILITY · 05`, the fifth dot is solid
- ​​Add NEW tag next to A
- B: ON, at this time the orange dot next to the version chip synchronizes the pulse (emphasis on "new in v2.0")
- C: Progress point ● Slide to the "md→pdf" position, increase the font size of the text in this position by 0.5px for emphasis
- D: ON
- E: ON

**[ANTI-SLOP]**

- ​​✅ NEW label is not emoji, not sticker - it is typographic mark (mono + 0.22em + ★ + border)
- ✅ The two PDFs are not cheap stacking of "stacked together", but fan + rotation (implying the physical action of "opening and looking")
- ✅ Crop marks are the visual expression of real printer terminology. When you pause, you can see "Ah, this is print-ready"
- ✅ No use of glow or particles to emphasize "NEW" - rely on typography and SFX to speak for themselves
- ✅ pause-and-look signature: PDF B The "Large 32K · 176×240mm" at the top is a mix of Chinese and English, which is Huashu Eco's respect for domestic paper book specifications.

**[WHY]**

This is one of the ACT II climax mirrors. Two things must happen simultaneously:
1. The audience must immediately realize that "this is a new feature"
2. You must use visual details to explain "This is not a random wkhtmltopdf package, but a real publication grade"

NEW Tags + crop marks + two PDF fans + complete A4 / Large 32K specifications - four things together to achieve the above two things.

The epub of the next shot is the second of the double NEW shots. The rhythm and emotional intensity are one step higher than this shot.

---

## SHOT 09 · "★ NEW · EBOOK" (md → epub)

**[TIMECODE]** 20.50 — 22.50s (2.0s) `|` **FUNCTION** CAPABILITY 06. **NEW**. md → Standard EPUB3. Second new feature. The last capability.

**[VISUAL]**

cross-dissolve entry. The duration of this shot is **shorter** than the previous one (only 2.0s instead of 3.0s) - because we have established a "NEW + destination" mode, the audience will understand it the second time it appears, and the rhythm can be accelerated.

destination card design: **Apple Books style EPUB reader frame** (emphasis on the reality of "this book is already in the reader").

```
   ╔════════════════════════════════════╗
   ║ ● ● ●                              ║  ← window chrome (Apple Books)
   ╠════════════════════════════════════╣
   ║                                    ║
   ║  HUASHU · ORANGE BOOK              ║  ← Mono Bold 10px Terracotta 0.22em
   ║                                    ║
   ║                                    ║
   ║  On                                ║  ← Newsreader 700, 30px, Ivory paper
   ║  Markdown                          ║     (on Charred bg)
   ║                                    ║
   ║  ───                               ║  ← Terracotta rule 40×2px
   ║                                    ║
   ║ an essay · Uncle Hua ║ ← italic 14px Smoke on Charred
   ║                                    ║
   ╠════════════════════════════════════╣
   ║ Apple Books · 1 of 24    EPUB 3   ║  ← Mono 10px Smoke 0.14em
   ╚════════════════════════════════════╝
   460×470px, ivory paper outer + Charred inner book cover area
   2px Ink border, 22px border-radius (modern app frame)
```

**Key visual differences**:
- The overall frame has a "macOS app window" feel (three dots + rounded corners 22px)
- The middle is the "open e-book" cover area (Charred bottom + typography of the publisher's taste)
- At the bottom is "Apple Books · 1 of 24" reader chrome
- The whole card gives people the sense of reality that "I am reading this book in Apple Books"

**[TYPE]**

- HUASHU · ORANGE BOOK：Mono Bold 10px, Terracotta, 0.22em
- book title (On Markdown)：Newsreader 700, 30px, Ivory (on Charred bg), line-height 1.0
- terracotta rule：40×2px
- author italic：Noto Serif SC italic 14px, Smoke
- Apple Books chrome：Mono 10px, Smoke, 0.14em

**[ANIM]**

- 20.50-20.80s · Previous scene PDF exit + md keep
- 20.70s · NEW label **remains lit** (does not pop up again this time because it has already been created in SHOT 08 - just display "★ NEW" directly)
- 20.80-21.10s · arrow + label "md → epub" entry (Terracotta accent, same as SHOT 08)
- 21.20-21.80s · EPUB destination card overall admission (600ms expoOut, scale 0.88 → 1)
- 21.30-22.00s · Internal staggered: window chrome dots (delay 0) → top brand label (delay 200ms) → book title "On" (delay 400ms) → "Markdown" (delay 480ms) → rule (delay 700ms) → author italic (delay 850ms) → bottom chrome (delay 1000ms)
- 22.00-22.50s · hold + prepare to transition to ACT III

**[AUDIO]**

- BGM: percussion persists, but at 22.00s overall BGM swell +3dB (for SHOT 10's convergence build-up)
- **SFX: chime: NEW (06) at 20.70s (double chime + soft glow, half a tone higher than SHOT 08, -14dB)** - The semitone difference allows the two NEW lenses to form a musical relationship
- SFX: window chrome subtle "click" at 21.20s (macOS window appearance, -24dB)
- SFX: page turn rustle at 21.40s

**[CHROME]**

- A: `CAPABILITY · 06`, sixth dot solid (**all solid — 6/6**)
- A next to NEW tag lasts
- B: Version chip’s orange dot pulse is enhanced (amplitude × 1.5)
- C: Progress point ● Reach the rightmost position "md→epub"
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ Don’t draw the real logo of Kindle or Apple Books (to avoid IP risks); just use macOS window chrome to imply “reader”
- ✅ No e-ink gray filter (avoids Kindle slop)
- ✅「Apple Books · 1 of 24」chrome is the real publishing data sense (24 chapters, Chapter 1)
- ✅ pause-and-look signature: Book title "On / Markdown" **Line Break** - Newsreader's line break design under 30px large font size, paying tribute to Penguin Classics cover layout

**[WHY]**

This shot is the finale of ACT II. Two things must be done:
1. All 6 capabilities are displayed (counter 6/6 solid)
2. Emotions begin to build-up towards the climax of ACT III

The shot length from 3.0 → 2.0s is deliberate - the rhythm is accelerating, and the audience feels "we are about to reach the top."

---

## SHOT 10 · "THE CONVERGENCE"

**[TIMECODE]** 22.50 — 24.00s (1.5s) `|` **FUNCTION** Transition from ACT II → ACT III. All elements are in place. Prepare slogan.

**[VISUAL]**

22.50s: All previous destination cards have exited. Chrome A/C begins to fade out (capability counter has been completed on 6/6, mission accomplished).

In the center of the screen, the md character slides from the left position (x=480) back to the center (x=960), and at the same time the size changes from 220px → 300px.

The 6 capability labels around md (any→md / md→html / html→md / md→docx / md→pdf / md→epub) emerge one by one from a distance (circle r=380px), surrounding the md character in a circle, one every 60°, arranged in clockwise order (starting from "any→md" at the top). These labels are a mix of Mono Bold 14px Smoke (not active) + Terracotta (actually new).

Overall effect: **md characters are the sun and the 6 capabilities are the planets. **

But this shot doesn’t need to hold the audience in for too long – it’s a transitional shot.

23.50-24.00s: 6 capability labels slowly fade out (200ms each, inverse cascade), the md character continues to remain in the center, shrinks to 180px, and is ready to give way to the slogan.

**[TYPE]**

- 6 capability labels: JetBrains Mono Bold 14px, letter-spacing 0.16em
  - Top 4 (any→md / md→html / html→md / md→docx): Smoke
  - Last 2 (md→pdf / md→epub): Terracotta

**[ANIM]**

- 22.50-22.80s · The last EPUB card exits, Chrome A/C fades out (300ms linear)
- 22.50-23.00s · md character slides back to center + zoom in (500ms expoOut)
- 22.80-23.40s · 6 capability labels emerge from around md (each 60° position, r=380px, stagger 80ms each, fade-in 300ms + slightly outward slide 20px)
- 23.40-23.80s · hold (6 labels settle around md)
- 23.80-24.00s · 6 labels fade out at the same time (200ms linear), md characters are reduced to 180px (200ms expoOut)

**[AUDIO]**

- BGM: at 23.00s, all-layer swell starts (L1+L2+L3+L4 → +4dB)
- BGM: at 23.50s, percussion 1 beat (gives tension to sudden silence)
- SFX: 6 capability labels with extremely weak "click" when entering (-30dB each, staggered)
- SFX: ascending sweep starts at 23.50s (build-up to 24.00s)

**[CHROME]**

- A: fade out at 22.50s (counter has reached 6/6, mission accomplished)
- B: ON, but start preparing the transition for ACT III (keep the position the same, but tighten the internal spacing slightly)
- C: fade out at 22.50s
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ The 6 capability labels are not "circle around the md" (to avoid the cyber slop of the "planet spinner"); they are "settled at a fixed position and then fade together" (more restrained)
- ✅ Chrome A/C exits gracefully after the mission is completed (not "always on the screen"), this is a good habit to "make way for the next scene"
- ✅ pause-and-look signature: 6 labels are on the screen at the same time at 23.40s, read in clockwise order. It is the only "full capability panoramic" frame in this film - if the audience pauses here, they can fully see the 6 pipelines - this is the best frame for marketing screenshots

**[WHY]**

This is a bridge.

ACT II ends at 22.50s (NEW (06) has just been completed), but the slogan still needs to enter the stage at 24.00s - the 1.5s in the middle cannot be "blank waiting", there must be narrative motion.

The concept of "convergence": After the six pipelines are completed, all capabilities are gathered back to the source of md. This is the essence of the entire story of this film - all flows eventually return to the source.

Next shot, give way to slogan. The md character is reduced to 180px and is ready to become the "brand seal" of the slogan.

---

## SHOT 11 · "ONE SOURCE."

**[TIMECODE]** 24.00 — 26.50s (2.5s) `|` **FUNCTION** ACT III peak first half. slogan Upward entry. Emotional climax.

**[VISUAL]**

md The character has been reduced to 180px and stays in the center of the screen (y=540).

24.00s: The md character **continues to slide** to the top-left of the screen** to (x=128, y=88), and is reduced to 56px - becoming a "brand seal" fixed in the upper left corner. This is where the brand comes back.

24.20s: The hero slogan top line begins to appear in the upper center of the screen (y=460):

```
ONE SOURCE.
```

Font: Newsreader 700, **168px**, letter-spacing -0.03em, line-height 0.95, Ink #1A1A1A
Position: Horizontally centered (x=960), y=460 (character baseline)

Entry method: **staggered letter reveal** - 10 characters (O-N-E-space-S-O-U-R-C-E-.) Press 30ms stagger to enter in sequence, each character fade + 12px y slide-down + scale 0.92 → 1.0 (260ms expoOut each).

26.00s: A short Terracotta rule (320×3px) appears 30px below the slogan, expanding from the center to both ends (300ms expoOut).

26.50s: On to the next shot.

**[TYPE]**

- ONE SOURCE.：Newsreader 700, 168px, Ink, letter-spacing -0.03em, line-height 0.95
- terracotta rule: 320×3px, centered, accent

**[ANIM]**

- 24.00-24.30s · md character slides to top-left (300ms expoOut, size 180 → 56)
- 24.20s · ONE SOURCE. The first character 'O' enters (260ms expoOut)
- 24.23s · 'N' Admission
- 24.26s · 'E' entry
- 24.29s · space (no visual, but layout occupancy)
- 24.32s · 'S'
- 24.35s · 'O'
- 24.38s · 'U'
- 24.41s · 'R'
- 24.44s · 'C'
- 24.47s · 'E'
- 24.50s · '.' (period)
- 24.20-25.00s · Entire ONE SOURCE. Completed (10 characters × 30ms stagger + 260ms each = total ~560ms)
- 25.00-26.00s · hold (let the audience read "ONE SOURCE.")
- 26.00-26.30s · Terracotta rule appears (300ms expoOut from 0 → 320px)
- 26.30-26.50s · hold

**[AUDIO]**

- BGM: The swell starting at 22.00s reaches peak at 24.50s (loudest -6dB)
- BGM: The entire string set enters (L5), cell + violin + viola three-layer superposition
- **SFX: impact (slogan ONE) at 24.20s — deep bass impact + short reverb tail (-8dB)** ← This is the strongest SFX cue in this film
- SFX: extremely light pen-on-paper stroke at 26.00s (when rule appears, -22dB)

**[CHROME]**

- A: OFF (has exited)
- B: ON, but **important change**: version chip now cross-dissolve into a new form - in the same position in the upper right corner, but the chip size is slightly larger, the font size is 18px (previously 16px), more prominent. At the same time, the pulse amplitude of Terracotta dot × 2 (emphasis on "v2.0 upgrade time")
- C: OFF (has exited)
- D: ON
- E: ON

**New chrome**:
- md character (top-left, 56px, Newsreader 600 + Terracotta dot) officially settled in corner and became the brand seal

**[ANTI-SLOP]**

- ✅ slogan is not "whole word fade-in" (cheap), but letter-by-letter stagger (movie quality)
- ✅ The single character stagger time of 30ms is calculated - enough to see the cascade, but will not slow down the rhythm (if it is 60ms, it will be slow)
- ✅ The font size 168px is verified by layout - no matter how big it is, it will collide with SIX FORMS. (SHOT 12), if it is smaller, it will not be powerful enough.
- ✅ pause-and-look signature: The "." at the end of "ONE SOURCE." is Terracotta (not Ink), echoing the Terracotta dot of the hero md character - the first and last brand signatures are consistent

**[WHY]**

This is the first half of the emotional climax.

"ONE SOURCE." is the thesis of this film. If the audience only remembers one sentence after watching the entire film, it is this sentence.

It is strategic to let the md character retreat to the top-left at this moment - slogan is the protagonist, and md is the brand seal. The two don't compete with each other.

Next shot, SIX FORMS. falls, thesis is complete.

---

## SHOT 12 · "SIX FORMS."

**[TIMECODE]** 26.50 — 29.00s (2.5s) `|` **FUNCTION** ACT III peak second half. Slogan downstream + capability map fully presented. Emotional resolution of the entire film.

**[VISUAL]**

26.50s: ONE SOURCE. Still at the top of the screen (y=460).

The lower part of the screen (y=720) begins to enter hero slogan bottom line:

```
SIX FORMS.
```

Font: Newsreader 700, 168px, letter-spacing -0.03em, line-height 0.95, **Terracotta #C2410C**
Position: Horizontally centered (x=960), y=720 (character baseline)

Entry: Mirrored to SHOT 11 - staggered letter reveal, 9 characters + 1 . (10 total), 30ms stagger each (slower stagger since this is the climax).

Entry details: Each character is fade + 12px y **slide-up** (instead of SHOT 11's slide-down, symmetrical direction) + scale 0.92 → 1.0 (260ms expoOut each).

27.20s: SIX FORMS. Completed, the entire slogan double-line typography is complete.

27.20-27.80s: At 30px below SIX FORMS., 6 capability pills appear, entering in order:

```
[any→md] [md→html] [html→md] [md→docx] [md→pdf ★NEW] [md→epub ★NEW]
```

Each pill:
- Font: JetBrains Mono Bold 14px, letter-spacing 0.16em
- Size: 10px×18px padding, 1.5px border
- First 4: Ink text + Ink border + transparent background
- The last 2 (NEW): Terracotta text + Terracotta border + Mist (#FFF7F0) background + Terra Hot "NEW" mini badge at -8/-10px in the upper right corner

Each pill is spaced 14px. The entire set is centered horizontally (x=960), y=820.

Entry: staggered from left to right, 80ms delay each, fade-in + 4px y slide-up (300ms expoOut).

27.80-28.30s: Sub-standard bank entry (y=890):

```
md is the source code, and everything is the product.
```

Font: Noto Serif SC italic 26px, Ink, letter-spacing 0.04em
Horizontally centered.

Entry: fade-in + 8px y slide-up (400ms expoOut).

28.30-29.00s: Overall hold. This is the most static frame of the film - all the elements are in place for the audience to "read it".

**[TYPE]**

- SIX FORMS.：Newsreader 700, 168px, Terracotta, letter-spacing -0.03em, line-height 0.95
- pills：JetBrains Mono Bold 14px, letter-spacing 0.16em, 1.5px border
- Subtitle: Noto Serif SC italic 26px, Ink, letter-spacing 0.04em

**[ANIM]**

- 26.50-27.20s · SIX FORMS. Character stagger (same as SHOT 11 mirror)
- 27.20-27.30s · short hold
- 27.30-27.80s · 6 pills cascade (stagger × 6 per 80ms = 480ms total + 300ms each pill duration)
- 27.80-28.30s · Sub-bid entry (400ms)
- 28.30-29.00s · Overall hold

**[AUDIO]**

- BGM: 26.50s peak swell continues, reaching the loudest (-4dB) in the whole film at 27.20s
- BGM: BGM starts to sustain after 27.20s (no longer enhances, but maintains peak intensity)
- **SFX: impact (slogan SIX) at 26.50s — deep bass impact, slightly heavier than the ONE mirror’s impact (-7dB)**
- SFX: 6 pills staggered metallic clicks on entry (-24dB each, 50ms)
- SFX: 27.80s extremely light pen flourish (sub-bid entry)

**[CHROME]**

- B: ON, version chip continues
- D: ON, watermark continues
- E: ON
- md seal (top-left): ON

**[ANTI-SLOP]**

- ✅ ONE SOURCE. is Ink, SIX FORMS. is Terracotta - representing the color contrast of "source" and "object" respectively, not a decorative color
- ✅ The two backgrounds NEW in 6 pills are #FFF7F0 (very light mist tint), not "orange filled" - restraint
- ✅ NEW mini badge in the upper right corner of the pill -8/-10px prominent position, but only 9px font size - the standard position for detailed signatures
- ✅ The subscript uses "," Chinese comma + period "." - This is respect for Chinese typography
- ✅ This frame (28.30s) is the "most complete frame for marketing" of this film - you can screenshot it as a thumbnail / X poster / official account cover image, all information is in one frame: slogan + 6 capability + sub-label + brand seal + version

**[WHY]**

This is the resolution mirror.

If SHOT 11 is thesis (ONE SOURCE.), SHOT 12 is antithesis + synthesis (SIX FORMS. plus complete capability map).

At frame 27.50s, the audience should be listening to the string peak and visually fully absorbed by typography - this is the most worthwhile 5 seconds of this film.

The next shot is the finishing touch, letting the strings decay and letting the md seal shine alone.

---

## SHOT 13 · "SIGN-OFF"

**[TIMECODE]** 29.00 — 30.00s (1.0s) `|` **FUNCTION** End. Let all slogan elements retire, leaving the md seal to shine alone. Brand imprint.

**[VISUAL]**

29.00s: SIX FORMS. + 6 pills + Subscript starts hold-in-place.

29.20-29.60s: ONE SOURCE. + SIX FORMS. + 6 pills + subtitle slowly fade out (each 400ms linear, **no stagger**, fading out simultaneously - creating the feeling of "the picture is settling").

29.40s: The top-left md seal character slowly enlarges from 56px to 88px, and at the same time the position slides from (128, 88) to the center of the screen (960, 540) - this is the "final return" of md.

29.40-29.80s: The md character settles in the center of the screen, size 88px, color Ink + Terracotta dot.

29.80-30.00s: A short Terracotta rule (120×2px, shorter and more delicate than SHOT 03) appears 30px below the md character, growing from 0.

30.00s: All elements in place. The last frame is:

```
                                                                  ● HUASHU-MD-HTML · v2.0
                                                                                              (top-right chrome)


                                            md.                   ← Newsreader 600, 88px, Ink + Terracotta dot
                                          ───                     ← Terracotta rule, 120×2px

                                                                                CREATED BY HUASHU-DESIGN
                                                                                              (bottom-right watermark)
```

The whole picture has only 4 elements: md seal, accent rule, top-right chrome, bottom-right watermark. All others are empty.

**[TYPE]**

- md.：Newsreader 600, 88px, Ink + Terracotta dot
- accent rule: 120×2px Terracotta

**[ANIM]**

- 29.00-29.20s · Last shot hold (let the audience absorb it completely)
- 29.20-29.60s · ONE SOURCE. + SIX FORMS. + 6 pills + subtitle sync fade out (400ms linear, sync)
- 29.40-29.80s · md seal zoom + slide to center (400ms expoOut, size 56 → 88, position (128,88) → (960,540))
- 29.80-30.00s · accent rule expansion (200ms expoOut, 0 → 120px)
- 30.00s · final hold (if there is a loop, the loop will return to 00.00s)

**[AUDIO]**

- BGM: 29.00s starts decay and enters L6 (all layers fade out)
- BGM: 29.40s strings fade, leaving piano + reverb tail
- BGM: 30.00s, everything returns to silence + room tone
- **SFX: final stamp / sign-off at 29.40s (ink stamp + soft reverb, -14dB)**——when md falls to the center
- SFX: extremely light paper rustle at 29.80s (accent rule entry)

**[CHROME]**

- B: ON, continuous
- D: ON, continuous
- E: ON, continuous
- All others OFF

**[ANTI-SLOP]**

- ✅ No sign-off text like "Thank you" or "Made with love" (cheap)
- ✅ No need to enlarge the logo (not required)
- ✅ The md seal is the real protagonist of the entire story of this film. In the end, leaving it alone in the center of the picture is the simplest form of resolution.
- ✅ pause-and-look signature: md. of the last frame. Under the 88px Newsreader font, the Terracotta dot is the visual focus of the entire screen - the audience's eyes will naturally stay on this dot, and then see the accent rule below, and then the top-right version chip. This "line of sight" is the success of visual hierarchy design
- ✅ silence leaves breathing room in the last 0.2s of the screen

**[WHY]**

The whole film starts with a blank page and ends with an MD seal + a touch of terra cotta orange.

This is the visual rhyme:
- 0.0s: blank ivory page (empty)
- 30.0s: ivory page + md (full)

The audience goes from "empty" to "full", but "full" is actually just a `md.` character - this is the visual declaration of "source-of-truth": **Everything comes from a simple md. **

If the whole film makes the audience remember one frame, I hope it is this frame.

---

# Part V · Production Manifest

## 5.1 Font list + loading method

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
```

**Actual loading time**: about 800-1500ms, depending on CDN status. `document.fonts.ready` wait must wait until returns true before starting the Stage timer (Stage is implemented).

## 5.2 Color palette CSS variables

```css
:root {
  --paper:       #FAFAF6;
  --mist:        #F2EDE4;
  --mica:        #E6E1D6;
  --smoke:       #6B6B6B;
  --cinder:      #3D3530;
  --ink:         #1A1A1A;
  --charred:     #2A2620;
  --terracotta:  #C2410C;
  --terra-hot:   #E55D21;
  --terra-deep:  #8B2D08;
}
```

## 5.3 BGM source selection criteria

**Preferred**: Use Suno v6.0 / Udio v1.5 to generate a 30-second cinematic minimal piece, prompt keywords:

```
minimal cinematic piano, slow tempo 60bpm, single piano notes,
sparse arpeggio, low cello drone, subtle sub-kick percussion,
swelling strings at climax, decay to silence,
in the style of Max Richter on the nature of daylight,
no vocals, 30 seconds duration, ivory paper mood
```

**Alternative**: Search copyright-free libraries
- artlist.io: "minimal cinematic"
- bensound.com: "cinematic"
- musicbed.com: "Jóhann Jóhannsson style"

**MINIMUM STANDARD**: BGM 30 seconds length, 44.1kHz sampling rate, aim for -16 LUFS integrated loudness.

## 5.4 SFX source

**Preferred**: Use huashu-design skill’s `assets/sfx/<category>/*.mp3` 37 pre-made resources:

```
Event Recommended SFX File
─────────────────────────────────────────────────────
keyboard clicks            sfx/ui/keyboard-click-*.mp3
cursor blink               sfx/ui/tick-soft.mp3
md morph swell             sfx/cinematic/whoosh-bloom.mp3
file card whoosh           sfx/cinematic/whoosh-short-*.mp3
absorb / ink drop          sfx/foley/ink-drop.mp3
paper rustle               sfx/foley/paper-turn.mp3
chime capability           sfx/melodic/chime-single-*.mp3
chime NEW (double)         sfx/melodic/chime-double-warm.mp3
build sweep                sfx/cinematic/ascending-sweep.mp3
impact (slogan)            sfx/cinematic/deep-impact-*.mp3
pen flourish               sfx/foley/pen-stroke.mp3
final stamp                sfx/foley/ink-stamp.mp3
```

## 5.5 Screenshot Verification Plan

The following keyframes must be validated after implementing HTML (using the Playwright + `?t=NN` URL parameter):

```
t=0.5 ← SHOT 01 mid: blank ivory page (check paper texture not to steal the show)
t=2.5 ← SHOT 02 mid: typing in progress (check cursor blink + JetBrains Mono)
t=3.8 ← SHOT 03 mid: md morphing (test ghost residual + scale curve)
t=5.0 ← SHOT 03 end: hero md settled (check 480px + Terracotta dot)
t=7.0 ← SHOT 04 mid: cards in flight (check the parabola + card content is true and readable)
t=8.4 ← SHOT 04 tagline (check "all things → md" Chinese italic)
t=10.5 ← SHOT 05 mid: html card complete (check the essay content is readable)
t=13.5 ← SHOT 06 mid: md source visible (check syntax highlighting)
t=16.5 ← SHOT 07 mid: docx page complete (check chapter title + page number)
t=19.0 ← SHOT 08 mid: PDFs fanned out (check crop marks are visible)
t=21.5 ← SHOT 09 mid: EPUB frame complete (check Apple Books chrome)
t=23.4 ← SHOT 10 mid: 6 capability orbit (check the complete capability panorama)
t=25.0 ← SHOT 11 mid: ONE SOURCE. complete (check kerning + Terracotta period)
t=27.5 ← SHOT 12 mid: SIX FORMS. + pills (check the complete slogan double line)
t=28.5 ← SHOT 12 marketing frame (check the overall marketing-ready frame)
t=29.9 ← SHOT 13 final hold (check md seal + accent rule)
```

Each frame must meet:
- no elements overflow 1920×1080 canvas
- character spacing and line height visually correct
- Anti-AI slop checklist passed
- Key typography details (such as Terracotta dot, page number em-dash, chapter title small caps) are identifiable

## 5.6 Recording parameters

```bash
node scripts/render-video.js \
  --file file:///path/to/v5-six-forms.html \
  --duration 30 \
  --fps 25 \
  --width 1920 \
  --height 1080 \
  --out v5-final-silent.mp4
```

**Key codec parameters**:
- video codec: libx264
- pixel format: yuv420p (compatibility)
- bitrate: 12 Mbps (high quality, 30s file about 45MB)
- profile: high
- preset: slow (quality > speed)

**Subsequent frame insertion** (optional, 60fps smooth version):

```bash
bash scripts/convert-formats.sh v5-final-silent.mp4 --fps 60
```

## 5.7 Audio Mixing

```bash
# Step 1: Add BGM
bash scripts/add-music.sh v5-final-silent.mp4 \
  --bgm assets/bgm/cinematic-minimal-30s.mp3 \
  --bgm-volume -18dB \
  --out v5-with-bgm.mp4

# Step 2: Add SFX cues (add them cue by cue according to Part II.6 SFX dictionary)
# Use ffmpeg's -filter_complex amix multi-channel mixing
ffmpeg -i v5-with-bgm.mp4 \
  -i assets/sfx/ui/keyboard-click-1.mp3 \
  -i assets/sfx/ui/keyboard-click-2.mp3 \
  ... \
  -filter_complex "[1]adelay=500|500[s1];[2]adelay=550|550[s2];...;[0][s1][s2]...amix=inputs=N:duration=longest:dropout_transition=0[out]" \
  -map 0:v -map "[out]" \
  -c:v copy -c:a aac -b:a 192k \
  v5-final.mp4

# Step 3: Verify audio stream
ffprobe -i v5-final.mp4 -show_streams -select_streams a 2>&1 | grep -E "(codec_type|sample_rate|channels|duration)"
```

**Expected output**:
- audio codec: aac
- sample rate: 44100Hz or 48000Hz
- channels: 2 (stereo)
- duration: 30.0s

## 5.8 Deliverables List

```
v5-final.mp4 main delivery (30s, 1920×1080, 25fps, with audio, ~50MB)
v5-final-60fps.mp4 High frame rate version (60fps interpolated, ~80MB, for X / YouTube)
v5-final.gif social media version (30s, palette optimization, < 8MB, used for public account embedding)
v5-final-silent.mp4 Silent version (backup to facilitate subsequent dubbing/changing BGM)
v5-poster.png Poster version (taken from this frame at t=28.5s, used for X card/public account cover)
v5-director-notes.md This document (director’s notes)
v5-six-forms.html source file (HTML animation)
v5-shot-list.csv shot time code + key parameter comparison table (for pause verification)
```

## 5.9 Full link time estimation

| Steps | Estimated time taken |
|-----|----------|
| Written by Director's notes | Completed |
| HTML animation implementation | 4-6 hours |
| Keyframe screenshots + visual verification | 1 hour |
| Record silent MP4 | 5-10 minutes (with Playwright enabled) |
| BGM generation/selection | 30 minutes |
| SFX with cue + mix | 2-3 hours |
| GIF derived | 5 minutes |
| Poster screenshot + naming | 10 minutes |
| Final delivery + git commit | 10 minutes |
| **Total** | **8-11 hours** |

---

# Appendix · The first principle of this film

If I, as a director, could only keep one sentence about this film, it would be:

> **A typographic film about "source", the protagonist is a `md.` character. **

All other design decisions—swatches, fonts, cadence, SFX, chrome, anti-slop checklist—derive from this one sentence.

If a specific decision cannot be traced back to this sentence, don’t do it.

---

*Director's notes — end of document*
*Total word count: about 11500 Chinese characters*
*Next: After the user review is passed, enter the HTML implementation stage*
