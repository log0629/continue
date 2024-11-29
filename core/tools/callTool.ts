import { ContextItem, ToolExtras } from "..";
import MCPConnectionSingleton from "../context/mcp";
import { BuiltInToolNames } from "./builtIn";
import { createNewFileImpl } from "./implementations/createNewFile";
import { exactSearchImpl } from "./implementations/exactSearch";
import { readFileImpl } from "./implementations/readFile";
import { runTerminalCommandImpl } from "./implementations/runTerminalCommand";
import { searchWebImpl } from "./implementations/searchWeb";
import { viewDiffImpl } from "./implementations/viewDiff";
import { viewRepoMapImpl } from "./implementations/viewRepoMap";
import { viewSubdirectoryImpl } from "./implementations/viewSubdirectory";

async function callHttpTool(
  url: string,
  args: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const response = await extras.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      arguments: args,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to call tool: ${url}`);
  }

  const data = await response.json();
  return data.output;
}

async function callToolFromUri(
  uri: string,
  args: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  const canParse = URL.canParse(uri);
  if (!canParse) {
    throw new Error(`Invalid URI: ${uri}`);
  }
  const parsedUri = URL.parse(uri)!;

  switch (parsedUri?.protocol) {
    case "http:":
    case "https:":
      return callHttpTool(uri, args, extras);
    case "mcp:":
      const client = await MCPConnectionSingleton.getExistingInstance();
      if (!client) {
        throw new Error("MCP connection not found");
      }
      const toolName = parsedUri!.hostname;
      const response = await client.client.callTool({
        name: toolName,
        arguments: args,
      });

      if (response.isError === true) {
        throw new Error(`Failed to call tool: ${toolName}`);
      }

      return (response.content as any).map((item: any) => {
        if (item.type !== "text") {
          throw new Error(
            `Continue received item of type "${item.type}" from MCP tool, but currently only supports "text".`,
          );
        }
        return { name: toolName, description: toolName, content: item.text };
      });

    default:
      throw new Error(`Unsupported protocol: ${parsedUri?.protocol}`);
  }
}

export async function callTool(
  uri: string,
  args: any,
  extras: ToolExtras,
): Promise<ContextItem[]> {
  switch (uri) {
    case BuiltInToolNames.ReadFile:
      return await readFileImpl(args, extras);
    case BuiltInToolNames.CreateNewFile:
      return await createNewFileImpl(args, extras);
    case BuiltInToolNames.ExactSearch:
      return await exactSearchImpl(args, extras);
    case BuiltInToolNames.RunTerminalCommand:
      return await runTerminalCommandImpl(args, extras);
    case BuiltInToolNames.SearchWeb:
      return await searchWebImpl(args, extras);
    case BuiltInToolNames.ViewDiff:
      return await viewDiffImpl(args, extras);
    case BuiltInToolNames.ViewRepoMap:
      return await viewRepoMapImpl(args, extras);
    case BuiltInToolNames.ViewSubdirectory:
      return await viewSubdirectoryImpl(args, extras);
    default:
      return await callToolFromUri(uri, args, extras);
  }
}
