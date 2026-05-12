import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runClientDetectors } from "./slop-detectors/index.js";
import { RULES, RULES_BY_ID } from "./rules.js";
import type { Violation } from "./types.js";

const server = new McpServer({
  name: "slop-cop",
  version: "1.0.0",
});

function enrichViolations(violations: Violation[]) {
  return violations.map(v => ({
    ...v,
    ruleName: RULES_BY_ID[v.ruleId]?.name,
    category: RULES_BY_ID[v.ruleId]?.category,
    tip: RULES_BY_ID[v.ruleId]?.tip,
  }))
}

function buildLLMDetectionPrompt(): string {
  const sentenceRules = RULES.filter(r => r.llmTier === 'sentence')
  const documentRules = RULES.filter(r => r.llmTier === 'document')
  const formatRules = (rules: typeof RULES) =>
    rules.map((r, i) => `${i + 1}. "${r.id}": ${r.llmDetectionHint ?? r.description}`).join('\n\n')
  return `Identify these sentence/paragraph-level patterns:\n\n${formatRules(sentenceRules)}\n\nAlso identify these document-level patterns:\n\n${formatRules(documentRules)}\n\nReturn a JSON array. Each item: {"ruleId": string, "matchedText": string (exact quote from the text), "explanation": string, "suggestedChange": string (replacement or "" to delete)}. Return [] if none found. Return ONLY the JSON array, no other text.`
}

const REWRITE_DEFAULT_RULE_IDS = [
  'elevated-register', 'filler-adverbs', 'hedge-stack',
  'unnecessary-elaboration', 'grandiose-stakes', 'em-dash-pivot', 'balanced-take',
]
const REWRITE_META_PRINCIPLES = [
  '- Write directly. Cut preamble and throat-clearing.',
  "- Don't add explanations or transitions the original didn't have.",
  "- Preserve the paragraph's factual content and core meaning exactly.",
]

function buildRewriteSystemPrompt(ruleHints: string[]): string {
  const defaultDirectives = REWRITE_DEFAULT_RULE_IDS
    .flatMap(id => {
      const directive = RULES_BY_ID[id]?.llmDirective
      return directive ? [`- ${directive}`] : []
    })
  const principles = [...defaultDirectives, ...REWRITE_META_PRINCIPLES].join('\n')
  const ruleSection = ruleHints.length > 0
    ? `\n\nThis text has specific problems to fix:\n${ruleHints.map(h => `- ${h}`).join('\n')}`
    : ''
  return `You are an expert editor. Rewrite the given text to read like natural, direct human prose. Apply all of these principles:\n${principles}${ruleSection}\n\nReturn ONLY the rewritten text. No preamble, no explanation.`
}

function splitParagraphs(text: string): Array<{ text: string; start: number; end: number }> {
  const paras: Array<{ text: string; start: number; end: number }> = []
  let pos = 0
  for (const para of text.split('\n\n')) {
    paras.push({ text: para, start: pos, end: pos + para.length })
    pos += para.length + 2
  }
  return paras
}

async function sample(systemPrompt: string, userPrompt: string, maxTokens = 4096): Promise<string> {
  const response = await (server as any).server.createMessage({
    messages: [{ role: 'user', content: { type: 'text', text: userPrompt } }],
    systemPrompt,
    maxTokens,
  })
  if (response.content.type !== 'text') return ''
  return response.content.text
}

server.registerTool(
  "detect_slop",
  {
    description: "Detect LLM prose patterns (slop) in text using fast regex and NLP detectors. Returns violations with matched text, rule name, category, and fix tip. Instant — no API call needed.",
    inputSchema: {
      text: z.string().describe("The text to analyze for slop patterns"),
    },
  },
  async ({ text }) => {
    const violations = runClientDetectors(text)
    const enriched = enrichViolations(violations)
    return {
      content: [{
        type: "text",
        text: enriched.length === 0
          ? "No slop patterns detected."
          : JSON.stringify(enriched, null, 2),
      }],
    }
  },
)

server.registerTool(
  "detect_slop_full",
  {
    description: "Detect slop patterns using both fast regex/NLP detectors and semantic LLM analysis via MCP sampling. Catches all 48 rules including subtle patterns like throat-clearing, grandiose stakes, and fractal summaries that regex cannot detect. Slower than detect_slop due to the sampling call.",
    inputSchema: {
      text: z.string().describe("The text to analyze for slop patterns"),
    },
  },
  async ({ text }) => {
    const clientViolations = runClientDetectors(text)

    let llmViolations: Violation[] = []
    try {
      const raw = await sample(
        `You are an expert editor analyzing text for LLM-generated prose patterns. Be conservative — only flag clear, unambiguous instances.`,
        `${buildLLMDetectionPrompt()}\n\nText to analyze:\n\n${text}`,
        4096,
      )
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]) as Array<{
          ruleId: string; matchedText: string; explanation: string; suggestedChange: string
        }>
        for (const item of items) {
          if (!item.ruleId || !item.matchedText) continue
          const idx = text.indexOf(item.matchedText)
          if (idx === -1) continue
          llmViolations.push({
            ruleId: item.ruleId,
            startIndex: idx,
            endIndex: idx + item.matchedText.length,
            matchedText: item.matchedText,
            explanation: item.explanation,
            suggestedChange: item.suggestedChange ?? null,
          })
        }
      }
    } catch {
      //TODO: Handle this error
    }

    const all = enrichViolations([...clientViolations, ...llmViolations])
    return {
      content: [{
        type: "text",
        text: all.length === 0
          ? "No slop patterns detected."
          : JSON.stringify(all, null, 2),
      }],
    }
  },
)

server.registerTool(
  "fix_slop",
  {
    description: "Rewrite text to remove detected slop patterns. Detects violations, then uses MCP sampling to rewrite each flagged paragraph with directives targeting the exact violations found. Returns the full rewritten text.",
    inputSchema: {
      text: z.string().describe("The text to fix"),
    },
  },
  async ({ text }) => {
    const violations = runClientDetectors(text)
    const paragraphs = splitParagraphs(text)
    const rewrittenParts: string[] = []

    for (const para of paragraphs) {
      const paraViolations = violations.filter(
        v => v.startIndex >= para.start && v.endIndex <= para.end + 2
      )

      if (paraViolations.length === 0) {
        rewrittenParts.push(para.text)
        continue
      }

      const byRule = new Map<string, string[]>()
      for (const v of paraViolations) {
        if (!byRule.has(v.ruleId)) byRule.set(v.ruleId, [])
        byRule.get(v.ruleId)!.push(v.matchedText.trim())
      }

      const ruleHints: string[] = []
      for (const [ruleId, matches] of byRule) {
        const directive = RULES_BY_ID[ruleId]?.llmDirective ?? RULES_BY_ID[ruleId]?.tip
        if (!directive) continue
        const cited = matches.slice(0, 4)
          .map(m => `"${m.length > 70 ? m.slice(0, 70) + '…' : m}"`)
          .join(', ')
        ruleHints.push(`${directive} — flagged: ${cited}`)
      }

      try {
        const rewritten = await sample(buildRewriteSystemPrompt(ruleHints), para.text, 2048)
        rewrittenParts.push(rewritten.trim())
      } catch {
        rewrittenParts.push(para.text)
      }
    }

    return {
      content: [{
        type: "text",
        text: rewrittenParts.join('\n\n'),
      }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Slop Cop MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
