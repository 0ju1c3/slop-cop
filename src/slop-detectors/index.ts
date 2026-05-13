import { retext } from 'retext'
import retextIndefiniteArticle from 'retext-indefinite-article'
import type { VFileMessage } from 'vfile-message'
import type { Violation } from '../types.js'
import nlp from './nlp-instance.js'
import {
  detectContextualSlop,
  detectShortHookParagraph,
  detectTripleConstruction,
  detectVerbIntensifierForms,
} from './nlp-patterns.js'

import {
  detectAlmostHedge,
  detectAnaphoraAbuse,
  detectBoldFirstBullets,
  detectBroaderImplications,
  detectColonElaboration,
  detectConceptLabel,
  detectConnectorAddiction,
  detectDespiteChallenges,
  detectDramaticFragment,
  detectElevatedRegister,
  detectEmDashPivot,
  detectEraOpener,
  detectFalseConclusion,
  detectFalseRange,
  detectFillerAdverbs,
  detectGerundLitany,
  detectHedgeStack,
  detectHeresTheKicker,
  detectHighlightSlop,
  detectImagineWorld,
  detectImportantToNote,
  detectListicleInstinct,
  detectListicleTrenchCoat,
  detectMetaphorCrutch,
  detectNegationCountdown,
  detectNegationPivot,
  detectOverusedIntensifiers,
  detectParentheticalQualifier,
  detectPedagogicalAside,
  detectQuestionThenAnswer,
  detectServesAs,
  detectStaccatoBurst,
  detectSuperficialAnalysis,
  detectUnicodeArrows,
  detectUnnecessaryContrast,
  detectVagueAttribution,
} from './word-patterns.js'

const articleProcessor = retext().use(retextIndefiniteArticle)

export function runClientDetectors(text: string): Violation[] {
  const all: Violation[] = [
    ...detectHighlightSlop(text),
    ...detectOverusedIntensifiers(text),
    ...detectElevatedRegister(text),
    ...detectFillerAdverbs(text),
    ...detectAlmostHedge(text),
    ...detectEraOpener(text),
    ...detectMetaphorCrutch(text),
    ...detectImportantToNote(text),
    ...detectBroaderImplications(text),
    ...detectFalseConclusion(text),
    ...detectConnectorAddiction(text),
    ...detectUnnecessaryContrast(text),
    ...detectEmDashPivot(text),
    ...detectNegationPivot(text),
    ...detectColonElaboration(text),
    ...detectParentheticalQualifier(text),
    ...detectQuestionThenAnswer(text),
    ...detectHedgeStack(text),
    ...detectStaccatoBurst(text),
    ...detectListicleInstinct(text),
    ...detectServesAs(text),
    ...detectNegationCountdown(text),
    ...detectAnaphoraAbuse(text),
    ...detectGerundLitany(text),
    ...detectHeresTheKicker(text),
    ...detectPedagogicalAside(text),
    ...detectImagineWorld(text),
    ...detectListicleTrenchCoat(text),
    ...detectVagueAttribution(text),
    ...detectBoldFirstBullets(text),
    ...detectUnicodeArrows(text),
    ...detectDespiteChallenges(text),
    ...detectConceptLabel(text),
    ...detectDramaticFragment(text),
    ...detectSuperficialAnalysis(text),
    ...detectFalseRange(text),
    ...detectVerbIntensifierForms(text),
    ...detectTripleConstruction(text),
    ...detectContextualSlop(text),
    ...detectShortHookParagraph(text),
  ]
  const deduped = deduplicateViolations(all)
  return fixArticleContext(suppressUnsafeDeletions(deduped, text), text)
}

// Linking verbs that introduce a predicate adjective — deleting the adjective
// directly after one of these leaves a broken sentence.
const LINKING_VERB_RE =
  /\b(is|was|are|were|am|be|been|being|becomes?|became|remains?|remained|seems?|appeared?|appears?|looks?|felt|feels?|sounds?|gets?|got)\s+$/i

// Suppress unsafe deletions for adjective-position violations:
// 1. Predicate adjective ("distinction is vital for X") — linking verb before violation
// 2. Dangling modifier ("most comprehensive overview") — degree modifier/adverb before violation
// Both cases set suggestedChange: null so Claude knows to rewrite rather than delete.
function suppressUnsafeDeletions(
  violations: Violation[],
  text: string,
): Violation[] {
  return violations.map((v) => {
    if (v.suggestedChange !== undefined && v.suggestedChange !== '') return v
    const before = text.slice(0, v.startIndex)
    if (LINKING_VERB_RE.test(before)) return { ...v, suggestedChange: null }
    const precedingWord = before.match(/\b(\w+)\s+$/)?.[1]
    if (!precedingWord) return v
    const isModifier =
      /^(most|more|least|less)$/i.test(precedingWord) ||
      nlp(precedingWord).has('#Adverb')
    return isModifier ? { ...v, suggestedChange: null } : v
  })
}

// For violations where applying the change would leave a wrong article ("a"/"an"),
// expand the span backwards to include the article and set the correct one.
// Uses retext-indefinite-article for phoneme-aware correction, handling
// "an hour", "a uniform", "an API", "a one-time" etc. that letter-checking misses.
function fixArticleContext(violations: Violation[], text: string): Violation[] {
  return violations.map((v) => {
    if (v.suggestedChange === null) return v
    const replacement = v.suggestedChange ?? ''

    const before = text.slice(0, v.startIndex)
    const articleMatch = before.match(/\b(a|an) $/i)
    if (!articleMatch) return v

    const afterChange = replacement + text.slice(v.endIndex)
    const firstWord = afterChange.trimStart().match(/^[^\s,;.!?]+/)?.[0]
    if (!firstWord) return v

    const file = articleProcessor.processSync(
      `${articleMatch[1]} ${firstWord}.`,
    )
    if (!file.messages.length) return v

    const correctArticle = (file.messages[0] as VFileMessage).expected?.[0]
    if (!correctArticle) return v

    const articleStart = v.startIndex - articleMatch[0].length
    return {
      ...v,
      startIndex: articleStart,
      endIndex: v.endIndex,
      matchedText: text.slice(articleStart, v.endIndex),
      suggestedChange: replacement
        ? `${correctArticle} ${replacement}`
        : correctArticle,
    }
  })
}

// Remove exact duplicates; suppress word-level violations fully contained within a
// larger phrase violation of the same rule (e.g. "crucial" inside "in a crucial way").
function deduplicateViolations(violations: Violation[]): Violation[] {
  const seen = new Set<string>()
  return violations.filter((v) => {
    const key = `${v.ruleId}:${v.startIndex}:${v.endIndex}`
    if (seen.has(key)) return false
    seen.add(key)
    const containedByLarger = violations.some(
      (other) =>
        other !== v &&
        other.ruleId === v.ruleId &&
        other.startIndex <= v.startIndex &&
        other.endIndex >= v.endIndex &&
        other.endIndex - other.startIndex > v.endIndex - v.startIndex,
    )
    return !containedByLarger
  })
}
