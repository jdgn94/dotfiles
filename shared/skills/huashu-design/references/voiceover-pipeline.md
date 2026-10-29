# Voiceover Pipeline · Narration driven animation

> Upgrade the animation from "silent screen + post-dubbing" to a workflow of "**first have commentary, and then drive the screen according to the measured audio duration**".
> Applicable to: 5-20 minute concept explanation videos, tutorial videos, and long-form knowledge popularization.
>
> Use together with `references/animation-best-practices.md`: this file manages **how narration matches the visuals**,
> while animation-best-practices covers **how each frame moves**.

---

## 🛑 Iron Rule · Must read before writing a line of code

> **I can’t emphasize this enough: Failure pattern #1 of narrated animation is made into a PowerPoint with voiceover. **

### Article 1 · The entire film is a continuous movement narrative, not a set of independent scenes

PowerPoint is 7 slides. What we do is **1 movie lasting X minutes**.

**Identity switching**:
- ❌ You are not "making content for 7 scenes"
- ✅ You are "letting one or more hero elements act on the screen for X minutes"

**Visual skeleton = one or several hero elements that run through the entire film**:
- It appears from t=0 and does not leave until the end
- Each cue is its **state change** (position/size/color/perspective/form), not "change to a new element"
- The scene boundary exists in the script, but it should not exist in the picture - the audience cannot see "this is the third scene", only a continuous movement.

**Counterexample (actual pitfall of this skill v1 · 2026-05-10)**:
- 7 `<Scene>` each has an independent layout, scene switching = full page opacity 1→0 switches to the next page
- Each cue = `opacity: p, transform: translateY((1-p)*30px)` (fade-up used monotonically)
- Result: The audience's first reaction after watching it was "like pages of keynote", and the texture of the entire film was reduced to zero

**Correct mode**:
- Select 1-2 hero elements (for example, the demo of this article should select the two characters "md" and "html" as the skeleton)
- These two characters are on the screen **from the beginning to the end**
- Each "scene" is actually a state change of the hero element
  - opening: Two characters confront each other in the center of the screen
  - md-side: md becomes larger and thicker to occupy the screen, html retreats to small characters in the corner; data flows in around md
  - html-side: html is reversed as the protagonist; md retreats to the corner
  - the-real-question: The two characters return to the center, but there is a "≠" separation in the middle
  - the-split: Two characters are pushed to both sides, and the space in the middle is expanded.
  - activity-proof: two characters flash alternately on the timeline
  - closing: the landing of two characters is the final answer position
- In this way, the entire film is "md and html played on the screen for X minutes", not 7 independent PPTs

**Minimum implementation skeleton** (direct copy and modification):

