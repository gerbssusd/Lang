// Build the companion PowerPoint for "The Language of Narrative".
// Speaker notes are read from ../deck/slides.md so narration is identical in both versions.
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');

const DECK = '/home/claude/deck';
const OUT = process.argv[2] || '/home/claude/pptx/Language_of_Narrative_Ribo.pptx';

// ---------- narration from slides.md ----------
const md = fs.readFileSync(path.join(DECK, 'slides.md'), 'utf8');
const NOTES = [...md.matchAll(/<!--([\s\S]*?)-->/g)].map(m =>
  m[1].split('\n').filter(l => !/^\s*\[click\]\s*$/i.test(l)).map(l => l.trim()).filter(Boolean).join('\n\n'));
if (NOTES.length !== 30) throw new Error('expected 30 notes, got ' + NOTES.length);

// ---------- tokens ----------
const C = {
  paper: 'FAF9F6', card: 'FFFFFF', ink: '1B1A1F', muted: '6B6760', faint: 'A39F97', rule: 'E4E0D8',
  night: '121117',
};
const ACC = {
  ribo:   { a: '9A7428', soft: 'EFE4CB', light: 'E2C483' },
  fitz:   { a: '1E5A66', soft: 'D6E6E8', light: '9FD0D6' },
  gilman: { a: '8C6D0C', soft: 'F3E6B3', light: 'ECD27A', bar: 'B08A14' },
  chopin: { a: '34396E', soft: 'DFE0F0', light: 'C3C6F0' },
};
const SERIF = 'Cambria', SANS = 'Calibri';
const W = 10, H = 5.625, MX = 0.5;

// ---------- icons (Phosphor, MIT) ----------
const PH = require(path.join(DECK, 'node_modules/@iconify-json/ph/icons.json'));
const iconCache = {};
async function icon(name, hex) {
  const k = name + hex;
  if (iconCache[k]) return iconCache[k];
  const body = PH.icons[name].body.replace(/currentColor/g, '#' + hex);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">${body}</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[k] = 'image/png;base64,' + buf.toString('base64'));
}

// ---------- rich text: **bold** *italic* ==mark== {{cite}} ----------
function rt(str, o = {}) {
  const base = { fontFace: o.font || SANS, fontSize: o.size || 11, color: o.color || C.ink, italic: !!o.italic };
  const runs = [];
  const re = /(\*\*[^*]+\*\*|==[^=]+==|\{\{[^}]+\}\}|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) runs.push({ text: str.slice(last, m.index), options: { ...base } });
    const t = m[0];
    if (t.startsWith('**')) runs.push({ text: t.slice(2, -2), options: { ...base, bold: true } });
    else if (t.startsWith('==')) runs.push({ text: t.slice(2, -2), options: { ...base, bold: true, italic: false, color: o.markColor || base.color, highlight: o.highlight } });
    else if (t.startsWith('{{')) runs.push({ text: '(' + t.slice(2, -2) + ')', options: { ...base, italic: false, fontFace: SANS, fontSize: Math.max(7, base.fontSize - 3), color: C.muted } });
    else runs.push({ text: t.slice(1, -1), options: { ...base, italic: true, fontFace: base.fontFace === SANS ? SERIF : base.fontFace } });
    last = m.index + t.length;
  }
  if (last < str.length) runs.push({ text: str.slice(last), options: { ...base } });
  return runs;
}
const shadow = () => ({ type: 'outer', color: '1B1A1F', opacity: 0.12, blur: 8, offset: 2, angle: 90 });

