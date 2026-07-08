import {
  buildInitPreview,
  type InitScope,
  type InitTarget,
  type ServerRegistry
} from "@mcp-hub/core";

const readOption = (args: string[], name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

export const runInitCommand = (
  registry: ServerRegistry,
  args: string[],
  stdout: Pick<typeof console, "log"> = console
) => {
  const target = readOption(args, "--target") as InitTarget | undefined;
  const serverId = readOption(args, "--server");
  const scope = (readOption(args, "--scope") ?? "project") as InitScope;
  const write = args.includes("--write");

  if (!target || !serverId) {
    throw new Error(
      "Usage: mcp-hub init --target <target> --server <server-id> [--scope project|user] [--write]"
    );
  }

  const preview = buildInitPreview({
    target,
    scope,
    server: registry.get(serverId),
    commandMode: "npx",
    packageName: "mcp-hub"
  });

  if (write) {
    throw new Error(
      "init --write file merging is implemented after preview generation tests pass"
    );
  }

  stdout.log(`# ${preview.path}`);
  stdout.log(preview.content);
};