```jsx
// ── Step 1: Define the hero’s target state (position/size/opacity) in each scene──
const HERO_KEYS = {
  opening:    { md: { x: 50, y: 35, scale: 1.0, opacity: 1 }, html: { x: 50, y: 65, scale: 1.0, opacity: 1 } },
  'md-side':  { md: { x: 78, y: 50, scale: 1.6, opacity: 1 }, html: { x: 92, y: 8,  scale: 0.25, opacity: 0.4 } },
  'html-side':{ md: { x: 8,  y: 8,  scale: 0.25, opacity: 0.4 }, html: { x: 22, y: 50, scale: 1.6, opacity: 1 } },
  // ... one entry for each paragraph, continuous movement from final of the previous paragraph → from of this paragraph
};

// ── Step 2: easing + lerp tool ──
const expoOut = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPos = (from, to, t) => ({
  x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t),
  scale: lerp(from.scale, to.scale, t),
  opacity: lerp(from.opacity ?? 1, to.opacity ?? 1, t),
});

// ── Step 3: HeroAnchor component - hang directly on the <NarrationStage> child level, without putting it into <Scene> ──
const HeroAnchor = () => {
  const { time, scene, timeline } = useNarration();
  if (!scene) return null;
  const idx = timeline.scenes.findIndex(s => s.id === scene.id);
  const prevId = idx > 0 ? timeline.scenes[idx - 1].id : scene.id;
  const from = HERO_KEYS[prevId];
  const to   = HERO_KEYS[scene.id];

  // The first ~45% of the time in the segment is used to morph from the prev state to the state of this segment, and the remaining time is hold
  const transitionDur = Math.min(2.0, scene.duration * 0.45);
  const t = expoOut(Math.min(1, (time - scene.start) / transitionDur));
  const md   = lerpPos(from.md,   to.md,   t);
  const html = lerpPos(from.html, to.html, t);

  // Add subtle breathing to allow movement in any frame (corresponding to the third iron rule)
  const breath = 1 + Math.sin(time * 0.6) * 0.012;

  const renderHero = (label, pos, color) => (
    <div style={{
      position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
      transform: `translate(-50%, -50%) scale(${pos.scale * breath})`,
      opacity: pos.opacity, color, fontSize: 360, fontWeight: 800,
      lineHeight: 1, willChange: 'transform, opacity', pointerEvents: 'none',
    }}>{label}</div>
  );
  return <>
    {renderHero('md',   md,   '#1B4965')}
    {renderHero('html', html, '#C04A1A')}
  </>;
};

// ── Step 4: Main component —— hero is a child of NarrationStage, and the auxiliary elements in the scene are managed separately ──
const App = () => (
  <NarrationStage timeline={TIMELINE} audioSrc="_narration/voiceover.mp3" width={1920} height={1080}>
    <HeroAnchor /> {/* ← persists across scenes, the entire visual skeleton */}
    {/* Use useSceneFade to control the soft fade in and out of the auxiliary elements in the scene, do not cut hard */}
    <MdSideAux />
    <HtmlSideAux />
    {/* ... */}
  </NarrationStage>
);
```

**Complete runnable reference**: `demos/md-html-narration/md-html-demo.html` (3 minutes and 21 seconds, 7 segments, 21 cues, verified in actual combat)

### Article 2 · There should be no “hard cuts” between scenes

| Wrong pattern (PowerPoint slop) | Correct pattern (cinematic) |
|---|---|
| scene A overall `opacity 1→0` and scene B `opacity 0→1` | The core elements of scene A **morph into** B (position/size/color smooth transformation) |
| Each scene has an independent layout, and elements appear/disappear | Elements **continue to exist** on the screen, but their positions and shapes change |
| `keepMounted=false`, the component is uninstalled when the scene switches | hero uses `keepMounted=true`, shares DOM nodes across scenes |
| Subtitle strips/data cards fade in fade out respectively | The subtitle strip enters the scene as the only "non-hero" in the screen, and after holding **exit together with the movement of the hero** |

Implementation level:
- **Shared elements across scenes** → Make hero a direct child of `<NarrationStage>`, **not in any `<Scene>`**
- Use `useNarration()` hook to read `time`, `scene`, `isCueTriggered` in hero, and decide the form based on the current time
- `<Scene>` is only used to manage those auxiliary elements (data cards, reference blocks, etc.) that only appear in this segment, and **do not cut these auxiliary elements** - use expoOut + stagger to enter the scene, and use fade overlap to overlap with the next segment when exiting.

### Article 3 · Every frame must have movement

**Self-test method**: **cut any frame** during recording (not the second when the cue is triggered).
- If the screen looks "**completely still**" → Wrong. Go back and add underlying movement (background drift / hero subtle scale / camera pan / parallax)
- There is always an underlying movement running (even if it is not the focus):
  - hero element's `scale: 1 ↔ 1.02` 5 seconds breathing cycle
  - Background `translateX: 0 ↔ -20px` drift slowly
  - `translateY` is retained after the data card is entered. Slight jitter (Perlin noise)
- A completely still image = PowerPoint slop

### Article 4 · Easing / Stagger / Hold is the bottom line

