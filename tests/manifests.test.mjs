import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

test("marketplace entries are unique and point to matching plugins", async () => {
  const marketplace = await json(".claude-plugin/marketplace.json");
  const names = marketplace.plugins.map((plugin) => plugin.name);

  assert.equal(new Set(names).size, names.length);

  for (const entry of marketplace.plugins) {
    assert.match(entry.source, /^\.\/plugins\/[a-z0-9-]+$/);
    const pluginRoot = path.join(root, entry.source);
    assert.ok((await stat(pluginRoot)).isDirectory());

    const manifest = JSON.parse(
      await readFile(path.join(pluginRoot, ".claude-plugin/plugin.json"), "utf8"),
    );
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, entry.version);
  }
});

test("Agrenting plugin uses one securely configured user key", async () => {
  const manifest = await json("plugins/agrenting/.claude-plugin/plugin.json");
  const option = manifest.userConfig.agrenting_api_key;

  assert.equal(option.type, "string");
  assert.equal(option.sensitive, true);
  assert.equal(option.required, true);

  const mcp = await json("plugins/agrenting/.mcp.json");
  const server = mcp.mcpServers.agrenting;

  assert.equal(server.type, "http");
  assert.equal(server.url, "https://agrenting.com/mcp/hirer");
  assert.equal(
    server.headers.Authorization,
    "Bearer ${user_config.agrenting_api_key}",
  );

  const registry = await json("plugins/agrenting/server.json");
  assert.ok(registry.description.length <= 100);
  assert.equal(registry.remotes[0].type, "streamable-http");
  assert.equal(registry.remotes[0].url, "https://agrenting.com/mcp/hirer");
  assert.equal(
    registry.remotes[0].headers[0].variables.agrenting_api_key.isSecret,
    true,
  );
});

test("Agrenting workflow covers discovery through result retrieval", async () => {
  const hire = await readFile(
    path.join(root, "plugins/agrenting/skills/hire/SKILL.md"),
    "utf8",
  );
  const status = await readFile(
    path.join(root, "plugins/agrenting/skills/status/SKILL.md"),
    "utf8",
  );

  for (const tool of [
    "list_agents",
    "check_balance",
    "hire_agent",
    "get_hiring_status",
    "wait_for_hirings",
    "answer_hiring_question",
    "list_hiring_artifacts",
    "download_artifact",
  ]) {
    assert.match(`${hire}\n${status}`, new RegExp(`\\b${tool}\\b`));
  }

  assert.match(hire, /explicit approval/i);
  assert.match(hire, /every paid hire separately/i);
  assert.match(hire, /do not substitute automatically/i);
  assert.match(hire, /open_questions/);
  assert.match(`${hire}\n${status}`, /known_question_ids/);
  assert.match(hire, /idempotency_key/);
  assert.match(hire, /cannot see the caller's local working tree/i);
});

test("repository never contains a literal Agrenting API key", async () => {
  const files = [
    "README.md",
    "plugins/agrenting/.mcp.json",
    "plugins/agrenting/.claude-plugin/plugin.json",
    "plugins/agrenting/server.json",
    "plugins/agrenting/README.md",
    "plugins/agrenting/skills/hire/SKILL.md",
    "plugins/agrenting/skills/status/SKILL.md",
  ];

  for (const file of files) {
    const content = await readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(content, /ap_[A-Za-z0-9_-]{20,}/, file);
  }
});
