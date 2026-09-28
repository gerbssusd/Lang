# The Language of Narrative — Ribó × Fitzgerald, Gilman, Chopin

A 30-slide narrated lecture that applies Ignasi Ribó's *Prose Fiction: An Introduction to the Semiotics of Narrative* (ch. 6, "Language," with chs. 1–5) to three stories in *Gerb's Anthology of Short Stories*:

- F. Scott Fitzgerald, "The Diamond as Big as the Ritz" (1922)
- Charlotte Perkins Gilman, "The Yellow Wallpaper" (1892)
- Kate Chopin, "A Respectable Woman" (1894)

`slides.md` is hand-authored Slidev markdown. The design comes from custom layouts and Vue components. The narration is in each slide's trailing HTML comment, which is where both Slidev (presenter notes) and deck2video look for it. The companion PowerPoint's speaker notes are generated from this same narration, so the two versions never drift apart.

## Project map

```
slides.md             the deck + narration (edit this)
style.css             design tokens, per-story accents, #slidev-goto-dialog fix
setup/main.ts         self-hosted fonts (Cormorant Garamond, Inter; SIL OFL) for offline export
layouts/              triptych · story · analysis · figure · works-cited
components/           Passage · Trope · Cite · LensRail · StyleMeter
public/ribo/          figures from Ribó (CC BY 4.0 / public domain; credited on slide 30)
public/art/           original generative SVG/PNG illustrations
analysis/             stylometrics.py + stylometrics.json (reproduces slide 26)
pronunciations.json   deck2video TTS respellings (Ribó, Chopin, Gouvernail…)
vercel.json           static build → dist/, SPA rewrites
netlify.toml          same, for Netlify
```

## Run locally (regular Slidev)

```bash
npm install
npm run dev            # http://localhost:3030  (presenter view: /presenter)
npm run build          # static site → dist/
npx playwright install chromium   # once, for exporting
npm run export         # PDF
npm run export:clicks  # one PNG per click state
```

## Deploy to Vercel

Push the folder to a Git repository and import it in Vercel, or run `npx vercel --prod` from this folder. `vercel.json` sets the build command (`npm run build`), the output directory (`dist`), and a rewrite to `index.html` so deep links like `/12` work. `.npmrc` skips the Playwright browser download during the Vercel install.

## Make the narrated video (deck2video)

deck2video (github.com/pjdoland/deck2video) reads this file as it is. It detects the Slidev format and turns each notes comment into narration. Each `[click]` marker lines up with a `v-click` reveal. All 30 slides were checked: the click-state images Slidev exports match the `[click]` markers in the notes (slides 2, 7, 16, and 20 animate).

```bash
npm install -g @slidev/cli playwright-chromium && npx playwright install chromium
python -m deck2video slides.md --format slidev \
  --voice my-voice.wav \
  --pronunciations pronunciations.json \
  --with-clicks-audio-padding 300 --audio-padding 400 \
  --output language-of-narrative.mp4
```

The narration is written for TTS. It uses full sentences and no abbreviations that would break a sentence in the middle (for example "Mrs Baroda" and "Saint Midas," with no periods). It runs about 4,500 words, which is roughly 30 minutes of video.

Authoring rules if you edit:

1. Put only the narration in HTML comments. Every comment on a slide becomes spoken audio.
2. Keep per-slide frontmatter flat (`key: value`).
3. If you add or remove a `v-click`, add or remove a matching `[click]` line in that slide's notes.

## Citation notes

MLA 9. The anthology has no printed page numbers, so page references follow its PDF pagination (Fitzgerald 150–97, Gilman 198–216, Chopin 217–21). Ribó's EPUB has no page numbers, so it is cited by chapter and numbered section, for example (Ribó, sec. 6.3).
