import nlp from './nlp-instance.js'
import type { Violation } from '../types.js'
import {
  detectContextualSlop,
  detectVerbIntensifierForms,
  detectTripleConstruction,
  detectShortHookParagraph,
} from './nlp-patterns.js'
import {
  detectHighlightSlop,
  detectOverusedIntensifiers,
  detectElevatedRegister,
  detectFillerAdverbs,
  detectAlmostHedge,
  detectEraOpener,
  detectMetaphorCrutch,
  detectImportantToNote,
  detectBroaderImplications,
  detectFalseConclusion,
  detectConnectorAddiction,
  detectUnnecessaryContrast,
  detectEmDashPivot,
  detectNegationPivot,
  detectColonElaboration,
  detectParentheticalQualifier,
  detectQuestionThenAnswer,
  detectHedgeStack,
  detectStaccatoBurst,
  detectListicleInstinct,
  detectServesAs,
  detectNegationCountdown,
  detectAnaphoraAbuse,
  detectGerundLitany,
  detectHeresTheKicker,
  detectPedagogicalAside,
  detectImagineWorld,
  detectListicleTrenchCoat,
  detectVagueAttribution,
  detectBoldFirstBullets,
  detectUnicodeArrows,
  detectDespiteChallenges,
  detectConceptLabel,
  detectDramaticFragment,
  detectSuperficialAnalysis,
  detectFalseRange,
} from './word-patterns.js'

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
  return suppressUnsafeDeletions(deduplicateViolations(all), text)
}

// Linking verbs that introduce a predicate adjective — deleting the adjective
// directly after one of these leaves a broken sentence.
const LINKING_VERB_RE = /\b(is|was|are|were|am|be|been|being|becomes?|became|remains?|remained|seems?|appeared?|appears?|looks?|felt|feels?|sounds?|gets?|got)\s+$/i

// Suppress unsafe deletions for adjective-position violations:
// 1. Predicate adjective ("distinction is vital for X") — linking verb before violation
// 2. Dangling modifier ("most comprehensive overview") — degree modifier/adverb before violation
// Both cases set suggestedChange: null so Claude knows to rewrite rather than delete.
function suppressUnsafeDeletions(violations: Violation[], text: string): Violation[] {
  return violations.map(v => {
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

// Remove exact duplicates; suppress word-level violations fully contained within a
// larger phrase violation of the same rule (e.g. "crucial" inside "in a crucial way").
function deduplicateViolations(violations: Violation[]): Violation[] {
  const seen = new Set<string>()
  return violations.filter(v => {
    const key = `${v.ruleId}:${v.startIndex}:${v.endIndex}`
    if (seen.has(key)) return false
    seen.add(key)
    const containedByLarger = violations.some(
      other =>
        other !== v &&
        other.ruleId === v.ruleId &&
        other.startIndex <= v.startIndex &&
        other.endIndex >= v.endIndex &&
        (other.endIndex - other.startIndex) > (v.endIndex - v.startIndex),
    )
    return !containedByLarger
  })
}
