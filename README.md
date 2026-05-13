# Slop Cop — MCP Server

An MCP server that detects and fixes LLM prose patterns in text. It exposes three tools to Claude Code, Claude Desktop, and any MCP-compatible host.

Built on the detection engine and browser app [slop-cop](https://awnist.com/slop-cop) by [awnist](https://github.com/awnist) that highlights these patterns in real time.

---

## Setup

### Claude Code

```bash
claude mcp add slop-cop -- npx -y @0ju1c3/slop-cop
```

That's it. No API key needed — uses your existing Claude Code login.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "slop-cop": {
      "command": "npx",
      "args": ["-y", "@0ju1c3/slop-cop"]
    }
  }
}
```

Restart Claude Desktop after saving.

### Prerequisites

- Node.js 18+
- Logged in to Claude Code (`claude login`) **or** `ANTHROPIC_API_KEY` set in your environment

---

## Authentication

No configuration required if you use Claude Code. The server reads your existing Claude Code credentials automatically:

| Platform | Source |
|---|---|
| macOS | Keychain entry `"Claude Code-credentials"` |
| Linux / Windows | `~/.claude/.credentials.json` |

If you prefer an explicit API key, set `ANTHROPIC_API_KEY` in the MCP server environment:

```json
{
  "mcpServers": {
    "slop-cop": {
      "command": "npx",
      "args": ["-y", "@0ju1c3/slop-cop"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}
```

---

## Tools

### `detect_slop`

Fast, instant detection using 36 regex and NLP rules. No API call, runs locally.

```
Use detect_slop on: "It is worth noting that this comprehensive solution
will fundamentally transform the landscape of modern development."
```

Returns a JSON array of violations:

```json
[
  {
    "ruleId": "important-to-note",
    "startIndex": 0,
    "endIndex": 18,
    "matchedText": "It is worth noting",
    "ruleName": "\"It's Important to Note\"",
    "category": "rhetorical",
    "tip": "Delete the phrase and just say the thing."
  },
  {
    "ruleId": "elevated-register",
    "matchedText": "fundamentally transform",
    "suggestedChange": "",
    ...
  }
]
```

**Best for:** auditing prose, feeding violation data into a larger workflow, quick checks inside Claude Code sessions.

---

### `detect_slop_full`

Runs all 36 client-side rules plus semantic analysis via the Anthropic API, catching the 12 patterns that require language understanding: sycophantic framing, throat-clearing, grandiose stakes, fractal summaries, and others.

```
Use detect_slop_full on: "And yes, I'll be honest — this challenge will
define the next era of computing for organizations that rise to meet it."
```

The LLM tier catches what regex can't:
- `false-vulnerability` — `"And yes, I'll be honest"` (performative candour)
- `grandiose-stakes` — `"define the next era of computing"` (inflated significance)

**Best for:** thorough audits of important prose before publishing.

---

### `fix_slop`

Detects violations and fixes them in two phases:

**Phase 1 — direct splices (instant, free):** Violations with a known replacement are applied as exact character-position substitutions — `"fosters"` → `"builds"`, `"moving forward"` → deleted, `"utilize"` → `"use"` — with no LLM call.

**Phase 2 — targeted LLM rewrite (only if needed):** Violations that require sentence restructuring (predicate adjectives, negation pivots) are rewritten paragraph-by-paragraph with rule-specific directives.

```
Use fix_slop on: "Ultimately, this transformative approach not only
streamlines workflows but also fosters a culture of innovation moving forward."
```

Returns: `"This approach simplifies workflows and builds a culture of innovation."`

**Best for:** cleaning up LLM-generated drafts before review, automating prose quality in content pipelines.

---

## Use Cases

### Passive quality gate in Claude Code

Add to your project's `CLAUDE.md`:

```markdown
After generating any prose longer than 3 sentences, run detect_slop
on it and revise flagged violations before responding.
```

This makes slop detection automatic. Claude audits its own output before you see it.

### Pre-publish audit

Before publishing a blog post, release notes, documentation, or other content generated with Claude's help:

```
Use detect_slop_full on the following draft: [paste text]
```

### Content pipeline quality check

`detect_slop` returns structured JSON with `ruleId`, `category`, `startIndex`, `endIndex`, and `suggestedChange`. Any script or agent that generates text can pipe it through `detect_slop` and fail if violation density exceeds a threshold.

### Inline editing

Ask Claude to run `fix_slop` on a specific paragraph you know sounds off. Phase 1 makes deterministic fixes; Phase 2 only fires if restructuring is genuinely needed.

---

## Patterns Detected

### Client-side — instant (36 rules)

| Pattern | What it catches |
|---|---|
| Overused Intensifier | `crucial`, `robust`, `pivotal`, `unprecedented`, `tapestry`, `nuanced`, `paradigm`, `leverage`, `delve`, and ~15 more |
| Elevated Register | `utilize` → use, `commence` → start, `facilitate`, `endeavor`, `demonstrate`, `craft`, `moving forward` |
| Filler Adverb | Sentence-opening `importantly`, `ultimately`, `essentially`, `fundamentally` |
| "Almost" Hedge | `almost always`, `almost certainly`, `almost never` |
| Era Opener | `In an era of…`, `In a world where…` |
| Metaphor Crutch | `double-edged sword`, `game changer`, `north star`, `deep dive`, `paradigm shift`, `perfect storm` |
| "It's Important to Note" | `it is important to note`, `it's worth noting`, `it should be noted` |
| "Broader Implications" | `broader implications`, `wider implications` |
| False Conclusion | `In conclusion`, `At the end of the day`, `To summarize`, `Moving forward` |
| Connector Addiction | Paragraph-opening `Furthermore`, `Moreover`, `Additionally`, `However`, `That said` |
| Unnecessary Contrast | `whereas`, `as opposed to`, `in contrast to`, `unlike` |
| Em-Dash Pivot | Excessive `—` and `–` pivots |
| Negation Pivot | `not X, but Y` / `not X — Y` constructions |
| Colon Elaboration | Short setup clause followed by long colon elaboration |
| Parenthetical Qualifier | Long parentheticals; comma-bracketed hedges (`of course`, `to be fair`, `admittedly`) |
| Question-Then-Answer | Rhetorical question immediately answered in the next sentence |
| Hedge Stack | Multiple epistemic hedges in one sentence (`perhaps`, `might`, `arguably`, `seemingly`) |
| Staccato Burst | Three or more consecutive short sentences for dramatic effect |
| Listicle Instinct | Bullet or numbered lists with exactly 3, 5, or 7 items |
| "Serves As" Dodge | `serves as`, `stands as`, `acts as`, `functions as` |
| "Not X. Not Y. Just Z." | Consecutive negation sentences building to a reveal |
| Anaphora Abuse | Three or more consecutive sentences with the same opener |
| Gerund Fragment Litany | Consecutive short sentences starting with gerunds |
| "Here's the Kicker" | `Here's the thing`, `Here's the kicker`, `Here's where it gets interesting` |
| Pedagogical Aside | `Let's break this down`, `Let's unpack`, `Think of it as` |
| "Imagine a World Where" | Hypothetical world-building openers |
| Listicle in a Trench Coat | Prose disguising a list via `The first…`, `The second…` |
| Vague Attribution | `experts argue`, `studies show`, `research suggests`, `many believe` |
| Bold-First Bullets | Bullet items formatted `**Term**: explanation` |
| Unicode Decoration | `→` used as a stylistic bullet or transition |
| "Despite Its Challenges" | `Despite these challenges`, `Despite its limitations` |
| Invented Concept Label | `the [word] paradox/trap/vacuum/inversion/chasm` — fake conceptual branding |
| Dramatic Fragment | One-to-four-word standalone paragraph used for emphasis |
| Superficial Analysis | `, [participle] its/the/their/this [importance/role/significance]` — empty summarizing phrase |
| False Range | Hollow `from X to Y` constructions; `doesn't emerge from nowhere` |
| Triple Construction | Exactly three parallel items: `X, Y, and Z` — the LLM default |

### Semantic — sentence-level (9 rules, via Claude Haiku)

Throat-Clearing Opener · Sycophantic Frame · Balanced Take · Unnecessary Elaboration · Empathy Performance · Pivot Paragraph · Grandiose Stakes · Historical Analogy Stack · False Vulnerability

### Semantic — document-level (3 rules, via Claude Haiku)

Dead Metaphor · One-Point Dilution · Fractal Summaries

---

## How It Works

Detection runs in two tiers:

**Client-side (36 rules):** Regex, structural analysis, and NLP via [compromise](https://github.com/spencermountain/compromise). Runs entirely locally, so it's instant, costs nothing, and makes no API calls.

**Semantic (12 rules):** API call to `claude-haiku-4-5-20251001`. Only runs when you call `detect_slop_full` or when `fix_slop` needs to restructure a sentence that a direct splice can't fix.

`fix_slop` uses a two-phase approach. It first applies all deterministic string splices at no cost, then calls the LLM only for violations that require sentence restructuring. Many texts are fully fixed in Phase 1 alone.

### AI Detection Flow

`detect_slop_full` and `fix_slop` call an LLM for semantic analysis and paragraph rewrites. The server tries two paths in order.

**MCP sampling first.** The server calls `sampling/createMessage`, which asks the MCP host to run a model on its behalf. This is part of the MCP spec. Neither Claude Code nor Claude Desktop implements it; both return `-32601: Method not found`. The code keeps the attempt for forward compatibility with compliant hosts.

**Direct Anthropic API as fallback.** When sampling fails, the server calls `https://api.anthropic.com/v1/messages` with `claude-haiku-4-5-20251001`, authenticating with Claude Code's stored OAuth token. No separate API key is required.

Credentials are resolved in this order:
1. `ANTHROPIC_AUTH_TOKEN` or `CLAUDE_CODE_OAUTH_TOKEN` env vars
2. macOS Keychain: `"Claude Code-credentials"` entry, field `claudeAiOauth.accessToken`
3. `~/.claude/.credentials.json` on Linux and Windows
4. `ANTHROPIC_API_KEY` env var

If none resolves, `detect_slop_full` and `fix_slop` return an error. `detect_slop` runs entirely locally and is not affected.

---

## Building from Source

```bash
git clone https://github.com/0ju1c3/slop-cop
cd slop-cop
npm install
npm run build   # compiles TypeScript → build/
```

To use the local build instead of the npm package:

**Claude Code:**
```bash
claude mcp add slop-cop -- node /path/to/slop-cop/build/index.js
```

**Claude Desktop:**
```json
{
  "mcpServers": {
    "slop-cop": {
      "command": "node",
      "args": ["/path/to/slop-cop/build/index.js"]
    }
  }
}
```

---

## License

MIT — see [LICENSE](LICENSE).

Detection engine derived from [slop-cop](https://awnist.com/slop-cop) by [awnist](https://github.com/awnist), MIT licensed.

Pattern taxonomy based on [LLM_PROSE_TELLS.md](https://git.eeqj.de/sneak/prompts/src/branch/main/prompts/LLM_PROSE_TELLS.md), [Wikipedia: Signs of AI Writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), and [tropes.md](https://tropes.fyi/tropes-md).
