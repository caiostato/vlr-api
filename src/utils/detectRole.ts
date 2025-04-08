import agentToRole from "./agents";

function detectPlayerRole(agentHistory: string[]) {
  const roleCount = agentHistory.reduce((acc, agent) => {
    const role = agentToRole[agent];
    if (role) {
      acc[role] = (acc[role] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);
  return sortedRoles.length > 0 ? sortedRoles[0][0] : "Duelist"; // default
}

export default detectPlayerRole;
