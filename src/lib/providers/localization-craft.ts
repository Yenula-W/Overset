/**
 * Localization craft: what a professional comic translator and letterer do that
 * a literal translation does not. Appended to the system prompt for every
 * translation, proofread and OCR call. Keep it concrete: each rule is something
 * the model can check against its own output.
 */

/** Rules for choosing words. */
const WORD_CHOICE = `WORD CHOICE
- Translate what the speaker means and does, in the register they would use in the target language, not the dictionary gloss of each word. Read the scene first, then phrase.
- Pick the shortest natural phrasing that keeps meaning, tone and rhythm. Comic readers read fast: prefer common one- and two-syllable words, contractions in casual speech ("don't", "gonna" only when the voice is rough), and active verbs.
- Cut what the picture already shows. Drop pronouns, subjects and explanations that Korean, Japanese and Chinese leave implicit when English does not need them, but never drop who acts on whom.
- Keep each speaker's voice distinct and stable: formal and clipped, blunt, playful, childlike, archaic, rough. Reuse a character's pet words and verbal tics. Never let two characters sound alike unless the source does.
- Keep register contrasts: an elder, a boss, a rival or a stranger is addressed differently from a friend. Show politeness through phrasing ("Would you mind...", "Please") rather than stiff honorific substitutes.
- Honorific and name handling follows the supplied preferences. When honorifics are kept, keep them exactly as the glossary or earlier pages wrote them. When they are not, carry the relationship through tone instead.
- Idioms, proverbs and wordplay: find an equivalent with the same job (comfort, threat, joke). If a pun cannot survive, keep the sense and add a short culturalNote instead of a footnote inside the bubble.
- Names, ranks, skills, places and terms follow the glossary and approved earlier lines exactly. Do not re-translate a term differently on a new page.
- Numbers, units, titles and honorific-like titles keep a consistent format across the chapter.
- Profanity and insults keep their force without being softened or escalated. Match intensity, not word count.`;

/** Rules for each text kind. */
const BY_TEXT_TYPE = `BY TEXT KIND
- dialogue: natural spoken English (or target language). One breath per bubble. Keep interruptions, trailing thoughts and stammers where the source has them. Do not merge two speakers' lines.
- thought: first person, internal, often fragmentary and more honest than speech. No stage directions. Same quotation rules as dialogue.
- narration: past or present tense exactly as the source. Cleaner, more written register than dialogue. Avoid contractions unless the narrator's voice is casual. Keep it tight: captions share space with art.
- sfx: do not transliterate. Give the sound or feeling a reader of the target language would expect (thud, slam, rustle, drip). Mimetic words for feeling (a heartbeat, silence, a glare) become a short sensory word or are left for the art. Return an empty literal rather than invent a sound the image does not support.
- sign, label, title: translate as they would be printed in the target language, short and in the sign's own tone. Keep proper nouns consistent with the glossary.
- Ellipses and dashes: "..." is a trailing-off, hesitation or silence; "--" is an interruption or cut-off. Do not swap them. Do not end a line with both.
- Emphasis: mark the single stressed word with *asterisks* only when the source shows emphasis (bold, bigger, bursting letters) and the stress would change the meaning. At most one or two per bubble.
- Question and exclamation: match the source's intensity. One "!" or "?" unless the source clearly shouts. Use "?!" only when the source does.`;

/** Rules that make the result fit the bubble and look like real lettering. */
const PLACEMENT = `PLACEMENT AND FIT
- A bubble is a shape, not a box: ovals and bursts hold short, wide-first lines in the middle; tall narrow bubbles hold two to four short lines. The caller supplies bubbleHint (width, height, estimated characters per line). Aim for at most the estimated total capacity and prefer two or three even lines over one long one.
- If the natural translation is longer than the bubble comfortably holds, choose a shorter natural phrasing in recommended, keep the full accurate version in literal, and offer a short alternative. Never cut meaning to fit, and never leave a thought half-finished.
- Break lines at phrase boundaries, never between an article and its noun, a preposition and its object, or a verb and its short object. Avoid a single short word alone on the last line. Return plain text; the typesetter handles line breaks. Use an explicit line break only for deliberate beats inside one bubble.
- Do not add words only to fill space, and do not abbreviate to save space unless the target language does so in speech.
- Keep sentence case unless the supplied style asks for upper case; the typesetter applies the case. Do not write all-caps yourself.
- Lettering matches the original: serif for formal or narrator voices, sans for normal speech, bold for loud or angry speech, handwritten for casual or quiet notes, display for shouts and effects. Report fontCategory and fontWeight from the printed lettering, not a guess from the language.`;

/** What to check before answering. */
const SELF_CHECK = `SELF-CHECK BEFORE SAVING
1. Does the line say what the speaker means, to this listener, in this scene? 2. Can it be read aloud in one breath at the bubble's size? 3. Is every glossary term, name and number identical to earlier lines? 4. Does it keep the speaker's voice and the same politeness level as before? 5. Is anything in it that the source does not support? Remove it. 6. Is the stronger verb or the shorter word available? Use it.`;

export const LOCALIZATION_CRAFT = [WORD_CHOICE, BY_TEXT_TYPE, PLACEMENT, SELF_CHECK].join('\n\n');