| Item | Required | Prohibited |
|---|---|---|
| Easing | `expoOut` spindle (`cubic-bezier(0.16, 1, 0.3, 1)`), `overshoot` emphasis, `spring` placement | `linear`, `ease`, CSS default |
| Multi-element entry | 30ms stagger (30ms entry every night) | One-size-fits-all appearance |
| Before the key cue | hold 0.3-0.5s to let the audience "see" (the previous element is still for 0.3s before triggering the cue) | After one section, seamlessly cut to the next section |
| Ending | Stop suddenly, last frame hold 1s | fade to black |

For detailed rules, refer to §1-§4 of `animation-best-practices.md`.

### Self-examination · First audience reaction

After you finish it and show it to someone who has never seen it (or watch it yourself 24 hours later), what is their first reaction?

| Reactions | Ratings | Actions |
|---|---|---|
| "This is a PPT with dubbing" | Failure | Go back and redo |
| "The picture switches with the sound" | Failed | Lack of continuous narrative, hero element does not exist or does not penetrate |
| "This thing is moving" | Passed | But no memory points |
| "I want to finish it" | Good | The rhythm is right |
| "I want to take a screenshot of this section" | great | You did it |

---

## Workflow (high level)

```
                ┌──────────────────────────┐
                │Commentary .md（## scene + │
                │ [[cue:xx]] Mark key sentences) │
                └──────────────┬───────────┘
                               │
                  narrate-pipeline.mjs
                               │
                               ▼
            ┌──────────────────────────────┐
            │ voiceover.mp3 (the entire spliced section) │
            │ timeline.json (actual measurement duration) │
            └──────────────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌─────────────────┐      ┌──────────────────┐
    │ HTML animation │ │ Record MP4 + Mix │
    │ (NarrationStage)│      │ render-narration │
    │ Live broadcast with audio synchronization│ │ → Final release MP4 │
    └─────────────────┘      └──────────────────┘
       Delivery form 1 Delivery form 2
```

## Commentary format

Place it anywhere in the project directory. The recommended file name is `script.md`:

```markdown
---
title: What is LLM
voice: S_JSdgdWk22 # Optional, override .env default voice
speed: 1.0 # Optional, 0.5-2.0
gap: 0.4 # Number of seconds of silence between segments, default 0.3
---

## intro
Hello everyone, today we will explain clearly what LLM is in 5 minutes.

## what-is
The full name of LLM is Large Language Model, [[cue:bigmodel]]. It is a neural network with hundreds of billions of parameters.
It is essentially a predictor of text solitaire.

## demo
For example, if you enter "today's weather", the [[cue:input]] model will predict what the next word is most likely to be.
[[cue:predict]]Maybe it’s “really good”, maybe it’s “not bad”.
```

**Rules**:
- The segment title `## scene-id` is English/number + hyphen (e.g. `## what-is`, `## scene-1`)
- `[[cue:xx]]` is marked in the middle of the key sentence - the text will be cut at this position when the script is running, and the moment after the cue is the trigger point of the screen
- Use `<Cue id="xx">` to monitor cue id in animated HTML
- When writing narration, pay attention to rhythm + short sentences. Long sentences will be dull when TTS comes out.

## timeline.json schema

```ts
{
  title: string,
  voice: string | null,
  speed: number,
  gap: number,
  totalDuration: number, // The actual measured seconds of the entire voiceover.mp3
  voiceover: 'voiceover.mp3', // relative path to timeline.json
  scenes: [
    {
      id: string,
      start: number, // The starting time of this segment in the entire audio segment
      end: number,
      duration: number,
      audio: 'audio/<id>.mp3', // This segment is a separate audio segment (the subsegment before merging has been concat)
      text: string, // The entire text with the [[cue:xx]] tag stripped
      // Chunks are the source of subtitle display - each chunk is a sub-segment cut by cue, including the TTS measured time window
      chunks: [
        {
          text: string, // subsection text
          start: number, // relative time within segment
          end: number,
          absoluteStart: number, // Absolute time of the entire track (aligned to voiceover.mp3)
          absoluteEnd: number,
        }
      ],
      cues: [
        {
          id: string,
          offset: number, // relative time within segment
          absoluteTime: number, // The absolute time on the entire time axis
        }
      ]
    }
  ]
}
```

