# Editable PPTX export: HTML hard constraints + size decisions + common mistakes

This document talks about the path to use `scripts/html2pptx.js` + `pptxgenjs` to translate HTML element by element into a real editable PowerPoint text box**. It is also the only path supported by `export_deck_pptx.mjs`.

> **Core premise**: To take this path, HTML must be written according to the following 4 constraints from the first line. **It is not a matter of writing and reposting** - post-mortem remediation will trigger 2-3 hours of rework (2026-04-20 Option Private Board Project Actual Testing Pitfall).
>
> For scenes that give priority to visual freedom (animation / web component / CSS gradient / complex SVG), please use the PDF path (`export_deck_pdf.mjs` / `export_deck_stage_pdf.mjs`). **Don’t** expect pptx export to have both visual fidelity and editability - this is the physical constraint of the PPTX file format itself (see "Why the 4 constraints are not bugs but physical constraints" at the end of the article).

---

## Canvas size: use 960×540pt (LAYOUT_WIDE)

PPTX unit is **inch** (physical size), not px. Decision-making principle: The computedStyle size of the body must match the inch size of the presentation layout (±0.1", enforced by `validateDimensions` of `html2pptx.js`).

### Comparison of 3 candidate sizes

| HTML body | Physical size | Corresponding to PPT layout | When to choose |
|---|---|---|---|
| **`960pt × 540pt`** | **13.333″ × 7.5″** | **pptxgenjs `LAYOUT_WIDE`** | ✅ **Default Recommended** (standard in modern PowerPoint 16:9) |
| `720pt × 405pt` | 10″ × 5.625″ | Custom | Only when the user specifies the "Old PowerPoint Widescreen" template |
| `1920px × 1080px` | 20″ × 11.25″ | Customized | ❌ Non-standard size, the font appears unusually small after projection |

**Don’t think of HTML size as resolution. ** PPTX is a vector document, and the body size determines the **physical size** not the clarity. The extra large body (20″×11.25″) doesn’t make the text any clearer – it just makes the font size pt smaller relative to the canvas, which makes it harder to read when projected/printed.

### Choose one of three ways to write body (equivalent)

```css
body { width: 960pt; height: 540pt; } /* Clearest, recommended */
body { width: 1280px; height: 720px; } /* Equivalent, px custom */
body { width: 13.333in; height: 7.5in; } /* Equivalent, inch intuition */
```

Supporting pptxgenjs code:

```js
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 inch, no customization required
```

---

## 4 hard constraints (violation will directly report an error)

`html2pptx.js` translates HTML DOM into PowerPoint objects element by element. PowerPoint's formatting constraints projected onto HTML = 4 rules below.

### Rule 1: Text cannot be written directly in DIV - it must be wrapped with `<p>` or `<h1>`-`<h6>`

```html
<!-- ❌ Error: The text is directly in the div -->
<div class="title">Q3 revenue increased by 23%</div>

<!-- ✅ Correct: text is in <p> or <h1>-<h6> -->
<div class="title"><h1>Q3 revenue increased by 23%</h1></div>
<div class="body"><p>New users are the main driving force</p></div>
```

**Why**: PowerPoint text must exist in a text frame, which corresponds to HTML paragraph-level elements (p/h*/li). Bare `<div>` has no corresponding text container in PPTX.

**You cannot use `<span>` to carry the main text** - span is an inline element and cannot be independently aligned into a text box. span can only be sandwiched in p/h\* to make local styles (bold, color change).

### Rule 2: CSS gradients are not supported — only solid colors

```css
/* ❌ Error */
background: linear-gradient(to right, #FF6B6B, #4ECDC4);

/* ✅ Correct: solid color */
background: #FF6B6B;

/* ✅ If multi-color stripes are necessary, use flex sub-elements to each have a solid color */
.stripe-bar { display: flex; }
.stripe-bar div { flex: 1; }
.red   { background: #FF6B6B; }
.teal  { background: #4ECDC4; }
```

**Why**: PowerPoint’s shape fill only supports solid/gradient-fill, but pptxgenjs’s `fill: { color: ... }` only maps solid. To use gradients, PowerPoint's native gradient requires writing another structure, which is currently not supported by the tool chain.

### Rule 3: Background/border/shadow can only be on DIV, not on text labels

```html
<!-- ❌ Error: <p> has a background color -->
<p style="background: #FFD700; border-radius: 4px;">Key content</p>

<!-- ✅ Correct: the outer div carries the background/border, <p> is only responsible for the text -->
<div style="background: #FFD700; border-radius: 4px; padding: 8pt 12pt;">
  <p>Key contents</p>
</div>
```

**Why**: In PowerPoint, shape (square/rounded rectangle) and text frame are two objects. HTML's `<p>` is only translated into text frame, and the background/border/shadow belongs to shape - it must be written on the div that wraps the text.

### Rule 4: DIV cannot use `background-image` — use `<img>` tag

```html
<!-- ❌ Error -->
<div style="background-image: url('chart.png')"></div>

<!-- ✅ Correct -->
<img src="chart.png" style="position: absolute; left: 50%; top: 20%; width: 300pt; height: 200pt;" />
```

**Why**: `html2pptx.js` only extracts the image path from the `<img>` element and does not parse the CSS `background-image` URL.

---

## Merge text boxes (`data-pptx-merge`)

**Default behavior**: Each `<p>`/`<h1>`-`<h6>` in HTML is an **independent text box** in PPTX. Write 3 `<p>` in the card → There are 3 text boxes stacked on top of each other in the PPT. When editing, you cannot enter the entire paragraph, press enter, line feed, or add a paragraph. You have to change the font size/alignment one by one.

**Solution**: Add `data-pptx-merge="true"` to the outer div, and all `<p>/<h*>` in the container will be merged into **one editable text box**, with paragraph separators separating each paragraph. In PPT, paragraphs can be edited continuously.

```html
<!-- ✅ Combined writing method: all 4 paragraphs in one text box -->
<div class="card" data-pptx-merge="true"
     style="position: absolute; top: 60pt; left: 60pt; width: 420pt;
            background: #1A4A8A; border-radius: 8pt; padding: 20pt 24pt;">
  <h2 style="font-size: 24pt; color: #FFFFFF;">Title</h2>
  <p style="font-size: 14pt; color: #DDEEFF;">The first paragraph of text. </p>
  <p style="font-size: 14pt; color: #FFD166;">Second paragraph: Change the color for emphasis. </p>
  <p style="font-size: 14pt; color: #DDEEFF;">Third paragraph: Continue writing in the same text box. </p>
</div>
```

**Reserved styles** (per-paragraph written as run options): `font-size`, `color`, `font-family`, `font-weight` (bold), `font-style` (italic), `text-decoration: underline`, `<b>/<i>/<u>/<strong>/<em>/<span>` inline styles.

**Taken from the first paragraph, unified throughout the frame**: `text-align`, `line-height`. Because PowerPoint's alignment and line spacing are at the paragraph/textbox level - there can only be one alignment in a box. If several segments are aligned differently, don't use merge, let them be independent.

**The `background`/`border`/`box-shadow`/`border-radius`** of the container itself is rendered as a shape as usual, and behaves exactly the same as a normal div - that is to say, the blue card bottom + text are still two layers of "shape + text frame", but the text layer collapses from 3-4 text boxes to 1.

**Restrictions**:
- `data-pptx-merge` cannot be nested (an error will be reported).
- Containers cannot use `background-image` (same as 4 hard constraints rule 4).
- Do not place `background`/`border` child divs in the container - they will still be rendered as independent shapes, but the text inside has been merged, which may cause visual misalignment.

**When to use**: Scenarios where the content will be changed repeatedly and you need to continue editing in PPT. If you want to export the archive at once, you don’t need to add it. The behavior is consistent.

---

## Path A HTML template skeleton

Each slide is an independent HTML file, which is scope-isolated (to avoid the CSS pollution of single-file deck).

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 960pt; height: 540pt; /* ⚠️ Match LAYOUT_WIDE */
    font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
    background: #FEFEF9; /* Solid color, no gradient */
    overflow: hidden;
  }
  /* DIV is responsible for layout/background/border */
  .card {
    position: absolute;
    background: #1A4A8A; /* Background is on DIV */
    border-radius: 4pt;
    padding: 12pt 16pt;
  }
  /* The text label is only responsible for the font style, without adding a background/border */
  .card h2 { font-size: 24pt; color: #FFFFFF; font-weight: 700; }
  .card p  { font-size: 14pt; color: rgba(255,255,255,0.85); }
</style>
</head>
<body>

  <!-- Title area: outer div positioning, inner text label -->
  <div style="position: absolute; top: 40pt; left: 60pt; right: 60pt;">
    <h1 style="font-size: 36pt; color: #1A1A1A; font-weight: 700;">The title should be an assertion, not a subject</h1>
    <p style="font-size: 16pt; color: #555555; margin-top: 10pt;">Supplementary instructions for subtitle</p>
  </div>

  <!-- Content card: div is responsible for the background, h2/p is responsible for the text -->
  <div class="card" style="top: 130pt; left: 60pt; width: 240pt; height: 160pt;">
    <h2>Point 1</h2>
    <p>Short description text</p>
  </div>

  <!-- List: use ul/li, no manual • Symbols -->
  <div style="position: absolute; top: 320pt; left: 60pt; width: 540pt;">
    <ul style="font-size: 16pt; color: #1A1A1A; padding-left: 24pt; list-style: disc;">
      <li>First point</li>
      <li>Second point</li>
      <li>The third important point</li>
    </ul>
  </div>

  <!-- Illustration: use <img> tag, no background-image -->
  <img src="illustration.png" style="position: absolute; right: 60pt; top: 110pt; width: 320pt; height: 240pt;" />

</body>
</html>
```

---

## Common Errors Quick Check

| Error message | Cause | Fix |
|---------|------|---------|
| `DIV element contains unwrapped text "XXX"` | There is naked text in the div | Wrap the text in `<p>` or `<h1>`-`<h6>` |
| `CSS gradients are not supported` | Use linear/radial-gradient | Change to solid color, or use flex child elements to segment |
| `Text element <p> has background` | `<p>` tag adds background color | Jacket `<div>` carries background, `<p>` only writes text |
| `Background images on DIV elements are not supported` | div uses background-image | Change to `<img>` tag |
| `HTML content overflows body by Xpt vertically` | Content exceeds 540pt | Reduce content or font size, or `overflow: hidden` truncate |
| `HTML dimensions don't match presentation layout` | body size and pres layout do not match | body uses `960pt × 540pt` with `LAYOUT_WIDE`; or defineLayout custom size |
| `Text box "XXX" ends too close to bottom edge` | Large font size `<p>` distance from the bottom edge of the body < 0.5 inch | Move up, leaving enough bottom margin; the bottom of the PPT itself will be partially covered |

---

## Basic workflow (3 steps out of PPTX)

### Step 1: Write independent HTML for each page according to constraints

```
My Deck/
├── slides/
│ ├── 01-cover.html # Each file is complete 960×540pt HTML
│   ├── 02-agenda.html
│   └── ...
└── illustration/ # All images referenced by <img>
    ├── chart1.png
    └── ...
```

### Step 2: Write build.js and call `html2pptx.js`

```js
const pptxgen = require('pptxgenjs');
const html2pptx = require('../scripts/html2pptx.js'); // This skill script

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 inch, matching HTML's 960×540pt

  const slides = ['01-cover.html', '02-agenda.html', '03-content.html'];
  for (const file of slides) {
    await html2pptx(`./slides/${file}`, pres);
  }

  await pres.writeFile({ fileName: 'deck.pptx' });
})();
```

### Step 3: Open inspection

- PowerPoint/Keynote open and export PPTX
- Double-clicking any text should be able to edit it directly (if it is a violation of Article 1 of the picture description)
- Verification overflow: Each page should be within the body range and not intercepted

---

## This path vs other options (when to choose which one)

| Needs | What to choose |
|------|------|
| Colleagues will change the text in PPTX / send it to non-technical personnel for further editing | **Path to this article** (editable, need to write HTML from scratch according to 4 constraints) |
| Only for lectures/send to archive, no modifications will be made | `export_deck_pdf.mjs` (multiple files) or `export_deck_stage_pdf.mjs` (single file deck-stage), export vector PDF |
| Prioritize visual freedom (animation, web component, CSS gradient, complex SVG), accept non-editable | **PDF** (same as above) - PDF is both fidelity and cross-platform, more suitable than "image PPTX" |

**Never forcefully run html2pptx on visually freely written HTML** - the measured pass rate of visually driven HTML is < 30%, and the remaining page-by-page transformation is slower than rewriting. This scenario should be output as PDF, not PPTX.

---

## Fallback: There is a visual draft but the user insists on editable PPTX

Occasionally you will encounter this scenario: you/the user have written a visually driven HTML (gradients, web components, and complex SVG are all used). Originally, PDF was the most suitable, but the user clearly said "No, it must be editable PPTX."

**Don’t run `html2pptx` hard and expect it to pass** - The measured pass rate of visually driven HTML on html2pptx is <30%, and the remaining 70% will report errors or aliasing. The correct fallback is:

### Step 1 · Inform the limitations first (transparent communication)

Tell users three things clearly in one sentence:

> "Your current HTML uses [specific list: gradient / web component / complex SVG / ...], and converting it directly to editable PPTX will fail. I have two options:
> - A. **Output PDF** (recommended) - 100% visual preservation, the recipient can read and print but cannot change the text
> - B. **Rewrite a version of editable HTML** based on the visual draft (retain the design decisions of color/layout/copywriting, but reorganize the HTML structure according to 4 hard constraints, **sacrifice** visual capabilities such as gradients, web components, complex SVG, etc.) → then export editable PPTX
>
> Which one do you choose? "

Don’t make Plan B sound like a breeze—be clear about what you’ll lose. Let users make choices.

### Step 2 · If the user chooses B: AI will actively rewrite and the user will not be required to write it themselves.

The doctrine here is: **The user gives the design intent, and you are responsible for translating it into a compliant implementation**. It’s not about asking users to learn 4 hard constraints and then rewrite them themselves.

Principles to follow when rewriting:
- **Reserved**: Color system (main color/secondary color/neutral color), information level (title/subtitle/text/notes), core copywriting, layout skeleton (top, middle and bottom/left and right columns/grid), page rhythm
- **Downgrade**: CSS gradient → solid color or flex segment, web component → paragraph-level HTML, complex SVG → simplified `<img>` or solid color geometry, shadow → remove or reduce to minimal, custom font → align to system font
- **Rewrite**: bare text → wrapped in `<p>` / `<h*>`, `background-image` → `<img>` tag, background border on `<p>` → outer div carried

### Step 3 · Output control list (transparent delivery)

After the rewrite is completed, give the user a before/after comparison to let him know which visual details have been simplified:

```
Original design → editable version adjustment
- Title area purple gradient → main color #5B3DE8 solid color background
- Data card shadow → Delete (change to 2pt stroke distinction)
- Complex SVG line chart → simplified to <img> PNG (generated from HTML screenshot)
- Hero area web component animation → static first frame (web component cannot be translated)
```

### Step 4 · Export & Dual Format Delivery

- `editable` version of HTML → run `scripts/export_deck_pptx.mjs` to output editable PPTX
- **It is recommended to keep** the original mockup → Run `scripts/export_deck_pdf.mjs` to output high-fidelity PDF
- Delivered to users in dual formats: PDF of visual draft + editable PPTX, each performing its own duties

### Under what circumstances should you directly reject Plan B?

In some scenarios, the cost of rewriting is too high, and users should be advised to give up editable PPTX:
- The core value of HTML is animation or interaction (after rewriting, only the static first frame remains, and the amount of information is lost by 50%+)
- Number of pages > 30, rewrite cost more than 2 hours
- The visual design relies deeply on accurate SVG / custom filter (after rewriting, it has almost nothing to do with the original image)

At this time, the user is told: "The cost of rewriting this deck is too high. It is recommended to use PDF instead of PPTX. If the recipient really wants pptx format, accept that the visuals will be greatly simplified - should it be changed to PDF?"

---

## Why the 4 constraints are not bugs but physical constraints

These 4 items are not the author of `html2pptx.js` being lazy - they are the result of the constraints of the **PowerPoint file format (OOXML) itself** projected onto HTML:

- Text in PPTX must be in text frame (`<a:txBody>`), corresponding to paragraph-level HTML elements
- The shape and text frame of PPTX are two objects. It is impossible to draw the background and write text on the same element at the same time.
- PPTX’s shape fill has limited support for gradients (only certain preset gradients, but does not support CSS arbitrary angle gradients)
- The picture object of PPTX must refer to the real picture file, not a CSS property

After understanding this, **don’t expect the tool to become smart** - the HTML writing method must adapt to the PPTX format, not the other way around.
