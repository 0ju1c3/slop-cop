import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { RULES, RULES_BY_ID } from './rules.js';
import { runClientDetectors } from './slop-detectors/index.js';
const server = new McpServer({
    name: 'slop-cop',
    version: '1.0.0',
});
function enrichViolations(violations) {
    return violations.map((v) => ({
        ...v,
        ruleName: RULES_BY_ID[v.ruleId]?.name,
        category: RULES_BY_ID[v.ruleId]?.category,
        tip: RULES_BY_ID[v.ruleId]?.tip,
    }));
}
function buildLLMDetectionPrompt() {
    const sentenceRules = RULES.filter((r) => r.llmTier === 'sentence');
    const documentRules = RULES.filter((r) => r.llmTier === 'document');
    const formatRules = (rules) => rules
        .map((r, i) => `${i + 1}. "${r.id}": ${r.llmDetectionHint ?? r.description}`)
        .join('\n\n');
    return `Identify these sentence/paragraph-level patterns:\n\n${formatRules(sentenceRules)}\n\nAlso identify these document-level patterns:\n\n${formatRules(documentRules)}\n\nReturn a JSON array. Each item: {"ruleId": string, "matchedText": string (exact quote from the text), "explanation": string, "suggestedChange": string (replacement or "" to delete)}. Return [] if none found. Return ONLY the JSON array, no other text.`;
}
const REWRITE_DEFAULT_RULE_IDS = [
    'elevated-register',
    'filler-adverbs',
    'hedge-stack',
    'unnecessary-elaboration',
    'grandiose-stakes',
    'em-dash-pivot',
    'balanced-take',
];
const REWRITE_META_PRINCIPLES = [
    '- Write directly. Cut preamble and throat-clearing.',
    "- Don't add explanations or transitions the original didn't have.",
    "- Preserve the paragraph's factual content and core meaning exactly.",
];
function buildRewriteSystemPrompt(ruleHints) {
    const defaultDirectives = REWRITE_DEFAULT_RULE_IDS.flatMap((id) => {
        const directive = RULES_BY_ID[id]?.llmDirective;
        return directive ? [`- ${directive}`] : [];
    });
    const principles = [...defaultDirectives, ...REWRITE_META_PRINCIPLES].join('\n');
    const ruleSection = ruleHints.length > 0
        ? `\n\nThis text has specific problems to fix:\n${ruleHints.map((h) => `- ${h}`).join('\n')}`
        : '';
    return `You are an expert editor. Rewrite the given text to read like natural, direct human prose. Apply all of these principles:\n${principles}${ruleSection}\n\nReturn ONLY the rewritten text. No preamble, no explanation.`;
}
function splitParagraphs(text) {
    const paras = [];
    let pos = 0;
    for (const para of text.split('\n\n')) {
        paras.push({ text: para, start: pos, end: pos + para.length });
        pos += para.length + 2;
    }
    return paras;
}
// Precedence (mirrors Claude Code's own auth chain):
//   1. ANTHROPIC_AUTH_TOKEN env var  (Bearer token — e.g. from `claude setup-token`)
//   2. CLAUDE_CODE_OAUTH_TOKEN env var (same format, alternative var name)
//   3. macOS Keychain "Claude Code-credentials" (zero-config on Mac)
//   4. ~/.claude/.credentials.json   (zero-config on Linux/Windows)
// Returns { token, header } or null if nothing found.
function resolveClaudeAuth() {
    const bearer = process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.CLAUDE_CODE_OAUTH_TOKEN;
    if (bearer)
        return { token: bearer, header: 'bearer' };
    // macOS Keychain (zero-config)
    if (process.platform === 'darwin') {
        try {
            const raw = execSync('security find-generic-password -s "Claude Code-credentials" -w', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
            const token = JSON.parse(raw)?.claudeAiOauth?.accessToken;
            if (token)
                return { token, header: 'bearer' };
        }
        catch {
            /* keychain unavailable or no entry */
        }
    }
    // Linux / Windows credentials file (zero-config)
    try {
        const configDir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude');
        const raw = readFileSync(join(configDir, '.credentials.json'), 'utf8');
        const token = JSON.parse(raw)?.claudeAiOauth?.accessToken;
        if (token)
            return { token, header: 'bearer' };
    }
    catch {
        /* file not present */
    }
    // Explicit API key (traditional)
    if (process.env.ANTHROPIC_API_KEY)
        return { token: process.env.ANTHROPIC_API_KEY, header: 'apikey' };
    return null;
}
async function sample(systemPrompt, userPrompt, maxTokens = 4096) {
    // 1. Try MCP sampling — works for any MCP host that declares the sampling capability.
    //    Neither Claude Desktop nor Claude Code currently implement it (both return -32601),
    //    but we try first so the server works correctly with compliant hosts in future.
    try {
        const response = await server.server.createMessage({
            messages: [{ role: 'user', content: { type: 'text', text: userPrompt } }],
            systemPrompt,
            maxTokens,
        });
        if (response.content.type !== 'text')
            return '';
        return response.content.text;
    }
    catch {
        // Host doesn't support sampling — fall through to direct API
    }
    // 2. Direct Anthropic API using Claude Code's own credentials (zero config).
    //    Auth precedence mirrors Claude Code's own chain:
    //      ANTHROPIC_AUTH_TOKEN / CLAUDE_CODE_OAUTH_TOKEN env vars
    //      → macOS Keychain "Claude Code-credentials"
    //      → ~/.claude/.credentials.json  (Linux / Windows)
    //      → ANTHROPIC_API_KEY env var
    const auth = resolveClaudeAuth();
    if (!auth) {
        throw new Error('No credentials found. Ensure you are logged in to Claude Code (`claude login`), ' +
            'or set ANTHROPIC_API_KEY in the MCP server env config.');
    }
    const headers = {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        ...(auth.header === 'bearer'
            ? { authorization: `Bearer ${auth.token}` }
            : { 'x-api-key': auth.token }),
    };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body}`);
    }
    const data = (await res.json());
    const block = data.content.find((b) => b.type === 'text');
    return block?.text ?? '';
}
server.registerTool('detect_slop', {
    description: 'Detect LLM prose patterns (slop) in text using fast regex and NLP detectors. Returns violations with matched text, rule name, category, and fix tip. Instant — no API call needed.',
    inputSchema: {
        text: z.string().describe('The text to analyze for slop patterns'),
    },
}, async ({ text }) => {
    const violations = runClientDetectors(text);
    const enriched = enrichViolations(violations);
    return {
        content: [
            {
                type: 'text',
                text: enriched.length === 0
                    ? 'No slop patterns detected.'
                    : JSON.stringify(enriched, null, 2),
            },
        ],
    };
});
server.registerTool('detect_slop_full', {
    description: 'Detect slop patterns using both fast regex/NLP detectors and semantic LLM analysis via MCP sampling. Catches all 48 rules including subtle patterns like throat-clearing, grandiose stakes, and fractal summaries that regex cannot detect. Slower than detect_slop due to the sampling call.',
    inputSchema: {
        text: z.string().describe('The text to analyze for slop patterns'),
    },
}, async ({ text }) => {
    const clientViolations = runClientDetectors(text);
    const llmViolations = [];
    try {
        const raw = await sample(`You are an expert editor analyzing text for LLM-generated prose patterns. Be conservative — only flag clear, unambiguous instances.`, `${buildLLMDetectionPrompt()}\n\nText to analyze:\n\n${text}`, 4096);
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const items = JSON.parse(jsonMatch[0]);
            for (const item of items) {
                if (!item.ruleId || !item.matchedText)
                    continue;
                const idx = text.indexOf(item.matchedText);
                if (idx === -1)
                    continue;
                llmViolations.push({
                    ruleId: item.ruleId,
                    startIndex: idx,
                    endIndex: idx + item.matchedText.length,
                    matchedText: item.matchedText,
                    explanation: item.explanation,
                    suggestedChange: item.suggestedChange ?? null,
                });
            }
        }
    }
    catch (err) {
        return {
            content: [
                {
                    type: 'text',
                    text: `detect_slop_full: LLM analysis failed — ${err instanceof Error ? err.message : String(err)}\n\nClient-side results only:\n\n${JSON.stringify(enrichViolations(clientViolations), null, 2)}`,
                },
            ],
            isError: true,
        };
    }
    const all = enrichViolations([...clientViolations, ...llmViolations]);
    return {
        content: [
            {
                type: 'text',
                text: all.length === 0
                    ? 'No slop patterns detected.'
                    : JSON.stringify(all, null, 2),
            },
        ],
    };
});
server.registerTool('fix_slop', {
    description: 'Rewrite text to remove detected slop patterns. Detects violations, then uses MCP sampling to rewrite each flagged paragraph with directives targeting the exact violations found. Returns the full rewritten text.',
    inputSchema: {
        text: z.string().describe('The text to fix'),
    },
}, async ({ text }) => {
    const violations = runClientDetectors(text);
    // ── Phase 1: direct string splices ───────────────────────────────────────
    // Violations with a string suggestedChange (including "" for deletion) are
    // applied as exact character-position splices — no LLM needed.
    // Sort end-to-start so earlier splices don't shift later indices.
    const directFixes = violations
        .filter((v) => typeof v.suggestedChange === 'string')
        .sort((a, b) => b.startIndex - a.startIndex);
    let fixed = text;
    for (const v of directFixes) {
        fixed =
            fixed.slice(0, v.startIndex) +
                v.suggestedChange +
                fixed.slice(v.endIndex);
    }
    // Clean up splice artifacts
    fixed = fixed.replace(/[ \t]{2,}/g, ' ').replace(/ ([.,;:!?])/g, '$1');
    // ── Phase 2: LLM rewrite for what remains ────────────────────────────────
    // Re-detect on the spliced text (positions are fresh). Only violations with
    // null/undefined suggestedChange need LLM — these are cases where a blind
    // deletion would break the sentence (predicate adjective, dangling modifier).
    const remaining = runClientDetectors(fixed).filter((v) => v.suggestedChange == null);
    if (remaining.length === 0) {
        return { content: [{ type: 'text', text: fixed }] };
    }
    const paragraphs = splitParagraphs(fixed);
    const rewrittenParts = [];
    for (const para of paragraphs) {
        const paraViolations = remaining.filter((v) => v.startIndex >= para.start && v.endIndex <= para.end + 2);
        if (paraViolations.length === 0) {
            rewrittenParts.push(para.text);
            continue;
        }
        const byRule = new Map();
        for (const v of paraViolations) {
            if (!byRule.has(v.ruleId))
                byRule.set(v.ruleId, []);
            byRule.get(v.ruleId)?.push(v.matchedText.trim());
        }
        const ruleHints = [];
        for (const [ruleId, matches] of byRule) {
            const directive = RULES_BY_ID[ruleId]?.llmDirective ?? RULES_BY_ID[ruleId]?.tip;
            if (!directive)
                continue;
            const cited = matches
                .slice(0, 4)
                .map((m) => `"${m.length > 70 ? `${m.slice(0, 70)}…` : m}"`)
                .join(', ');
            ruleHints.push(`${directive} — flagged: ${cited}`);
        }
        try {
            const rewritten = await sample(buildRewriteSystemPrompt(ruleHints), para.text, 2048);
            rewrittenParts.push(rewritten.trim());
        }
        catch (err) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `fix_slop: rewrite failed — ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
                isError: true,
            };
        }
    }
    return {
        content: [{ type: 'text', text: rewrittenParts.join('\n\n') }],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Slop Cop MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
