export type ViolationCategory =
  | 'word-choice'
  | 'sentence-structure'
  | 'rhetorical'
  | 'structural'
  | 'framing'

export interface ViolationRule {
  id: string
  name: string
  category: ViolationCategory
  description: string
  tip: string
  requiresLLM: boolean
  llmTier?: 'sentence' | 'document'
  llmDetectionHint?: string
  llmDirective?: string
}

export interface Violation {
  ruleId: string
  startIndex: number
  endIndex: number
  matchedText: string
  explanation?: string
  suggestedChange?: string | null  // null = explicitly no action (no replacement)
}