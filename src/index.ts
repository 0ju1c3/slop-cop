import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "slop-cop",
  version: "0.0.1",
});

server.registerTool(
    "detect_slop",
    {
      description: "Detect slop in a given text",
      inputSchema: {
        text: z
          .string()
          .describe("The text to detect slop in"),
      },
    },
    async ({ text }) => {
    //   const slop = detectSlop(text);
      return {
        content: [
          {
            type: "text",
            // text: `Slop detected: ${slop}`,
            text: 'hello world'
          },
        ],
      };
    },
  );
  
  server.registerTool(
    "fix_slop",
    {
      description: "Fix slop in a given text",
      inputSchema: {
        text: z
          .string()
          .describe("The text to fix slop in"),
      },
    },
    async ({ text }) => {
    //   const fixedText = fixSlop(text);
      return {
        content: [
          {
            type: "text",
            // text: fixedText,
            text: 'hello world',
          },
        ],
      };
    },
  );