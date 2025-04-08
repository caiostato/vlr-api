const duelists = ["jett", "reyna", "raze", "phoenix", "yoru", "neon"];
const initiators = ["sova", "skye", "breach", "fade", "kayo", "gekko"];
const controllers = ["viper", "brimstone", "omen", "astra", "garbor"];
const sentinels = ["killjoy", "cypher", "sage", "chamber", "deadlock"];

const agentToRole = Object.fromEntries([
  ...duelists.map((agent) => [agent, "duelist"]),
  ...initiators.map((agent) => [agent, "initiator"]),
  ...controllers.map((agent) => [agent, "controller"]),
  ...sentinels.map((agent) => [agent, "sentinel"]),
]);

export default agentToRole;
