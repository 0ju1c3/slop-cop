import type { ViolationRule } from './types.js'

export const RULES: ViolationRule[] = [
  // ── Word Choice ──────────────────────────────────────────────────────────
  {
    id: 'overused-intensifiers',
    name: 'Overused Intensifier',
    category: 'word-choice',
    description:
      'Words like "crucial," "vital," "robust," "leverage," "delve," etc. are LLM clichés that add noise.',
    tip: "Delete it. If the sentence still makes sense, the word was never needed. If it doesn't, rewrite the sentence to show why it matters.",
    requiresLLM: false,
    llmDirective:
      'Remove the flagged overused intensifiers — delete them or rephrase the sentence without them.',
  },
  {
    id: 'elevated-register',
    name: 'Elevated Register',
    category: 'word-choice',
    description:
      'Using "utilize" instead of "use," "commence" instead of "start," "facilitate" instead of "help."',
    tip: 'Replace with the simpler word. "Utilize" → "use." "Commence" → "start." Elevated register performs intelligence rather than demonstrating it.',
    requiresLLM: false,
    llmDirective:
      "Replace elevated register with plain equivalents: 'utilize'→'use', 'commence'→'start', 'facilitate'→'help', 'endeavor'→'try', 'demonstrate'→'show'.",
  },
  {
    id: 'filler-adverbs',
    name: 'Filler Adverb',
    category: 'word-choice',
    description:
      '"Importantly," "essentially," "fundamentally," "ultimately," "inherently" signal importance without substantiating it.',
    tip: "Remove it. If the sentence still works, the adverb was empty. If it doesn't work without it, the sentence needs to be rewritten to earn the emphasis.",
    requiresLLM: false,
    llmDirective:
      'Do not open sentences with filler adverbs (importantly, essentially, fundamentally, ultimately, inherently).',
  },
  {
    id: 'almost-hedge',
    name: '"Almost" Hedge',
    category: 'word-choice',
    description:
      '"Almost always," "almost never," "almost certainly" — hedging instead of committing to the pattern.',
    tip: 'Commit. "Almost always" → "usually." Or just say "always" and defend the claim. Readers notice when you won\'t take a stance.',
    requiresLLM: false,
    llmDirective:
      "Do not hedge with 'almost always', 'almost never', 'almost certainly' — commit to the claim directly.",
  },
  {
    id: 'era-opener',
    name: '"In an Era of…"',
    category: 'word-choice',
    description:
      'Opening phrase that stalls before reaching the actual argument.',
    tip: 'Delete this clause entirely and start the sentence at the real point. "In an era of rapid change, companies must adapt" → "Companies must adapt."',
    requiresLLM: false,
    llmDirective:
      "Do not open with era-framing clauses ('In an era of...', 'In a world where...') — start at the real point.",
  },

  // ── Framing ──────────────────────────────────────────────────────────────
  {
    id: 'metaphor-crutch',
    name: 'Metaphor Crutch',
    category: 'framing',
    description:
      'Predictable metaphors: "double-edged sword," "tip of the iceberg," "north star," "game-changer," etc.',
    tip: 'Either find a specific, original image from the actual subject matter, or drop the metaphor and say the thing plainly.',
    requiresLLM: false,
    llmDirective:
      'Replace the flagged clichéd metaphors with plain language or a specific concrete image.',
  },
  {
    id: 'broader-implications',
    name: '"Broader Implications"',
    category: 'framing',
    description: 'Zooming out to claim significance without substantiation.',
    tip: 'State the implication explicitly, or cut the phrase. "This has broader implications" says nothing. What are the implications? Say them.',
    requiresLLM: false,
    llmDirective:
      "Do not use 'broader implications' or 'wider implications' — state the actual implication or delete the phrase.",
  },

  // ── Sentence Structure ───────────────────────────────────────────────────
  {
    id: 'em-dash-pivot',
    name: 'Em-Dash Overuse',
    category: 'sentence-structure',
    description:
      'Em-dashes used as catch-all punctuation instead of choosing the right mark.',
    tip: 'Ask what relationship this dash is expressing. A pause → comma. A list → colon. A parenthetical → parentheses. A new sentence → period. Choose the right tool.',
    requiresLLM: false,
    llmDirective:
      'Do not use em-dashes (—). Replace each with the correct punctuation: comma for a pause, colon for elaboration, parentheses for an aside, period for a new sentence.',
  },
  {
    id: 'negation-pivot',
    name: 'Negation Pivot',
    category: 'sentence-structure',
    description:
      '"Not X, but Y" / "don\'t X, but Y" — negation followed by reframe. A hallmark LLM rhetorical structure.',
    tip: 'Rewrite as a direct positive claim. "We don\'t constrain through prohibition, but through amplification" → "We constrain through amplification." Lead with what is true, not what isn\'t.',
    requiresLLM: false,
    llmDirective:
      "Do not use 'not X, but Y' constructions — rewrite as a direct positive claim.",
  },
  {
    id: 'colon-elaboration',
    name: 'Colon Elaboration',
    category: 'sentence-structure',
    description:
      'Short declarative clause, colon, then longer explanation — a mechanical LLM sentence pattern.',
    tip: 'Either merge into one flowing sentence, or make two separate sentences. The colon-elaboration structure becomes predictable when used repeatedly.',
    requiresLLM: false,
    llmDirective:
      "Do not use the '[short clause]: [long elaboration]' sentence structure — merge into one sentence or split into two.",
  },
  {
    id: 'question-then-answer',
    name: 'Question-Then-Answer',
    category: 'sentence-structure',
    description: 'Rhetorical question immediately followed by its own answer.',
    tip: 'Delete the question and just make the statement. "What does this mean? It means X." → "This means X."',
    requiresLLM: false,
    llmDirective:
      'Do not write a rhetorical question immediately followed by its own answer — delete the question and make the statement directly.',
  },
  {
    id: 'staccato-burst',
    name: 'Staccato Burst',
    category: 'sentence-structure',
    description:
      'Three or more consecutive very short sentences at matching cadence.',
    tip: 'Vary the rhythm. Combine some of these sentences, or expand one into a full thought. Uniform short sentences feel like a list of bullet points in disguise.',
    requiresLLM: false,
    llmDirective:
      'Do not write three or more consecutive very short sentences at matching rhythm — vary sentence length and structure.',
  },
  {
    id: 'hedge-stack',
    name: 'Hedge Stack',
    category: 'sentence-structure',
    description:
      'Multiple hedges in one sentence: "perhaps," "arguably," "might," "could," "seemingly," etc.',
    tip: 'Pick one hedge if you need it, remove the rest. Better: commit to the claim and let the reader evaluate it. Five hedges communicate nothing.',
    requiresLLM: false,
    llmDirective:
      'Do not stack multiple hedges in one sentence (perhaps, arguably, might, could, seemingly) — keep at most one.',
  },
  {
    id: 'parenthetical-qualifier',
    name: 'Parenthetical Qualifier',
    category: 'sentence-structure',
    description:
      'Parenthetical asides that perform nuance without changing the argument.',
    tip: "Either make the qualification part of the main sentence (it's important enough to say plainly) or delete it (it wasn't needed).",
    requiresLLM: false,
    llmDirective:
      'Remove the flagged parenthetical qualifiers (of course, to be fair, admittedly) — integrate the content or delete it.',
  },
  {
    id: 'unnecessary-contrast',
    name: 'Unnecessary Contrast',
    category: 'sentence-structure',
    description:
      '"Whereas," "as opposed to," "unlike" used to restate what the first clause already implied.',
    tip: "Delete the contrasting clause. If it adds information the reader didn't have, rewrite it as a direct statement rather than a contrast.",
    requiresLLM: false,
    llmDirective:
      'Do not use unnecessary contrast markers (whereas, as opposed to, unlike, in contrast to) — state the claim directly.',
  },

  // ── Rhetorical ───────────────────────────────────────────────────────────
  {
    id: 'important-to-note',
    name: '"It\'s Important to Note"',
    category: 'rhetorical',
    description:
      'Verbal tic that precedes qualifications — tells the reader what to think before saying the thing.',
    tip: 'Delete the phrase and just say the thing. "It\'s important to note that X" → "X."',
    requiresLLM: false,
    llmDirective:
      "Do not use 'it is important to note', 'it\\'s worth noting', or 'it should be noted' — just say the thing.",
  },
  {
    id: 'false-conclusion',
    name: 'False Conclusion',
    category: 'rhetorical',
    description:
      '"At the end of the day," "in conclusion," "to summarize" — high-school essay signposting.',
    tip: 'Delete the phrase. The conclusion should land through its content, not be announced. If you need to say "in conclusion," the conclusion isn\'t clear enough.',
    requiresLLM: false,
    llmDirective:
      'Do not use conclusion signpost phrases (in conclusion, at the end of the day, to summarize, moving forward) — let the content land without announcement.',
  },
  {
    id: 'connector-addiction',
    name: 'Connector Addiction',
    category: 'rhetorical',
    description:
      'Every paragraph opened with a transition word: "Furthermore," "Moreover," "Additionally," etc.',
    tip: "Delete the transition and let the ideas connect through their content. If the connection isn't obvious without the word, restructure — don't signal.",
    requiresLLM: false,
    llmDirective:
      'Do not open paragraphs with transitional connectors (Furthermore, Moreover, Additionally, However, That said) — let ideas connect through their content.',
  },

  // ── Structural ───────────────────────────────────────────────────────────
  {
    id: 'listicle-instinct',
    name: 'Listicle Instinct',
    category: 'structural',
    description:
      'Lists with exactly 3, 5, 7, or 10 items — LLMs default to these magic numbers.',
    tip: 'Ask if this really needs a list. If the items have natural prose flow, write them as prose. If it is a list, let it have the number of items it actually has — 4, 6, 9.',
    requiresLLM: false,
    llmDirective:
      'Do not use lists with exactly 3, 5, 7, or 10 items — write as prose or use the natural number of items.',
  },

  // ── Sentence Structure (new) ─────────────────────────────────────────────
  {
    id: 'serves-as',
    name: '"Serves As" Dodge',
    category: 'sentence-structure',
    description:
      'Replacing "is/are" with pompous alternatives: "serves as," "stands as," "acts as," "functions as."',
    tip: 'Replace with "is" or "are." The pompous substitute performs sophistication without adding meaning.',
    requiresLLM: false,
    llmDirective:
      "Replace 'serves as', 'stands as', 'acts as', 'functions as' with 'is' or 'are'.",
  },
  {
    id: 'negation-countdown',
    name: '"Not X. Not Y. Just Z."',
    category: 'sentence-structure',
    description:
      '2+ consecutive sentences starting with "Not " — building tension by negating before revealing.',
    tip: 'Cut the negations and state the positive claim directly.',
    requiresLLM: false,
    llmDirective:
      'Do not use the "Not X. Not Y. Just Z." pattern — replace with a single direct positive statement.',
  },
  {
    id: 'anaphora-abuse',
    name: 'Anaphora Abuse',
    category: 'sentence-structure',
    description:
      '3+ consecutive sentences starting with the same two-word opener.',
    tip: 'Vary the sentence openings. Anaphora becomes a tic when used more than twice.',
    requiresLLM: false,
    llmDirective:
      'Do not repeat the same sentence opener three or more times consecutively — vary sentence openings.',
  },
  {
    id: 'gerund-litany',
    name: 'Gerund Fragment Litany',
    category: 'sentence-structure',
    description:
      '2+ consecutive short sentences (≤8 words) starting with a capital -ing word.',
    tip: 'Expand these into full sentences or merge them. The gerund litany is a mechanical rhythm.',
    requiresLLM: false,
    llmDirective:
      'Do not write multiple consecutive short sentences starting with gerunds — expand or merge them.',
  },
  {
    id: 'superficial-analysis',
    name: 'Superficial Analysis',
    category: 'sentence-structure',
    description:
      'Trailing participle phrase claiming false significance: ", highlighting its importance," ", underscoring its role," etc.',
    tip: 'Cut the trailing phrase entirely. If the significance is real, make it a separate sentence with a specific claim.',
    requiresLLM: false,
    llmDirective:
      "Remove trailing significance phrases such as ', highlighting its importance,' or ', underscoring its role,' entirely.",
  },

  // ── Rhetorical (new) ─────────────────────────────────────────────────────
  {
    id: 'heres-the-kicker',
    name: '"Here\'s the Kicker"',
    category: 'rhetorical',
    description:
      'False suspense transitions: "here\'s the kicker," "here\'s the thing," "here\'s where it gets interesting," etc.',
    tip: 'Delete the transition and state the point directly.',
    requiresLLM: false,
    llmDirective:
      "Do not use false suspense transitions ('Here\\'s the thing', 'Here\\'s the kicker', 'Here\\'s where it gets interesting') — state the point directly.",
  },
  {
    id: 'pedagogical-aside',
    name: 'Pedagogical Aside',
    category: 'rhetorical',
    description:
      'Teacher-mode phrases: "let\'s break this down," "let\'s unpack," "think of it as," etc.',
    tip: "Skip the preamble and explain the thing directly. The reader doesn't need to be managed.",
    requiresLLM: false,
    llmDirective:
      "Do not use teacher-mode preambles ('Let\\'s break this down', 'Let\\'s unpack', 'Think of it as') — explain directly.",
  },
  {
    id: 'imagine-world',
    name: '"Imagine a World Where"',
    category: 'rhetorical',
    description:
      'Opens with a futurist invitation: "Imagine a world," "Imagine if you," "Imagine what would," "Imagine a future."',
    tip: 'Start with the actual argument instead of inviting the reader to imagine it.',
    requiresLLM: false,
    llmDirective:
      "Do not open with hypothetical world-building ('Imagine a world where...') — start with the actual argument.",
  },
  {
    id: 'vague-attribution',
    name: 'Vague Attribution',
    category: 'rhetorical',
    description:
      'Unnamed authority invocations: "experts argue," "studies show," "observers have noted," "research suggests," etc.',
    tip: 'Name the experts, cite the studies, or drop the claim. Vague attribution is worse than no citation.',
    requiresLLM: false,
    llmDirective:
      "Do not use vague attribution ('experts argue', 'studies show', 'research suggests') — name the source or drop the claim.",
  },
  {
    id: 'despite-challenges',
    name: '"Despite Its Challenges"',
    category: 'rhetorical',
    description:
      'Formula: "Despite [these/its/the] [challenges/obstacles/limitations]..." — conceding without substance.',
    tip: 'Name the specific challenge. "Despite its challenges" is a throat-clear disguised as an acknowledgment.',
    requiresLLM: false,
    llmDirective:
      "Do not use 'despite its challenges', 'despite these limitations', or similar empty concessions — name the specific challenge or cut it.",
  },

  // ── Structural (new) ─────────────────────────────────────────────────────
  {
    id: 'listicle-trench-coat',
    name: 'Listicle in a Trench Coat',
    category: 'structural',
    description:
      '"The first... The second... The third..." — prose disguising a list.',
    tip: "Either use an actual list or rewrite as genuine prose. Don't pretend a list is an argument.",
    requiresLLM: false,
    llmDirective:
      'Do not use ordinal prose disguising a list ("The first... The second... The third...") — write as real prose or use an actual list.',
  },
  {
    id: 'bold-first-bullets',
    name: 'Bold-First Bullets',
    category: 'structural',
    description:
      'Markdown list items starting with a bolded phrase: "- **Term**: explanation."',
    tip: 'Either use a definition list format or integrate the bold label into prose. This is pure LLM document structure.',
    requiresLLM: false,
    llmDirective:
      'Do not use bold-first bullet formatting (**Term**: explanation) — integrate into prose.',
  },
  {
    id: 'unicode-arrows',
    name: 'Unicode Decoration',
    category: 'structural',
    description:
      'The → arrow character used in prose as a decoration or shorthand.',
    tip: 'Write out the relationship. "Input → Output" → "Input produces Output."',
    requiresLLM: false,
    llmDirective:
      'Do not use → arrows in prose — write out the relationship (produces, leads to, becomes).',
  },
  {
    id: 'dramatic-fragment',
    name: 'Dramatic Fragment',
    category: 'structural',
    description:
      'A standalone paragraph with ≤4 words — used for false dramatic emphasis.',
    tip: 'Either expand it into a real sentence or absorb it into the surrounding paragraph.',
    requiresLLM: false,
    llmDirective:
      'Do not use a one-to-four-word standalone paragraph for dramatic emphasis — absorb it into the surrounding text.',
  },

  // ── Framing (new) ────────────────────────────────────────────────────────
  {
    id: 'concept-label',
    name: 'Invented Concept Label',
    category: 'framing',
    description:
      'Compound noun + abstract suffix used as an invented analytical term: "the attention paradox," "the trust vacuum," "the context creep."',
    tip: 'Either explain the phenomenon in plain terms or use an established name for it.',
    requiresLLM: false,
    llmDirective:
      "Do not use invented concept labels ('the X paradox', 'the Y vacuum', 'the Z creep') — describe the phenomenon in plain terms.",
  },

  {
    id: 'short-hook-paragraph',
    name: 'Short-Hook Paragraph',
    category: 'sentence-structure',
    description:
      'A short punchy opener (≤10 words) followed by two or more substantially longer elaboration sentences — the LLM "hook then evidence pile" rhythm.',
    tip: 'Expand the opener into a complete thought, or absorb it into the first elaboration sentence. The sharp length contrast signals formulaic structure.',
    requiresLLM: false,
    llmDirective:
      'Do not open a paragraph with a short punchy fragment followed by a pile of longer elaboration sentences — develop the opening idea fully.',
  },

  // ── LLM-required semantic detections ─────────────────────────────────────
  {
    id: 'triple-construction',
    name: 'Triple Construction',
    category: 'sentence-structure',
    description:
      'Exactly three parallel items: "X, Y, and Z" — LLMs default to threes compulsively.',
    tip: 'Break the pattern. Use two items or four. Or convert one item into its own sentence to give it more weight.',
    requiresLLM: false,
    llmDirective:
      'Do not use the rule of three (X, Y, and Z) — use two items, four items, or give one item its own sentence.',
  },
  {
    id: 'throat-clearing',
    name: 'Throat-Clearing Opener',
    category: 'rhetorical',
    description:
      'First paragraph that adds no information and could be deleted without any loss.',
    tip: 'Delete the whole paragraph and start at the second one. The real piece almost always begins at the second paragraph.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      "An opening paragraph that adds zero information and could be deleted without any loss of meaning. Flag only if it's the very first paragraph.",
    llmDirective:
      'Delete this paragraph entirely — it adds no information; the piece starts properly at the next paragraph.',
  },
  {
    id: 'sycophantic-frame',
    name: 'Sycophantic Frame',
    category: 'rhetorical',
    description:
      'Opening that compliments the question or topic before addressing it.',
    tip: 'Delete the compliment entirely. "Great question! X is important because…" → "X is important because…"',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'Text that opens by complimenting the question, assignment, or topic ("Great question," "This is a fascinating topic," etc.).',
    llmDirective:
      "Delete the complimentary opener ('Great question!', 'This is fascinating') — start with the actual content.",
  },
  {
    id: 'balanced-take',
    name: 'Balanced Take',
    category: 'rhetorical',
    description:
      'Every argument immediately followed by a concession that softens it to nothing.',
    tip: "Make the argument. Acknowledge genuine counterarguments separately and specifically. Don't reflexively soften every claim — it reads as epistemic cowardice.",
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'A sentence that makes a point then immediately softens it into nothing — reflexive RLHF-style hedging that negates the original claim.',
    llmDirective:
      'Do not reflexively soften every claim with an immediate concession — state the argument, then address genuine counterarguments separately.',
  },
  {
    id: 'unnecessary-elaboration',
    name: 'Unnecessary Elaboration',
    category: 'sentence-structure',
    description:
      'The sentence makes its point, then keeps going to restate it.',
    tip: 'Cut at the point where the sentence was done. The restatement dilutes the original impact.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'A sentence that continues past the point where it was already finished, restating its own point in slightly different words within the same sentence or immediately adjacent clause. Example: "The reform failed. It did not succeed, and the attempt to change things did not work out as intended." — the second sentence adds nothing the first didn\'t already say. This is strictly a within-sentence or single-sentence pattern. Do NOT flag cross-paragraph patterns (that is one-point-dilution, a separate rule). Do NOT flag an analogy or concept introduced in one paragraph being purposefully extended or applied to a new domain in a subsequent paragraph — that is development, not elaboration.',
    llmDirective:
      'Do not restate a point in the same sentence or adjacent clause after already making it — stop when the sentence is done.',
  },
  {
    id: 'empathy-performance',
    name: 'Empathy Performance',
    category: 'rhetorical',
    description:
      'Generic emotional language ("I understand this can be difficult") applicable to any topic.',
    tip: 'Delete it, or replace with something specific to this exact situation. Generic empathy is indistinguishable from no empathy.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'Generic emotional language applicable to any situation ("I understand this can be difficult," "Your feelings are valid," etc.).',
    llmDirective:
      "Do not use generic empathy language ('I understand this can be difficult') — delete it or replace with something specific.",
  },
  {
    id: 'pivot-paragraph',
    name: 'Pivot Paragraph',
    category: 'structural',
    description:
      'A one-sentence paragraph containing no new information, only transition.',
    tip: 'Delete it. Attach the transition thought to either the paragraph before or after, or cut it entirely — the surrounding content should do this work.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'A one-sentence paragraph containing zero new information — only transitions between surrounding paragraphs.',
    llmDirective:
      'Delete this transition-only paragraph — it contains no new information.',
  },
  {
    id: 'false-range',
    name: 'False Range',
    category: 'sentence-structure',
    description:
      '"From X to Y" constructions where X and Y aren\'t on a meaningful spectrum, or hollow idioms like "doesn\'t emerge from nowhere".',
    tip: 'Either show a real spectrum or cut the framing entirely.',
    requiresLLM: false,
    llmTier: 'sentence',
    llmDetectionHint:
      'A "from X to Y" construction where X and Y are not on any meaningful spectrum or scale — used as a fancy way to list two loosely related things rather than express a genuine range. Also flag hollow idioms like "doesn\'t come from nowhere" / "doesn\'t emerge from nowhere" that use "from" as clichéd filler. Flag only clear cases. For matchedText, capture the full verb phrase containing the hollow construction (e.g. "doesn\'t emerge from nowhere"), not just the prepositional fragment.',
    llmDirective:
      "Do not use hollow 'from X to Y' constructions or clichéd idioms like 'doesn't come from nowhere' — use direct language.",
  },
  {
    id: 'grandiose-stakes',
    name: 'Grandiose Stakes',
    category: 'framing',
    description:
      'Inflating the stakes of an ordinary argument to world-historical significance without substantiation.',
    tip: "Scale the claim to match the evidence. If it's not world-historical, don't say so.",
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'Inflating the significance of an ordinary point to world-historical importance ("will fundamentally reshape how we think about everything", "will define the next era of computing", "has implications for the future of humanity") without substantiation.',
    llmDirective:
      'Do not inflate ordinary points to world-historical significance — scale the claim to match the actual evidence.',
  },
  {
    id: 'historical-analogy',
    name: 'Historical Analogy Stack',
    category: 'rhetorical',
    description:
      'Rapid-fire listing of famous companies or tech revolutions to build false authority by association.',
    tip: 'Pick one analogy and develop it. A list of analogies proves nothing — it just borrows the aura of many things.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'Rapid-fire listing of famous companies or tech revolutions stacked together to build false authority by association ("Apple didn\'t build Uber. Facebook didn\'t build Spotify..."; "the web, mobile, social, cloud, AI"). Flag when the historical references are decorative rather than analytically necessary.',
    llmDirective:
      'Do not stack rapid-fire historical or company analogies — develop one analogy or drop them entirely.',
  },
  {
    id: 'false-vulnerability',
    name: 'False Vulnerability',
    category: 'rhetorical',
    description:
      'Performative self-awareness or simulated honesty ("I\'ll be honest," "Let\'s be real") that reads as staged rather than genuine.',
    tip: 'Real vulnerability is specific and uncomfortable. If it sounds polished, cut it.',
    requiresLLM: true,
    llmTier: 'sentence',
    llmDetectionHint:
      'Performative self-awareness or simulated honesty that reads as staged rather than genuine ("And yes, I\'ll admit...", "I\'ll be honest with you", "Let\'s be real:", "And yes, since we\'re being honest"). Real vulnerability is specific and uncomfortable; flag when it sounds polished and risk-free.',
    llmDirective:
      "Do not use performative honesty phrases ('I\\'ll be honest', 'Let\\'s be real', 'And yes, since we\\'re being honest') — real vulnerability is specific.",
  },

  // ── Document-level (Sonnet) ───────────────────────────────────────────────
  {
    id: 'dead-metaphor',
    name: 'Dead Metaphor',
    category: 'framing',
    description:
      'The same metaphor or image recurs throughout the piece, becoming mechanical rather than intentional.',
    tip: 'Keep the instance that earns its place most and cut the rest. The same image used five times is no longer a choice.',
    requiresLLM: true,
    llmTier: 'document',
    llmDetectionHint:
      'The same metaphor, image, or conceptual frame recurs 3 or more times across the piece mechanically rather than intentionally. A single metaphor is a choice; the same one appearing every few paragraphs is a crutch. Flag a later instance (not the first), since repetition is the problem.',
    llmDirective:
      'Do not repeat the flagged metaphor — use it once where it earns its place or replace with plain language.',
  },
  {
    id: 'one-point-dilution',
    name: 'One-Point Dilution',
    category: 'structural',
    description:
      'The same core argument restated across multiple paragraphs with different words but no new information.',
    tip: 'Find where the point was made best and cut every restatement. A strong claim once beats the same claim eight times.',
    requiresLLM: true,
    llmTier: 'document',
    llmDetectionHint:
      'The same core claim or argument appears across multiple paragraphs restated with different words, examples, or metaphors, but adding no new information. The piece pads a simple thesis. Flag the most redundant restatement — a sentence or clause that says something already said.',
    llmDirective:
      'Do not restate the same core argument in different words — add new information or cut the restatement.',
  },
  {
    id: 'fractal-summaries',
    name: 'Fractal Summaries',
    category: 'structural',
    description:
      'Meta-commentary that previews or recaps content rather than delivering it: "In this section we\'ll explore...", "As we\'ve seen..."',
    tip: 'Delete the signpost and say the thing. The content should do this work.',
    requiresLLM: true,
    llmTier: 'document',
    llmDetectionHint:
      'Meta-commentary that previews or recaps content rather than delivering it: "In this section, we will explore...", "As we have seen...", "To summarize what we have covered...", "What follows is an examination of...". Flag only genuine content-free structural signposting, not substantive transitions.',
    llmDirective:
      "Do not use structural signposting that previews or recaps content ('In this section we will...', 'As we\\'ve seen...') — say the thing directly.",
  },
]

export const RULES_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]))
