import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function frontmatterDescription(markdown) {
  return markdown.match(/^description: (.+)$/m)?.[1] ?? "";
}

// The text under a "## " heading, up to the next "## " heading ("" if the heading is gone).
function section(markdown, heading) {
  const start = markdown.indexOf(`${heading}\n`);
  if (start === -1) return "";
  const rest = markdown.slice(start + heading.length);
  const end = rest.indexOf("\n## ");
  return end === -1 ? rest : rest.slice(0, end);
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
  assert.match(hire, /For independent hires, handle every paid hire separately/i);
  assert.match(hire, /rules are for independent hires only/i);
  assert.match(hire, /\/agrenting:swarm/);
  assert.match(status, /\bget_swarm_status\b/);
  assert.match(status, /team id/i);
  assert.match(hire, /do not substitute automatically/i);
  assert.match(hire, /open_questions/);
  assert.match(`${hire}\n${status}`, /known_question_ids/);
  assert.match(hire, /idempotency_key/);
  assert.match(hire, /cannot see the caller's local working tree/i);
});

test("swarm skill hires a team with one approval", async () => {
  const swarm = await readFile(
    path.join(root, "plugins/agrenting/skills/swarm/SKILL.md"),
    "utf8",
  );
  const description = swarm.match(/^description: (.+)$/m)?.[1] ?? "";

  assert.match(swarm, /^---\nname: swarm\n/);
  for (const phrase of [
    "hire_swarm",
    "get_swarm_status",
    "suggest_team",
    "list_saved_teams",
    "list_team_listings",
    "team_listing_id",
    "one approval",
    "idempotency_key",
    "10 minutes",
  ]) {
    assert.ok(
      swarm.toLowerCase().includes(phrase.toLowerCase()),
      `swarm skill missing ${phrase}`,
    );
  }
  for (const tool of [
    "list_agents",
    "check_balance",
    "answer_hiring_question",
    "cancel_swarm",
    "known_question_ids",
  ]) {
    assert.match(swarm, new RegExp(`\\b${tool}\\b`));
  }
  assert.match(swarm, /wait_seconds: 25/);
  assert.match(swarm, /deliverable first/i);
  assert.match(swarm, /Never add, drop or replace an agent without asking/i);
  assert.ok(swarm.includes("/agrenting:status <team id>"));
  assert.ok(swarm.includes("/agrenting:hire"));
  assert.doesNotMatch(swarm, /\{\{/);
  for (const trigger of [
    "hire a team",
    "hire a remote agent team",
    "do this as a team",
    "teamwork",
    "swarm",
  ]) {
    assert.ok(
      description.toLowerCase().includes(trigger),
      `swarm description missing trigger "${trigger}"`,
    );
  }
});

test("hire skill description routes a team to the swarm skill", async () => {
  const hire = await readFile(
    path.join(root, "plugins/agrenting/skills/hire/SKILL.md"),
    "utf8",
  );

  assert.ok(
    frontmatterDescription(hire).includes("use the swarm skill instead"),
    "hire description must send a team request to the swarm skill",
  );
});

test("swarm skill keeps its approval, ready-made hire and scope guidance", async () => {
  const swarm = await readFile(
    path.join(root, "plugins/agrenting/skills/swarm/SKILL.md"),
    "utf8",
  );
  const approval = section(swarm, "## Get one approval");
  const build = section(swarm, "## Build the team");
  const hire = section(swarm, "## Hire the team");

  assert.ok(
    approval.includes("This one approval covers every agent in the team"),
    "swarm skill must keep the Get one approval section and its coverage rule",
  );
  assert.ok(
    hire.includes("`team_listing_id` for a ready-made team"),
    "Hire the team must name team_listing_id for a ready-made team",
  );
  assert.ok(
    build.includes("its `fingerprint` as `team_listing_fingerprint`"),
    "Build the team must take the listed team's fingerprint",
  );
  assert.ok(
    hire.includes(
      "`team_listing_fingerprint` set to the team's fingerprint from `list_team_listings`",
    ),
    "Hire the team must send team_listing_fingerprint from list_team_listings",
  );
  assert.ok(
    hire.includes("`listing_changed`"),
    "Hire the team must say what to do when the listed team changed",
  );
  assert.ok(
    hire.includes("`suggest_team` and `list_team_listings` need `agents:discover`"),
    "Hire the team must name agents:discover for list_team_listings",
  );
});

test("plugin README documents teams and counts a team as one hire", async () => {
  const readme = (
    await readFile(path.join(root, "plugins/agrenting/README.md"), "utf8")
  ).replace(/\s+/g, " ");

  for (const phrase of [
    "## Teams",
    "list_team_listings",
    "team_listing_id",
    "a team hire counts as one hire at its total",
  ]) {
    assert.ok(readme.includes(phrase), `plugin README missing ${phrase}`);
  }
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
    "plugins/agrenting/skills/swarm/SKILL.md",
  ];

  for (const file of files) {
    const content = await readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(content, /ap_[A-Za-z0-9_-]{20,}/, file);
  }
});