`absoluteTime` and `absoluteStart/End` are both **actually measured** - the pipeline cuts the text in the segment into sub-segments according to cue and TTS respectively. Time = accumulates the actual measured duration of the previous sub-segments. **Not an approximation linearly estimated by number of characters**.

## Subtitles

> **Subtitles are provided by default**—long explanation videos without subtitles will significantly reduce the retention rate. NarrationStage provides `<Subtitles />` out of the box.

### Usage (one line)

```jsx
const { NarrationStage, Subtitles } = NarrationStageLib;
<NarrationStage timeline={TIMELINE} audioSrc="...">
  {/* Your hero / scene content */}
  <Subtitles /> {/* ← Automatically get the active text from timeline.scenes[].chunks */}
</NarrationStage>
```

### Visual rules (Bilibili style · anti-PowerPoint)

| Item | Rule | Counterexample |
|---|---|---|
| Background | **No background** (no black horizontal bars, no backdrop-blur) | Translucent black background + blur = subtitle bar suppresses the screen = PPT feeling |
| Text color | **Dark ink `#1a1a1a` + white halo** for light background; white text + black halo for dark background | White text + black stroke for light background = blurred text |
| Font size | 32px (1080p video) | <24px cannot be seen clearly, >40px steals the main vision |
| Font | `PingFang SC` / `Noto Sans SC` (sans serif, Bilibili standard) | Serif font = like movie subtitles |
| Position | bottom: 90px (no edge) | Attaching the bottom edge looks cheap |
| Single line length | **≤ 12-13 words** (English is counted as 0.5 words when mixing Chinese and English) | >15 words per line cannot be read on the mobile phone |
| Sentence cutting rules | **Never cut across periods**: Press ` first. ! ? `Cut sentences, press `,,;:` for each sentence to merge into ≤maxLen | Cut according to the number of words, cut "This is good" into "This is good" + "The" |

`<Subtitles />` runs according to the above rules by default and does not need to pass props. Deep scene: `<Subtitles color="#fff" haloColor="rgba(0,0,0,0.85)" />`.

### Sentence segmentation algorithm (already built in narration_stage.jsx)

```js
splitChunkToLines(text, maxLen = 13)
// 1. Strong punctuation (.!?\n)
// 2. Each sentence ≤ maxLen is retained directly
// 3. Otherwise slice according to weak punctuation (,,;:) and merge to ≤ maxLen
// 4. Hard cut (rare)
// Mixed Chinese and English: English/digits are calculated as 0.5 characters for visual width
```

If a line is obviously too long or too short after the chunk is cut, **change the position of the cue in the commentary** (the cue cuts the segment into thinner parts), and do not adjust the sentence logic on the front end.

## NarrationStage API

```jsx
import 'assets/narration_stage.jsx';
const { NarrationStage, Scene, Cue, useNarration } = NarrationStageLib;

<NarrationStage
  timeline={TIMELINE} // timeline.json content
  audioSrc="_narration/voiceover.mp3" // Path relative to the current HTML
  width={1920} height={1080}
  background="#f5f1e8"
  controls={true} // Display the bottom play bar during live broadcast
>
  {/* hero element: persists across scenes - placed directly in NarrationStage children */}
  <HeroAnchor />

  {/* Auxiliary elements within the scene: only appear in this segment */}
  <Scene id="intro">
    <Cue id="bigmodel">{(triggered, progress) => (
      <SomeElement style={{ opacity: progress }} />
    )}</Cue>
  </Scene>
</NarrationStage>
```

**Hooks**：
- `useNarration()` returns `{ time, scene, sceneTime, isCueTriggered, cueProgress }`
- Read directly in the custom component, no need to pass props

**Scene component**:
- By default, it is only mounted when `scene.id === id`
- Add `keepMounted` for continuous mounting (used when cross-scene animation is continuous)

**Cue component**:
- children must be `(triggered, progress) => ReactNode`
- progress is the progressive value from 0→1 after the cue is triggered (default 0.6s ramp)