// ---------- primitives ----------
function bg(s, color = C.paper) { s.background = { color }; }
function eyebrow(s, text, acc) {
  s.addText(text.toUpperCase(), { x: MX, y: 0.28, w: 8.6, h: 0.22, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: acc.a, charSpacing: 3, isTextBox: true });
}
function title(s, text, o = {}) {
  s.addText(text, { x: o.x ?? MX, y: o.y ?? 0.5, w: o.w ?? 9, h: o.h ?? 0.62, margin: 0, fontFace: SERIF, fontSize: o.size ?? 26, color: C.ink, valign: 'top', isTextBox: true });
}
function card(s, x, y, w, h, o = {}) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.1, fill: { color: o.fill || C.card }, line: { color: o.fill || C.card, width: 0 }, shadow: o.flat ? undefined : shadow() });
}
function label(s, text, x, y, w, acc) {
  s.addText(text.toUpperCase(), { x, y, w, h: 0.2, margin: 0, fontFace: SANS, fontSize: 7.5, bold: true, color: acc.a, charSpacing: 2, isTextBox: true });
}
function body(s, str, x, y, w, h, o = {}) {
  s.addText(rt(str, o), { x, y, w, h, margin: 0, valign: o.valign || 'top', paraSpaceAfter: 4, lineSpacingMultiple: o.ls || 1.08, isTextBox: true, fit: 'none' });
}
// titled card
function tcard(s, x, y, w, h, head, text, acc, o = {}) {
  card(s, x, y, w, h, o);
  const pad = 0.15;
  if (head) label(s, head, x + pad, y + pad, w - 2 * pad, acc);
  body(s, text, x + pad, y + pad + (head ? 0.27 : 0), w - 2 * pad, h - 2 * pad - (head ? 0.27 : 0), { size: o.size || 10, font: o.font, italic: o.italic });
}
// quoted passage with MLA cite
function passage(s, x, y, w, h, text, cite, acc, size = 12.5) {
  card(s, x, y, w, h);
  s.addText('“', { x: x + 0.08, y: y - 0.02, w: 0.4, h: 0.55, margin: 0, fontFace: SERIF, fontSize: 40, color: acc.a, transparency: 35, isTextBox: true });
  body(s, text, x + 0.42, y + 0.14, w - 0.6, h - 0.45, { font: SERIF, size, italic: true, markColor: acc.a, ls: 1.1 });
  s.addText('(' + cite + ')', { x: x + 0.3, y: y + h - 0.3, w: w - 0.45, h: 0.2, margin: 0, align: 'right', fontFace: SANS, fontSize: 8, color: C.muted, isTextBox: true });
}
function trope(s, x, y, w, h, name, tenor, vehicle, ex, acc) {
  card(s, x, y, w, h);
  label(s, name, x + 0.13, y + 0.12, w - 0.26, acc);
  let ty = y + 0.36;
  if (tenor) {
    s.addText([
      { text: ' ' + tenor + ' ', options: { highlight: acc.soft.slice(0), color: C.ink } },
      { text: '  →  ', options: { color: acc.a } },
      { text: ' ' + vehicle + ' ', options: { color: C.ink } },
    ], { x: x + 0.13, y: ty, w: w - 0.26, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, isTextBox: true });
    ty += 0.25;
  }
  body(s, ex, x + 0.13, ty, w - 0.26, y + h - ty - 0.08, { font: SERIF, size: 10.5, italic: true });
}
async function rail(s, active, acc, page) {
  const lenses = [['book-open-text', 'Narrative'], ['path', 'Plot'], ['house-line', 'Setting'], ['users-three', 'Character'], ['microphone-stage', 'Narration'], ['quotes', 'Language']];
  let x = MX; const y = 5.2, h = 0.22;
  for (let i = 0; i < 6; i++) {
    const n = i + 1, on = active.includes(n), lang = n === 6;
    const w = 1.12;
    const fill = on ? (lang ? acc.a : acc.soft) : C.paper;
    const col = on ? (lang ? 'FFFFFF' : C.ink) : C.faint;
    s.addShape('roundRect', { x, y, w, h, rectRadius: 0.11, fill: { color: fill }, line: { color: on ? fill : C.rule, width: 0.75 } });
    s.addImage({ data: await icon(lenses[i][0], col), x: x + 0.08, y: y + 0.04, w: 0.14, h: 0.14 });
    s.addText(`Ch. ${n} · ${lenses[i][1]}`, { x: x + 0.25, y, w: w - 0.28, h, margin: 0, fontFace: SANS, fontSize: 7, color: col, valign: 'middle', isTextBox: true });
    x += w + 0.08;
  }
  s.addText(String(page), { x: 8.4, y, w: 0.5, h, margin: 0, align: 'right', fontFace: SANS, fontSize: 7.5, color: C.faint, valign: 'middle', isTextBox: true });
}
// image fitted inside a white frame (contain)
function figure(s, file, ar, x, y, w, h, caption) {
  card(s, x, y, w, h);
  const pad = 0.14, fw = w - 2 * pad, fh = h - 2 * pad;
  let iw = fw, ih = fw / ar; if (ih > fh) { ih = fh; iw = fh * ar; }
  s.addImage({ path: path.join(DECK, 'public', file), x: x + pad + (fw - iw) / 2, y: y + pad + (fh - ih) / 2, w: iw, h: ih });
  if (caption) s.addText(caption, { x, y: y + h + 0.05, w, h: 0.32, margin: 0, fontFace: SANS, fontSize: 6.5, color: C.muted, valign: 'top', isTextBox: true });
}
function storySlide(pres, i, o) {
  const s = pres.addSlide();
  s.background = { path: path.join(DECK, 'public/art', o.art + '.png') };
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: '0C0C12', transparency: 55 }, line: { width: 0, color: '0C0C12' } });
  s.addShape('rect', { x: 0, y: 0, w: 5.9, h: H, fill: { color: '0C0C12', transparency: 25 }, line: { width: 0, color: '0C0C12' } });
  const acc = ACC[o.accent];
  const two = o.story.length > 22, y0 = two ? 1.1 : 1.45, ya = y0 + 0.32 + (two ? 1.17 : 0.62);
  s.addText(o.kicker.toUpperCase(), { x: MX + 0.1, y: y0, w: 5, h: 0.25, margin: 0, fontFace: SANS, fontSize: 8.5, color: acc.light, charSpacing: 4, bold: true, isTextBox: true });
  s.addText(o.story, { x: MX + 0.1, y: y0 + 0.3, w: 5.2, h: two ? 1.15 : 0.6, margin: 0, fontFace: SERIF, fontSize: 32, color: 'FFFFFF', valign: 'top', isTextBox: true });
  s.addText([{ text: o.author, options: { italic: true, fontFace: SERIF, fontSize: 15, color: 'E9E3D6' } }, { text: '  \u00B7  ' + o.year, options: { fontFace: SANS, fontSize: 10, color: 'BDB6A8' } }],
    { x: MX + 0.1, y: ya, w: 5, h: 0.32, margin: 0, isTextBox: true });
  body(s, o.text, MX + 0.1, ya + 0.5, 5.0, 1.0, { size: 11, color: 'DDD7CB', ls: 1.15 });
  body(s, o.style, MX + 0.1, ya + 1.55, 5.0, 0.55, { size: 11, color: 'FFFFFF' });
  s.addNotes(NOTES[i]);
  return s;
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'The Language of Narrative';
  pres.subject = "Ribó's Prose Fiction, ch. 6, applied to Fitzgerald, Gilman, and Chopin";
  pres.author = 'Introduction to Literature';
  const R = ACC.ribo, F = ACC.fitz, G = ACC.gilman, K = ACC.chopin;
  let s;

  // 1 ── Cover triptych
  s = pres.addSlide(); bg(s, C.night);
  ['diamond', 'wallpaper', 'night'].forEach((a, i) => s.addImage({ path: path.join(DECK, 'public/art', a + '.png'), x: i * 3.3467, y: 0, w: 3.3067, h: H, sizing: { type: 'cover', w: 3.3067, h: H } }));
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: '0E0D14', transparency: 45 }, line: { width: 0, color: '0E0D14' } });
  s.addShape('rect', { x: 0, y: 2.6, w: W, h: 3.03, fill: { color: '0E0D14', transparency: 12 }, line: { width: 0, color: '0E0D14' } });
  s.addText('A LECTURE IN THE SEMIOTICS OF NARRATIVE', { x: MX + 0.1, y: 2.85, w: 8, h: 0.25, margin: 0, fontFace: SANS, fontSize: 9, bold: true, color: R.light, charSpacing: 4, isTextBox: true });
  s.addText('The Language of Narrative', { x: MX + 0.1, y: 3.12, w: 9, h: 0.75, margin: 0, fontFace: SERIF, fontSize: 38, color: 'FFFFFF', isTextBox: true });
  s.addText('Style, foregrounding, figure, and symbol in Fitzgerald’s “The Diamond as Big as the Ritz,” Gilman’s “The Yellow Wallpaper,” and Chopin’s “A Respectable Woman”',
    { x: MX + 0.1, y: 3.92, w: 7.6, h: 0.7, margin: 0, fontFace: SERIF, italic: true, fontSize: 14, color: 'ECE6DA', isTextBox: true });
  s.addText([{ text: 'AFTER IGNASI RIBÓ, ', options: {} }, { text: 'Prose Fiction', options: { italic: true, fontFace: SERIF } }, { text: ', CH. 6 · “LANGUAGE”     TEXTS: ', options: {} }, { text: 'Gerb’s Anthology of Short Stories', options: { italic: true, fontFace: SERIF } }],
    { x: MX + 0.1, y: 4.85, w: 9, h: 0.25, margin: 0, fontFace: SANS, fontSize: 8, color: 'BDB6A8', charSpacing: 1, isTextBox: true });
  s.addNotes(NOTES[0]);

  // 2 ── Roadmap
  s = pres.addSlide(); bg(s); eyebrow(s, 'Roadmap', R); title(s, 'Four movements, one question');
  s.addText('How does the form of the discourse, its style, make each storyworld exist, and mean?', { x: MX, y: 1.08, w: 9, h: 0.35, margin: 0, fontFace: SERIF, fontSize: 15, italic: true, color: C.muted, isTextBox: true });
  const road = [
    ['I · The toolkit', 'Ribó’s semiotic model, then chapter 6: style, foregrounding, figures of speech, symbolism, translation.', R, '/ribo/fig6-2-flaubert-draft.jpg'],
    ['II · Excess', '“The Diamond as Big as the Ritz” (1922): hyperbole, irony, and a mountain made of one word.', F, '/art/diamond.png'],
    ['III · Pattern', '“The Yellow Wallpaper” (1892): a first-person voice in which a room becomes a figure, then a symbol.', G, '/art/wallpaper.png'],
    ['IV · Restraint', '“A Respectable Woman” (1894): what a style withholds, and what a single adjective can hold.', K, '/art/night.png'],
  ];
  road.forEach(([h, t, a, img], i) => {
    const x = MX + i * 2.3, y = 1.6, w = 2.12, hh = 2.6;
    card(s, x, y, w, hh);
    s.addImage({ path: path.join(DECK, 'public', img), x: x + 0.13, y: y + 0.13, w: w - 0.26, h: 0.8, sizing: { type: 'cover', w: w - 0.26, h: 0.8 } });
    label(s, h, x + 0.15, y + 1.08, w - 0.3, a);
    body(s, t, x + 0.15, y + 1.38, w - 0.3, 1.4, { size: 10.5 });
  });
  body(s, 'Along the bottom of every slide, the chapter rail shows which of Ribó’s chapters are in play. Chapter 6 is always the anchor.', MX, 4.7, 9, 0.3, { size: 9.5, color: C.muted });
  await rail(s, [1, 2, 3, 4, 5, 6], R, 2); s.addNotes(NOTES[1]);

  // 3 ── Semiotic model
  s = pres.addSlide(); bg(s);
  figure(s, '/ribo/fig1-5-semiotic-model.png', 756 / 333, MX, 0.4, 4.3, 4.3, 'Fig. 1.5, “Semiotic model of narrative,” by Ignasi Ribó, CC BY 4.0 (Ribó, sec. 1.4).');
  s.addText('RIBÓ, CH. 1 · STORY AND DISCOURSE', { x: 5.1, y: 0.4, w: 4.4, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: R.a, charSpacing: 3, isTextBox: true });
  title(s, 'Where language lives in a narrative', { x: 5.1, y: 0.65, w: 4.4, h: 0.9, size: 24 });
  body(s, 'Ribó separates the **story**, “what the narrator tells the narratee,” from the **discourse**, “how the narrative is conveyed from the implied author to the implied reader” {{Ribó, ch. 1}}.', 5.1, 1.55, 4.4, 1.1, { size: 11.5 });
  card(s, 5.1, 2.75, 4.4, 1.2, { fill: R.soft, flat: true });
  label(s, 'The key move of chapter 6', 5.25, 2.87, 4.1, R);
  body(s, 'Discourse has a content (the story) *and* a form. “The form of discourse is what we generally call its style” {{Ribó, sec. 6.1}}.', 5.25, 3.15, 4.1, 0.75, { size: 11 });
  body(s, 'So when we analyze language, we are analyzing the outer arrow of this diagram: the implied author’s choices, sentence by sentence.', 5.1, 4.1, 4.4, 0.6, { size: 9.5, color: C.muted });
  await rail(s, [1, 6], R, 3); s.addNotes(NOTES[2]);

  // 4 ── Storyworld
  s = pres.addSlide(); bg(s); eyebrow(s, 'Ribó, chs. 2–4 & 6.2 · The storyworld', R);
  title(s, 'Nothing in the storyworld exists except in words', { w: 5.4, h: 0.9, size: 24 });
  passage(s, MX, 1.45, 5.4, 1.2, 'The existents of the storyworld (events, environments, and characters) only exist insofar as narrative discourse succeeds in representing them in the imagination of the reader.', 'Ribó, sec. 6.2', R, 11.5);
  [['Events', 'emplotted in ch. 2: order, conflict, suspense, surprise'], ['Environments', 'arranged as setting in ch. 3: topography and atmosphere'], ['Characters', 'individuated in ch. 4: speech, action, looks, dialogue']]
    .forEach(([h, t], i) => tcard(s, MX + i * 1.84, 2.85, 1.72, 1.2, h, t, R, { size: 9.5 }));
  body(s, 'Language is therefore “burdened, not only with conveying meaning, but also with recreating the whole context where meaning can emerge” {{Ribó, sec. 6.2}}.', MX, 4.25, 5.4, 0.6, { size: 9.5, color: C.muted });
  figure(s, '/ribo/fig3-1-storyworld.png', 591 / 392, 6.2, 0.45, 3.3, 4.2, 'Fig. 3.1, “Relationships between existents in the storyworld,” by Ignasi Ribó, CC BY 4.0.');
  await rail(s, [2, 3, 4, 6], R, 4); s.addNotes(NOTES[3]);

  // 5 ── Toolkit
  s = pres.addSlide(); bg(s); eyebrow(s, 'Ribó, ch. 6 · The toolkit', R); title(s, 'Five instruments for reading language');
  [['6.1', 'Style', '“A characteristic set of linguistic features associated with a text,” attributable to the implied author.'],
   ['6.2', 'Foregrounding', 'Features that deviate from the “norm” of everyday language and draw attention to themselves.'],
   ['6.3', 'Figures', 'Metaphor, simile, personification, metonymy, synecdoche, hyperbole, oxymoron.'],
   ['6.4', 'Symbol', 'An existent that “represents something else by virtue of an arbitrary association”; sustained, it becomes allegory.'],
   ['6.5', 'Translation', 'Every translation is an interpretation; style resists it most where foregrounding is highest.']]
    .forEach(([n, h, t], i) => {
      const x = MX + i * 1.82, y = 1.3, w = 1.7, hh = 2.9;
      card(s, x, y, w, hh);
      s.addText(n, { x: x + 0.15, y: y + 0.12, w: w - 0.3, h: 0.6, margin: 0, fontFace: SERIF, fontSize: 30, color: R.a, isTextBox: true });
      label(s, h, x + 0.15, y + 0.8, w - 0.3, R);
      body(s, t, x + 0.15, y + 1.1, w - 0.3, 1.9, { size: 10 });
    });
  body(s, 'All definitions: {{Ribó, secs. 6.1–6.5}}. Ribó draws on rhetoric and on modern *stylistics*, the application of linguistics to literary texts.', MX, 4.6, 9, 0.3, { size: 9.5, color: C.muted });
  await rail(s, [6], R, 5); s.addNotes(NOTES[4]);

  // 6 ── Style
  s = pres.addSlide(); bg(s);
  figure(s, '/ribo/fig6-2-flaubert-draft.jpg', 355 / 459, MX, 0.4, 3.4, 4.3, 'Fig. 6.2, facsimile of the first draft of Flaubert’s “A Simple Heart” (1910 ed.), public domain, in Ribó, sec. 6.1.');
  s.addText('RIBÓ, SEC. 6.1 · STYLE', { x: 4.25, y: 0.4, w: 5.2, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: R.a, charSpacing: 3, isTextBox: true });
  title(s, 'Style is a sum of choices', { x: 4.25, y: 0.65, w: 5.25, size: 24 });
  body(s, 'Style “generally results from multiple and complex decisions about rhythm, phonological patterns, syntactic structure, lexical choice, collocation, paragraph organisation” {{Ribó, sec. 6.2}}.', 4.25, 1.25, 5.25, 0.9, { size: 11 });
  tcard(s, 4.25, 2.2, 2.55, 1.05, 'Attributed to…', 'the implied author (from the text alone), the real author, a genre, a period, or a culture.', R, { size: 9.5 });
  card(s, 6.95, 2.2, 2.55, 1.05); label(s, 'Our three styles', 7.1, 2.32, 2.3, R);
  s.addText([{ text: 'lavish', options: { color: F.a, bold: true } }, { text: '  ·  ', options: { color: C.muted } }, { text: 'fractured', options: { color: G.a, bold: true } }, { text: '  ·  ', options: { color: C.muted } }, { text: 'restrained', options: { color: K.a, bold: true } }],
    { x: 7.1, y: 2.65, w: 2.3, h: 0.3, margin: 0, fontFace: SANS, fontSize: 11, isTextBox: true });
  passage(s, 4.25, 3.45, 5.25, 1.3, 'Human language is like a cracked pot on which we tap crude melodies to make bears dance, while we long to melt the stars.', 'Flaubert qtd. in Ribó, sec. 6.1', R, 12);
  await rail(s, [6], R, 6); s.addNotes(NOTES[5]);

  // 7 ── Foregrounding
  s = pres.addSlide(); bg(s); eyebrow(s, 'Ribó, sec. 6.2 · Foregrounding', R); title(s, 'Background and foreground');
  card(s, MX, 1.3, 4.4, 1.9); label(s, 'The “norm”', MX + 0.18, 1.45, 4, { a: C.muted });
  body(s, 'The silence was interrupted by the buzzing of bees around the plants.', MX + 0.18, 1.78, 4.05, 0.8, { font: SERIF, size: 15 });
  body(s, 'Ribó’s plain paraphrase: economical, efficient, transparent {{sec. 6.2}}.', MX + 0.18, 2.72, 4.05, 0.4, { size: 9.5, color: C.muted });
  card(s, 5.1, 1.3, 4.4, 1.9); label(s, 'Foregrounded (Wilde, Dorian Gray)', 5.28, 1.45, 4, R);
  body(s, 'The sullen murmur of the bees shouldering their way through the long unmown grass … seemed to make the stillness more oppressive.', 5.28, 1.78, 4.05, 0.9, { font: SERIF, size: 13, italic: true });
  body(s, 'Qtd. in Ribó, sec. 6.2. Adjectives, personification, sound.', 5.28, 2.72, 4.05, 0.4, { size: 9.5, color: C.muted });
  card(s, MX, 3.45, 9, 1.05, { fill: R.soft, flat: true });
  s.addImage({ data: await icon('warning-circle', R.a), x: MX + 0.25, y: 3.72, w: 0.5, h: 0.5 });
  body(s, '**Ribó’s caution:** there is no “style-free norm.” Even the plain sentence alliterates (*buzzing of bees*). Foregrounding is a matter of **degree**, and it does work: it builds descriptions, characters, and atmosphere.', MX + 1.0, 3.6, 7.8, 0.8, { size: 11, valign: 'middle' });
  await rail(s, [3, 6], R, 7); s.addNotes(NOTES[6]);

  // 8 ── Seven figures
  s = pres.addSlide(); bg(s); eyebrow(s, 'Ribó, sec. 6.3 · Figures of speech', R); title(s, 'Ribó’s seven figures, with his own examples');
  const tropes = [
    ['Metaphor', 'mouth', 'fountain', '“Her mouth was a fountain of delight.” (Chopin, “The Storm”)'],
    ['Simile', 'hills', 'breasts', '“round and soft as breasts” (Steinbeck)'],
    ['Personification', 'house', 'person', '“wore its steep, gabled roof pulled over its ears” (Roy)'],
    ['Metonymy', 'self', 'skin', '“put your skin on the table” (Céline)'],
    ['Synecdoche', 'legislators', 'Georgia', '“Georgia waited till after Christmas” (Mitchell)'],
    ['Hyperbole', null, null, '“The world was so recent that many things lacked names” (García Márquez)'],
    ['Oxymoron', null, null, '“everybody is identical in their secret … belief” that they are different (Wallace)'],
  ];
  tropes.forEach(([n, t, v, e], i) => trope(s, MX + (i % 4) * 2.28, 1.25 + Math.floor(i / 4) * 1.55, 2.16, 1.42, n, t, v, e, R));
  tcard(s, MX + 3 * 2.28, 1.25 + 1.55, 2.16, 1.42, 'Beyond the list', '**Dead** tropes (“fallen in love”), **clichés** (“teeth like pearls”), and **conceits**, figures too far-fetched to work.', R, { fill: R.soft, flat: true, size: 9.5 });
  body(s, 'Examples as quoted in {{Ribó, sec. 6.3}}. Figurative language is “the use of language in ways that deviate from the literal meaning of words and sentences.”', MX, 4.45, 9, 0.5, { size: 9.5, color: C.muted });
  await rail(s, [6], R, 8); s.addNotes(NOTES[7]);

  // 9 ── Symbol
  s = pres.addSlide(); bg(s);
  figure(s, '/ribo/fig6-3-animal-farm.png', 354 / 459, MX, 0.4, 3.4, 4.3, 'Fig. 6.3, pig dressed as a capitalist, illustrating Orwell’s Animal Farm, by Carl Glover, CC BY 2.0, in Ribó, sec. 6.4.');
  s.addText('RIBÓ, SEC. 6.4 · SYMBOLISM AND ALLEGORY', { x: 4.25, y: 0.4, w: 5.2, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: R.a, charSpacing: 3, isTextBox: true });
  title(s, 'When an existent stands for something else', { x: 4.25, y: 0.65, w: 5.25, h: 0.85, size: 23 });
  tcard(s, 4.25, 1.55, 5.25, 0.85, 'Symbol', '“Anything that represents something else by virtue of an arbitrary association”; any existent can become one.', R, { size: 10 });
  tcard(s, 4.25, 2.55, 2.55, 0.95, 'Internal', 'refers to other existents of the story (Harry’s scar).', R, { size: 10 });
  tcard(s, 6.95, 2.55, 2.55, 0.95, 'External', 'refers to discourse or the reader’s world (the name *Dumbledore*).', R, { size: 10 });
  tcard(s, 4.25, 3.65, 5.25, 1.1, 'Allegory · Allegoresis', 'Allegory, “to speak of something else,” is symbolism sustained across a whole story; **allegoresis** is “the act of reading any story as allegory” {{Ribó, sec. 6.4}}. Compare ch. 3’s **symbolic setting** {{sec. 3.3}}.', R, { fill: R.soft, flat: true, size: 10 });
  await rail(s, [3, 6], R, 9); s.addNotes(NOTES[8]);

  // 10 ── Fitzgerald divider
  storySlide(pres, 9, { art: 'diamond', accent: 'fitz', kicker: 'Movement II · Excess', story: 'The Diamond as Big as the Ritz', author: 'F. Scott Fitzgerald', year: '1922',
    text: 'A fantasy-satire in twelve chapters. John T. Unger of Hades visits the secret Montana estate of Braddock Washington, owner of a mountain that is **one flawless diamond**, and learns that no guest is allowed to leave alive.',
    style: '**Style:** lavish, ornamental, relentlessly foregrounded, and ironic.' });

  // 11 ── Sunset
  s = pres.addSlide(); bg(s);
  s.addImage({ path: path.join(DECK, 'public/art/diamond.png'), x: 9.45, y: 0, w: 0.55, h: H, sizing: { type: 'cover', w: 0.55, h: H } });
  eyebrow(s, 'Fitzgerald · Foregrounded setting', F); title(s, 'A sunset that is already a wound');
  passage(s, MX, 1.25, 8.7, 1.2, 'The Montana sunset lay between two mountains like ==a gigantic bruise== from which ==dark arteries== spread themselves over ==a poisoned sky==.', 'Fitzgerald 153', F, 15);
  trope(s, MX, 2.65, 2.8, 1.0, 'Simile', 'sunset', 'bruise', '“like a gigantic bruise”', F);
  trope(s, MX + 2.95, 2.65, 2.8, 1.0, 'Metaphor', 'clouds', 'arteries', '“dark arteries”', F);
  trope(s, MX + 5.9, 2.65, 2.8, 1.0, 'Personification', 'sky', 'a poisoned body', '“a poisoned sky”', F);
  body(s, 'Ribó’s **symbolic setting** {{sec. 3.3}}: before we see the diamond, the landscape is already *injured*. The village of Fish “sucked a lean milk from the almost literally bare rock” {{Fitzgerald 153}}. Foregrounding here builds **atmosphere**, and foreshadows {{Ribó, secs. 3.2, 2.5}}.', MX, 3.85, 8.7, 0.9, { size: 11 });
  await rail(s, [3, 6], F, 11); s.addNotes(NOTES[10]);

  // 12 ── Names
  s = pres.addSlide(); bg(s); eyebrow(s, 'Fitzgerald · External symbols', F); title(s, 'Names that speak of something else');
  const names = [
    ['Hades', 'John’s hometown, where “the earnest worship of and respect for riches” is “the first article of its creed” {{Fitzgerald 156}}. Every host’s joke: “Pretty hot down there?” {{151–52}}.'],
    ['St. Midas’s', 'The school named for the king whose touch turned everything, even food, to gold {{151}}.'],
    ['Washington', '“A direct descendant of George Washington, and Lord Baltimore” {{163}}: the founding name on a secret kingdom “where the United States ends” {{157}}.'],
    ['Fish', 'Twelve “sombre and inexplicable souls” watching a train as a “congregation”: a parody of the twelve apostles {{153–54}}.'],
    ['The Ritz', 'The measuring stick of the title: the diamond’s size is expressed in the unit of a luxury hotel {{153}}.'],
  ];
  names.forEach(([h, t], i) => tcard(s, MX + (i % 3) * 3.02, 1.25 + Math.floor(i / 3) * 1.82, 2.9, 1.68, h, t, F, { size: 10 }));
  tcard(s, MX + 2 * 3.02, 1.25 + 1.82, 2.9, 1.68, 'Ribó’s term', '**External symbols** point beyond the storyworld to the reader’s lifeworld (myth, scripture, national history) {{Ribó, sec. 6.4}}.', F, { fill: F.soft, flat: true, size: 10 });
  await rail(s, [1, 3, 6], F, 12); s.addNotes(NOTES[11]);

  // 13 ── Hyperbole
  s = pres.addSlide(); bg(s); eyebrow(s, 'Fitzgerald · Hyperbole and oxymoron', F); title(s, 'The master trope is exaggeration');
  passage(s, MX, 1.25, 4.9, 0.85, 'My father has a diamond ==bigger than the Ritz-Carlton Hotel==.', 'Fitzgerald 153', F, 12);
  passage(s, MX, 2.22, 4.9, 0.85, 'One diamond, ==one cubic mile without a flaw==.', 'Fitzgerald 161', F, 12);
  passage(s, MX, 3.19, 4.9, 1.15, 'a room that was like ==a platonic conception of the ultimate prison== … lined with an unbroken mass of diamonds', 'Fitzgerald 159', F, 12);
  trope(s, 5.6, 1.25, 3.9, 0.95, 'Hyperbole', null, null, 'The title’s hyperbole is literal inside the storyworld: fantasy lets the exaggeration come true.', F);
  trope(s, 5.6, 2.32, 3.9, 0.95, 'Oxymoron', null, null, '“A chaste and consistent selfishness ran like a pattern through their every idea” (178).', F);
  tcard(s, 5.6, 3.39, 3.9, 0.95, null, 'Luxury described as **prison**; selfishness described as **virtue**. The figures quietly judge what the characters admire {{Ribó, secs. 6.3, 4.4}}.', F, { fill: F.soft, flat: true, size: 10.5 });
  await rail(s, [4, 6], F, 13); s.addNotes(NOTES[12]);

  // 14 ── Irony
  s = pres.addSlide(); bg(s); eyebrow(s, 'Fitzgerald · The ironic narrator', F); title(s, 'Irony: the language of property');
  passage(s, MX, 1.25, 4.4, 1.2, 'But ==very few other murders== stained these ==happy years of progress and expansion==.', 'Fitzgerald 166', F, 13);
  passage(s, MX, 2.6, 4.4, 1.45, 'There go fifty thousand dollars’ worth of slaves … ==at pre-war prices==. So few Americans have any respect for property.', 'Fitzgerald 187', F, 13);
  tcard(s, 5.1, 1.25, 4.4, 1.0, 'Ribó’s ironic narrator', 'A statement that “means something very different, even the opposite, to what is being stated,” at the characters’ expense {{Ribó, sec. 5.5}}.', F, { size: 9.5 });
  tcard(s, 5.1, 2.35, 4.4, 0.95, 'How it works here', 'Euphemism and bookkeeping diction (“progress,” “expansion,” “property,” “prices”) expose a family that converts human lives into assets.', F, { size: 9.5 });
  tcard(s, 5.1, 3.4, 4.4, 1.3, 'Reading critically', 'The story’s own portrayal of the enslaved characters relies on racist caricature and slurs of its era. Its satire targets the Washingtons, yet it does not grant those characters voice or individuation {{Ribó, sec. 4.2}}.', F, { fill: F.soft, flat: true, size: 9.5 });
  await rail(s, [5, 6], F, 14); s.addNotes(NOTES[13]);

  // 15 ── Bribe
  s = pres.addSlide(); bg(s); eyebrow(s, 'Fitzgerald · Climax as allegory', F); title(s, 'A bribe offered to God', { w: 5.2 });
  passage(s, MX, 1.25, 5.2, 1.55, '==Prometheus Enriched== was calling to witness forgotten sacrifices … God had His price, of course. God was made in man’s image, so it had been said: ==He must have His price==.', 'Fitzgerald 191–92', F, 12);
  tcard(s, MX, 3.0, 2.52, 1.7, 'Allegorical climax', 'The plot’s peak (Freytag’s apex) is a scene of pure symbolism: wealth attempting to purchase the universe itself {{Ribó, secs. 2.4, 6.4}}.', F, { size: 9.5 });
  tcard(s, MX + 2.68, 3.0, 2.52, 1.7, 'Nature answers', '“The leaves laughed in the sun” {{Fitzgerald 192}}. Personification delivers the verdict: “God had refused to accept the bribe” {{193}}.', F, { size: 9.5 });
  figure(s, '/ribo/fig2-9-freytag.jpg', 650 / 243, 6.0, 1.25, 3.5, 3.1, 'Fig. 2.9, “Schema of Freytag’s pyramid,” by Ignasi Ribó, CC BY 4.0 (Ribó, sec. 2.4).');
  s.addText('▲ the bribe', { x: 7.35, y: 1.55, w: 0.9, h: 0.25, margin: 0, align: 'center', fontFace: SANS, fontSize: 8, bold: true, color: F.a, isTextBox: true });
  await rail(s, [2, 6], F, 15); s.addNotes(NOTES[14]);

  // 16 ── Diamonds → stars
  s = pres.addSlide(); bg(s); eyebrow(s, 'Fitzgerald · A symbol reverses', F); title(s, 'Diamonds, rhinestones, stars');
  [['1 · Rhinestones', 'Kismine grabs “the wrong drawer.” “I think I like these better. I’m a little tired of diamonds” {{Fitzgerald 195}}. The symbol of value is revealed as imitation.'],
   ['2 · Stars', '“I always thought of them as great big diamonds that belonged to some one. Now they frighten me” {{196}}. Metaphor inverted: nature had been read as property.'],
   ['3 · Youth', '“Everybody’s youth is a dream, a form of chemical madness” {{196}}; love is “divine drunkenness”; all that remains is “the shabby gift of disillusion” {{197}}.']]
    .forEach(([h, t], i) => tcard(s, MX + i * 3.02, 1.3, 2.9, 1.95, h, t, F, { size: 10.5 }));
  body(s, 'The diamond is an **internal** symbol whose meaning collapses at the end: from absolute value, to paste, to a “dream” {{Ribó, sec. 6.4}}.', MX, 3.6, 9, 0.8, { font: SERIF, size: 16 });
  await rail(s, [2, 6], F, 16); s.addNotes(NOTES[15]);

  // 17 ── Gilman divider
  storySlide(pres, 16, { art: 'wallpaper', accent: 'gilman', kicker: 'Movement III · Pattern', story: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman', year: '1892',
    text: 'A woman confined by her physician-husband to a rented nursery for a “rest cure” keeps a secret journal, and reads the room’s wallpaper until she finds a woman trapped behind it.',
    style: '**Style:** first-person, diaristic, fractured; figurative energy flows into one object.' });

  // 18 ── Voice
  s = pres.addSlide(); bg(s);
  figure(s, '/ribo/fig5-5-gogol-madman.jpg', 354 / 504, MX, 0.4, 3.2, 4.3, 'Fig. 5.5, Ilya Repin’s illustration of Gogol’s “Diary of a Madman,” public domain, in Ribó, sec. 5.5.');
  s.addText('GILMAN · VOICE AS SYMPTOM', { x: 4.05, y: 0.4, w: 5.4, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: G.a, charSpacing: 3, isTextBox: true });
  title(s, 'A style that interrupts itself', { x: 4.05, y: 0.65, w: 5.45, size: 24 });
  passage(s, 4.05, 1.3, 5.45, 1.3, 'perhaps—(I would not say it to a living soul, of course, but ==this is dead paper== and a great relief to my mind)—perhaps that is one reason I do not get well faster.', 'Gilman 198', G, 11.5);
  tcard(s, 4.05, 2.75, 2.65, 1.0, 'Syntax', 'Dashes, parentheses, exclamations, and one-line paragraphs; the refrain “what is one to do?” {{198–99}}.', G, { size: 9.5 });
  tcard(s, 6.85, 2.75, 2.65, 1.0, 'Narration', 'First person, inward focalisation, simultaneous telling in diary entries {{Ribó, secs. 5.2–5.3}}.', G, { size: 9.5 });
  tcard(s, 4.05, 3.9, 5.45, 0.85, null, 'Like Gogol’s madman, Ribó’s example, she becomes an **unreliable narrator**: the implied author communicates “at the expense of the narrator” {{Ribó, sec. 5.5}}. Her style is evidence we read *past* her.', G, { fill: G.soft, flat: true, size: 9.5 });
  await rail(s, [5, 6], G, 18); s.addNotes(NOTES[17]);

  // 19 ── Personification
  s = pres.addSlide(); bg(s);
  s.addImage({ path: path.join(DECK, 'public/art/wallpaper.png'), x: 9.45, y: 0, w: 0.55, h: H, sizing: { type: 'cover', w: 0.55, h: H } });
  eyebrow(s, 'Gilman · Personification', G); title(s, 'The wallpaper becomes a character');
  [['Personification', 'pattern', 'sinner / suicide', '“committing every artistic sin” … curves “suddenly commit suicide” (Gilman 200)'],
   ['Simile + personif.', 'pattern', 'broken body', '“lolls like a broken neck and two bulbous eyes stare at you upside-down” (203)'],
   ['Personification', 'pattern', 'assailant', '“It slaps you in the face, knocks you down, and tramples upon you” (209)'],
   ['Simile', 'pattern', 'fungus', '“a toadstool in joints, an interminable string of toadstools” (209)'],
   ['Metaphor (synaesthesia)', 'odor', 'color', '“A yellow smell.” (211)'],
   ['Personification', 'smell', 'stalker', '“skulking in the parlor, hiding in the hall, lying in wait for me on the stairs” (211)']]
    .forEach(([n, t, v, e], i) => trope(s, MX + (i % 3) * 2.95, 1.25 + Math.floor(i / 3) * 1.4, 2.83, 1.28, n, t, v, e, G));
  body(s, 'Foregrounded **description** becomes **mental setting**: an environment “presented from the perspective of one of the characters, as a kind of inner experience” {{Ribó, sec. 3.3}}. The figures chart her mind.', MX, 4.15, 8.7, 0.7, { size: 10.5 });
  await rail(s, [3, 6], G, 19); s.addNotes(NOTES[18]);

  // 20 ── Bars
  s = pres.addSlide(); bg(s); eyebrow(s, 'Gilman · From figure to symbol to allegory', G); title(s, 'The pattern becomes bars, and the bars hold a woman');
  [['Setting', 'A nursery with “windows … barred,” “rings and things in the walls,” a bed “nailed down” {{Gilman 200, 205}}.'],
   ['Figure', 'By moonlight the outside pattern “becomes bars!” {{209}}'],
   ['Symbol', '“like a woman stooping down and creeping about behind that pattern” {{207}}; then “a great many women” {{212}}.'],
   ['Identity', '“I wonder if they all come out of that wallpaper **as I did**?” {{215}} “I’ve got out at last” {{216}}.']]
    .forEach(([h, t], i) => {
      const x = MX + i * 2.28, y = 1.3, w = 2.16, hh = 2.25;
      card(s, x, y, w, hh);
      s.addText(String(i + 1), { x: x + 0.15, y: y + 0.1, w: 0.6, h: 0.5, margin: 0, fontFace: SERIF, fontSize: 28, color: G.a, isTextBox: true });
      label(s, h, x + 0.15, y + 0.65, w - 0.3, G);
      body(s, t, x + 0.15, y + 0.93, w - 0.3, hh - 1.0, { size: 10 });
      if (i < 3) s.addText('›', { x: x + w - 0.02, y: y + 0.9, w: 0.16, h: 0.4, margin: 0, align: 'center', fontFace: SANS, fontSize: 18, color: G.a, isTextBox: true });
    });
  tcard(s, MX, 3.75, 9, 0.95, null, '**Allegoresis** {{Ribó, sec. 6.4}}: readers take the paper as an allegory of domestic and medical confinement. The simile’s “like” disappears, and tenor and vehicle merge as the narrator merges with the woman she sees.', G, { fill: G.soft, flat: true, size: 10.5 });
  await rail(s, [2, 3, 6], G, 20); s.addNotes(NOTES[19]);

  // 21 ── John
  s = pres.addSlide(); bg(s); eyebrow(s, 'Gilman · Dialogue and characterisation', G); title(s, 'John distrusts figures');
  passage(s, MX, 1.25, 4.2, 1.55, 'He has no patience with faith, an intense horror of superstition, and he scoffs openly at any talk of things not to be felt and seen and ==put down in figures==.', 'Gilman 198', G, 12);
  tcard(s, MX, 2.95, 4.2, 1.0, 'A pun on “figures”', 'Numbers, and figures of speech. The physician’s literal register cannot hear his wife’s figurative one.', G, { size: 10 });
  label(s, 'His diction: diminutives and certainty', 4.95, 1.28, 4.5, G);
  tcard(s, 4.95, 1.55, 4.55, 0.78, null, '“a blessed **little** goose” {{202}}  ·  “What is it, **little** girl?” {{207}}  ·  “Bless her **little** heart!” {{208}}', G, { size: 10 });
  tcard(s, 4.95, 2.45, 4.55, 0.6, null, '“I am a doctor, dear, and I know.”  ·  “It is a **f**alse and **f**oolish **f**ancy.” {{208}}', G, { size: 10 });
  tcard(s, 4.95, 3.17, 4.55, 1.05, null, 'Ribó: dialogue contributes “both to emplotment and characterisation” {{sec. 4.5}}. John is characterized entirely through **speech**, which Ribó counts as a direct method {{sec. 4.4}}.', G, { fill: G.soft, flat: true, size: 10 });
  await rail(s, [4, 6], G, 21); s.addNotes(NOTES[20]);

  // 22 ── Chopin divider
  storySlide(pres, 21, { art: 'night', accent: 'chopin', kicker: 'Movement IV · Restraint', story: 'A Respectable Woman', author: 'Kate Chopin', year: '1894',
    text: 'On a Louisiana sugar plantation, Mrs. Baroda is unsettled by her husband’s reserved friend Gouvernail, and one night on a garden bench discovers a desire she does not act upon, until, perhaps, the final line.',
    style: '**Style:** economical, ironic, lightly figured; meaning gathers in one adjective.' });

  // 23 ── Bright points
  s = pres.addSlide(); bg(s);
  s.addImage({ path: path.join(DECK, 'public/art/night.png'), x: 9.45, y: 0, w: 0.55, h: H, sizing: { type: 'cover', w: 0.55, h: H } });
  eyebrow(s, 'Chopin · Low foregrounding, precise figures', K); title(s, 'A background style with a few bright points');
  trope(s, MX, 1.25, 4.2, 1.05, 'Personification', 'air', 'lover', 'the air “caressed him with its warm and scented velvety touch” (Chopin 218)', K);
  trope(s, MX, 2.42, 4.2, 1.05, 'Metonymy', 'Gouvernail', 'cigar', '“the approaching red point of a lighted cigar” (219)', K);
  trope(s, MX, 3.59, 4.2, 1.05, 'Metaphor', 'listening', 'drinking', '“only drinking in the tones of his voice” (220)', K);
  tcard(s, 4.85, 1.25, 4.4, 1.15, 'Symbolic whiteness', '“her white gown revealed her to him”; he brings “a filmy, white scarf” {{219}}: respectability made visible, and it is what gives her away.', K, { size: 9.5 });
  tcard(s, 4.85, 2.52, 4.4, 1.2, 'A borrowed voice', 'Gouvernail murmurs Whitman: “Night of south winds—night of the large few stars!” {{220}}, an apostrophe “not addressed to her,” yet heard by her.', K, { size: 9.5 });
  tcard(s, 4.85, 3.84, 4.4, 0.8, null, 'External narrator, **inward focalisation** on Mrs. Baroda, who does not understand herself {{Ribó, sec. 5.3}}.', K, { fill: K.soft, flat: true, size: 9.5 });
  await rail(s, [3, 5, 6], K, 23); s.addNotes(NOTES[22]);

  // 24 ── Respectable
  s = pres.addSlide(); bg(s); eyebrow(s, 'Chopin · The title as symbol, the ending as surprise', K); title(s, 'What “respectable” holds back');
  passage(s, MX, 1.2, 5.0, 1.1, 'She wanted to draw close to him and whisper against his cheek—she did not care what—as she might have done ==if she had not been a respectable woman==.', 'Chopin 220', K, 11);
  passage(s, MX, 2.4, 5.0, 1.1, 'Beside being ==a respectable woman== she was a very sensible one; and she knew there are some battles in life which a human being must fight alone.', 'Chopin 220–21', K, 11);
  passage(s, MX, 3.6, 5.0, 1.1, '“Oh,” she told him, laughingly, … “==I have overcome everything! you will see.== This time I shall be very nice to him.”', 'Chopin 221', K, 11);
  tcard(s, 5.7, 1.2, 3.8, 1.2, 'Repetition and irony', 'The title phrase returns as a social code that her body and syntax push against: “The stronger the impulse grew … the further … did she draw away” {{220}}.', K, { size: 9.5 });
  tcard(s, 5.7, 2.5, 3.8, 0.95, 'Surprise', 'An “effect of the reader’s ignorance” {{Ribó, sec. 2.5}}. Is “overcome” a victory over desire, or over respectability?', K, { size: 9.5 });
  tcard(s, 5.7, 3.55, 3.8, 1.15, 'The withheld metaphor', 'Ribó’s example of metaphor is Chopin’s own “Her mouth was a fountain of delight” {{sec. 6.3}}. That figure is released in “The Storm”; here it is kept back.', K, { fill: K.soft, flat: true, size: 9.5 });
  await rail(s, [2, 5, 6], K, 24); s.addNotes(NOTES[23]);

  // 25 ── Matrix (native table)
  s = pres.addSlide(); bg(s); eyebrow(s, 'Synthesis · Comparative matrix', R); title(s, 'Three styles, read with Ribó');
  const hdr = (t, fill) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: fill }, fontSize: 8.5, fontFace: SANS, charSpacing: 1 } });
  const lens = t => ({ text: t, options: { bold: true, color: C.muted, fontSize: 8, fontFace: SANS, fill: { color: C.paper } } });
  const cell = t => ({ text: t, options: { color: C.ink, fontSize: 10.5, fontFace: SANS, fill: { color: 'FFFFFF' } } });
  const rows = [
    [lens('RIBÓ’S LENS'), hdr('THE DIAMOND AS BIG AS THE RITZ', F.a), hdr('THE YELLOW WALLPAPER', ACC.gilman.bar), hdr('A RESPECTABLE WOMAN', K.a)],
    ['STYLE (6.1)', 'Lavish, ornamental, satiric', 'Fractured, diaristic, exclamatory', 'Economical, ironic, poised'],
    ['FOREGROUNDING (6.2)', 'Pervasive; description as spectacle', 'Concentrated on one object', 'Low; a few bright points'],
    ['SIGNATURE FIGURE (6.3)', 'Hyperbole, oxymoron', 'Personification, simile into identity', 'Metonymy, withheld metaphor'],
    ['CENTRAL SYMBOL (6.4)', 'Diamond → rhinestones → stars', 'Wallpaper → bars → woman', '“Respectable” / whiteness'],
    ['SETTING (CH. 3)', 'Symbolic: a secret kingdom', 'Mental and symbolic: the nursery', 'Atmospheric: plantation night'],
    ['NARRATION (CH. 5)', 'Ironic external narrator', 'Unreliable first person', 'External, inwardly focalised'],
  ].map((r, i) => i === 0 ? r : [lens(r[0]), cell(r[1]), cell(r[2]), cell(r[3])]);
  s.addTable(rows, { x: MX, y: 1.25, w: 9, colW: [1.8, 2.4, 2.4, 2.4], rowH: 0.47, border: { type: 'solid', pt: 0.75, color: C.rule }, valign: 'middle', margin: 0.08 });
  await rail(s, [2, 3, 4, 5, 6], R, 25); s.addNotes(NOTES[24]);

  // 26 ── Stylometrics (native chart)
  s = pres.addSlide(); bg(s); eyebrow(s, 'Synthesis · A stylistics experiment', R); title(s, 'Counting what we have been hearing');
  const cats = ['Exclamation marks (per 1,000 words)', 'First-person “I” (per 1,000)', 'Color & gem words (per 1,000)', 'Em dashes (per 1,000)', 'Mean sentence length (words)'];
  s.addChart(pres.charts.BAR, [
    { name: 'Fitzgerald', labels: cats, values: [4.3, 7.5, 6.5, 11.0, 16.5] },
    { name: 'Gilman', labels: cats, values: [14.4, 49.5, 2.1, 10.0, 15.9] },
    { name: 'Chopin', labels: cats, values: [3.4, 7.5, 2.7, 5.5, 15.6] },
  ], {
    x: MX, y: 1.2, w: 5.6, h: 3.85, barDir: 'bar', barGrouping: 'clustered', barGapWidthPct: 60,
    chartColors: [F.a, ACC.gilman.bar, K.a], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 7, dataLabelColor: C.muted, dataLabelFormatCode: '0.0',
    catAxisLabelFontSize: 8, catAxisLabelColor: C.ink, catAxisOrientation: 'maxMin', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 't', legendFontSize: 8, legendColor: C.muted, catAxisLineShow: false,
  });
  tcard(s, 6.35, 1.25, 3.15, 1.3, 'What the numbers confirm', 'Gilman’s voice is saturated with **I** and **!**; Fitzgerald’s with color and gems; Chopin uses the fewest dashes and exclamations.', R, { size: 9.5 });
  tcard(s, 6.35, 2.7, 3.15, 1.15, 'What they cannot see', 'Mean sentence length is nearly identical. Style lives in *what* fills a sentence, not only its length.', R, { size: 9.5 });
  body(s, 'Method: counts computed by the presenter from the anthology texts (Fitzgerald 150–97; Gilman 198–216; Chopin 217–21). Chopin’s text is about 1,460 words, so its rates are approximate.', 6.35, 4.0, 3.15, 0.8, { size: 7.5, color: C.muted });
  await rail(s, [5, 6], R, 26); s.addNotes(NOTES[25]);

  // 27 ── Translation
  s = pres.addSlide(); bg(s);
  figure(s, '/ribo/fig6-1-gutenberg.jpg', 354 / 498, MX, 0.4, 3.2, 4.3, 'Fig. 6.1, first page of Genesis in the Gutenberg Bible, public domain, in Ribó, ch. 6.');
  s.addText('RIBÓ, SEC. 6.5 · TRANSLATION', { x: 4.05, y: 0.4, w: 5.4, h: 0.2, margin: 0, fontFace: SANS, fontSize: 8, bold: true, color: R.a, charSpacing: 3, isTextBox: true });
  title(s, 'What would a translator lose?', { x: 4.05, y: 0.65, w: 5.45, size: 24 });
  body(s, 'Translations “are always interpretations or rewritings of the original,” and difficulty “tends to increase with the degree of foregrounding” {{Ribó, sec. 6.5}}.', 4.05, 1.25, 5.45, 0.7, { size: 11 });
  tcard(s, 4.05, 2.0, 2.65, 1.25, 'Fitzgerald', '*Hades* and “Pretty hot down there?” A town name, a joke, and a theology in one word.', F, { size: 9.5 });
  tcard(s, 6.85, 2.0, 2.65, 1.25, 'Gilman', '“put down in *figures*”: can one word keep both numbers and tropes? And “a yellow smell.”', G, { size: 9.5 });
  tcard(s, 4.05, 3.4, 2.65, 1.3, 'Chopin', '“respectable” carries a whole social code. The text is already multilingual: “ma belle,” “chère amie.”', K, { size: 9.5 });
  tcard(s, 6.85, 3.4, 2.65, 1.3, 'Try it', 'Choose one sentence from any story and paraphrase it “plainly.” What disappears is its style.', R, { fill: R.soft, flat: true, size: 9.5 });
  await rail(s, [6], R, 27); s.addNotes(NOTES[26]);

  // 28 ── Conclusion
  s = pres.addSlide(); bg(s); eyebrow(s, 'Conclusion', R); title(s, 'Style is how a storyworld exists');
  [['Excess', 'Fitzgerald’s hyperbole makes wealth literal, and his irony makes it monstrous.', F, 'diamond'],
   ['Pattern', 'Gilman’s personification turns a room into a mind, and a simile into a self.', G, 'wallpaper'],
   ['Restraint', 'Chopin’s withheld figures let one adjective carry desire, law, and irony.', K, 'night']]
    .forEach(([h, t, a, art], i) => {
      const x = MX + i * 3.02, y = 1.25, w = 2.9, hh = 1.5;
      card(s, x, y, w, hh);
      s.addImage({ path: path.join(DECK, 'public/art', art + '.png'), x: x + 0.13, y: y + 0.13, w: 0.55, h: 0.55, sizing: { type: 'cover', w: 0.55, h: 0.55 }, rounding: true });
      label(s, h, x + 0.82, y + 0.3, w - 0.95, a);
      body(s, t, x + 0.15, y + 0.8, w - 0.3, 0.65, { size: 10.5 });
    });
  tcard(s, MX, 2.95, 9, 1.2, 'A through-line: the stars', 'Flaubert “long[s] to melt the stars” {{qtd. in Ribó, sec. 6.1}}; Kismine’s stars were “diamonds that belonged to some one” {{Fitzgerald 196}}; Gilman’s moon “creeps so slowly, and always comes in by one window or another” {{Gilman 207}}; Gouvernail’s night has “the large few stars” {{Chopin 220}}.', R, { fill: R.soft, flat: true, size: 10.5 });
  body(s, '**For discussion:** Which story’s style would survive paraphrase best, and what does that tell you about how its meaning is made?', MX, 4.35, 9, 0.5, { size: 11 });
  await rail(s, [1, 2, 3, 4, 5, 6], R, 28); s.addNotes(NOTES[27]);

  // 29, 30 ── Works Cited (MLA: centered heading, alphabetical, hanging indent)
  const wc = (heading, entries, note, i) => {
    const sl = pres.addSlide(); bg(sl, 'FFFFFF');
    sl.addText(heading, { x: MX, y: 0.3, w: 9, h: 0.45, margin: 0, align: 'center', fontFace: SERIF, fontSize: 20, color: C.ink, isTextBox: true });
    const paras = [];
    entries.forEach((e, k) => rt(e, { font: SERIF, size: 10.5 }).forEach((r, j, arr) => {
      if (j === arr.length - 1 && k < entries.length - 1) r.options.breakLine = true;
      paras.push(r);
    }));
    sl.addText(paras, { x: MX + 0.1, y: 0.85, w: 8.8, h: 3.9, margin: 0, valign: 'top', paraSpaceAfter: 5, lineSpacingMultiple: 1.25, isTextBox: true,
    });
    sl.addText(note, { x: MX + 0.1, y: 4.8, w: 8.8, h: 0.45, margin: 0, fontFace: SANS, fontSize: 7.5, color: C.muted, isTextBox: true });
    sl.addText(String(i + 1), { x: 9.0, y: 5.2, w: 0.5, h: 0.22, margin: 0, align: 'right', fontFace: SANS, fontSize: 7.5, color: C.faint, isTextBox: true });
    sl.addNotes(NOTES[i]);
    return sl;
  };
  const PF = '*Prose Fiction: An Introduction to the Semiotics of Narrative*';
  wc('Works Cited', [
    'Chopin, Kate. “A Respectable Woman.” 1894. *Gerb’s Anthology of Short Stories*, edited by David Gerber, Goodboi Publishing, 2020, pp. 217–21.',
    'Fitzgerald, F. Scott. “The Diamond as Big as the Ritz.” 1922. *Gerb’s Anthology of Short Stories*, edited by David Gerber, Goodboi Publishing, 2020, pp. 150–97.',
    'Gerber, David, editor. *Gerb’s Anthology of Short Stories*. Goodboi Publishing, 2020.',
    'Gilman, Charlotte Perkins. “The Yellow Wallpaper.” 1892. *Gerb’s Anthology of Short Stories*, edited by David Gerber, Goodboi Publishing, 2020, pp. 198–216.',
    `Ribó, Ignasi. ${PF}. Open Book Publishers, 2019, https://doi.org/10.11647/OBP.0187.`,
    'Whitman, Walt. *Leaves of Grass*. Brooklyn, 1855.',
  ], 'Note on citation: the anthology carries no printed page numbers, so parenthetical page references follow its PDF pagination. Ribó’s EPUB is unpaginated; per MLA practice, it is cited by chapter (ch.) and numbered section (sec.). Passages Ribó quotes from other authors are cited “qtd. in Ribó.”', 28);
  const B = `${PF}, by Ignasi Ribó, Open Book Publishers, 2019`;
  wc('Works Cited (continued) · Images', [
    `Flaubert, Gustave. Facsimile of the first draft of “A Simple Heart.” 1910. ${B}, fig. 6.2.`,
    `Glover, Carl. Pig dressed as a capitalist, illustrating George Orwell’s *Animal Farm*. CC BY 2.0. ${B}, fig. 6.3.`,
    `*Gutenberg Bible*, first page of Genesis. Ca. 1455. ${B}, fig. 6.1.`,
    'Phosphor Icons. Designed by Helena Zhang and Tobias Fried, MIT License, 2020, phosphoricons.com.',
    `Repin, Ilya. Illustration of Nikolai Gogol’s “Diary of a Madman.” ${B}, fig. 5.5.`,
    `Ribó, Ignasi. “Relationships between Existents in the Storyworld.” ${PF}, Open Book Publishers, 2019, fig. 3.1.`,
    '---. “Schema of Freytag’s Pyramid.” *Prose Fiction*, fig. 2.9.',
    '---. “Semiotic Model of Narrative.” *Prose Fiction*, fig. 1.5.',
  ], 'Cover triptych and story illustrations (“diamond mountain,” “yellow wallpaper,” “plantation night”) are original generative artwork created for this lecture.', 29);

  await pres.writeFile({ fileName: OUT });
  console.log('wrote', OUT);
})();
