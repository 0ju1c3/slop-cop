export interface Violation {
    ruleId: string
    startIndex: number
    endIndex: number
    matchedText: string
    explanation?: string
    suggestedChange?: string | null  // null = explicitly no action (don't fall back to canRemove deletion)
    // When present, Apply uses this range + applyReplacement instead of the highlight span.
    // Allows highlighting just the problematic text while acting on a wider context
    // (e.g. highlight "For instance," but also remove the boundary and capitalize next word).
    applyStartIndex?: number
    applyEndIndex?: number
    applyReplacement?: string
  }