## Time source (dual track)

NarrationStage automatically detects `window.__recording`:
- **Live broadcast mode** (default): Following the currentTime of the audio element, the user can pause/drag the seek in synchronization
- **Video recording mode** (render-video.js sets `window.__recording = true`): rAF wall-clock self-drive starts from 0, exposes `window.__seek(t)` to render-video.js to reset

## Three scripts

| Script | Input | Output |
|---|---|---|
| `scripts/tts-doubao.mjs` | Single paragraph of text | Single mp3 + measured duration |
| `scripts/narrate-pipeline.mjs` | Narration .md | voiceover.mp3 + timeline.json |
| `scripts/mix-voiceover.sh` | Video + voiceover.mp3 [+ BGM] | MP4 with audio |
| `scripts/render-narration.sh` | Narration HTML + timeline.json | Final MP4 (one-stop recording + mixing) |

## .env configuration

`.env` in the skill root directory (gitignore):

```
DOUBAO_TTS_API_KEY=<your_key>
DOUBAO_TTS_VOICE_ID=<your_clone_voice_id>
DOUBAO_TTS_CLUSTER=volcano_icl
DOUBAO_TTS_ENDPOINT=https://openspeech.bytedance.com/api/v1/tts
```

Refer to the `.env.example` template. The Doubao voice-clone voice ID is obtained from the Volcengine console.

## Standard workflow (10 steps)

1. **Write a commentary**: The commentary is the source code. First, write the entire voiceover completely. The title of the segment is `## scene-id`, and add `[[cue:xx]]` before the key sentence.
2. **Run narrate-pipeline**: `node scripts/narrate-pipeline.mjs --script script.md --out-dir _narration`
3. **Listen to the entire voiceover.mp3**: The rhythm is wrong, so go back and revise the draft. **This step determines the upper limit of the quality of the entire film**
4. **🛑Answer the iron rule before designing**: What is the hero element? What is its status in each paragraph? How to morph across scenes? Don’t write code if you can’t answer the question
5. **Write animation HTML**: Use NarrationStage + one or several hero elements to perform across scenes
6. **Live broadcast preview**: Open HTML in the browser, click ▶ Play, listen to the picture + commentary synchronization
7. **First Audience Self-Check**: Use the above "Self-Check·First Audience Reaction" table to score. If failed, return to Step 4 and try again.
8. **Record video**: `bash scripts/render-narration.sh demo.html --timeline=_narration/timeline.json` (automatically record silent MP4 + mix in voiceover)
9. **Optional BGM**: Add `--bgm-mood=educational` in render-narration (or tech / tutorial, etc.)
10. **Delivery**: Browser HTML (for live demo) + Final MP4 (for publishing)

##Exception handling

| Problem | Solution |
|---|---|
| TTS API error | Check whether `DOUBAO_TTS_API_KEY` in .env is correct |
| A certain audio segment is obviously longer/shorter than the script | There are strange punctuation marks or emojis in this text segment, and TTS parsing is abnormal → Revision |
| cue absoluteTime is incorrect | There is a problem with ffmpeg when splicing sub-segments within a segment → Check the mp3 encoding consistency |
| The video recording results in a black screen | render-video.js did not get the `window.__ready` signal → Check whether NarrationStage is mounted normally |
| The video recording is stuck | There is heavy layout in the animation (a lot of box-shadow/blur) → Simplify or pre-synthesize |
| Real broadcast and picture are out of sync | Audio element loading delay → Add `preload="auto"` or local preloading |

## When not to use this pipeline

- **<60s short animation**: Directly create silent animation + post-dubbing (add-music.sh + a separate TTS), no timeline driver is required
- **Pure BGM video**: Use `add-music.sh` to add preset BGM
- **Replace TTS with real-person recording**: Replace `voiceover.mp3` with real-person recording, write the timeline by hand or use ffprobe to measure segment duration + tool script generation → the rest of the process is common

---

**Last reminder**: Return to the iron rule before writing code. **Don’t make a PowerPoint with voiceover**.
