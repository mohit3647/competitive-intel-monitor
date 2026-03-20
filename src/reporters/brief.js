function generateBriefReport(allSignals, frequency) {
  const brief = {
    generatedAt: new Date().toISOString(),
    frequency,
    period: getPeriodLabel(frequency),
    competitors: [],
    summary: {
      totalSignals: 0,
      highPriority: 0,
      signalsByType: {},
    },
  };

  for (const { competitor, signals } of allSignals) {
    const competitorBrief = {
      name: competitor,
      signalCount: signals.length,
      highPrioritySignals: signals.filter((s) => s.priority === "high"),
      topSignals: signals.slice(0, 5),
      signalTypes: groupByType(signals),
    };

    brief.competitors.push(competitorBrief);
    brief.summary.totalSignals += signals.length;
    brief.summary.highPriority += competitorBrief.highPrioritySignals.length;

    for (const signal of signals) {
      const type = signal.type || "general";
      brief.summary.signalsByType[type] = (brief.summary.signalsByType[type] || 0) + 1;
    }
  }

  return brief;
}

function getPeriodLabel(frequency) {
  const now = new Date();
  switch (frequency) {
    case "daily":
      return now.toISOString().split("T")[0];
    case "weekly":
      return `Week of ${now.toISOString().split("T")[0]}`;
    case "monthly":
      return `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
    default:
      return now.toISOString().split("T")[0];
  }
}

function groupByType(signals) {
  const groups = {};
  for (const signal of signals) {
    const type = signal.type || "general";
    if (!groups[type]) groups[type] = [];
    groups[type].push(signal);
  }
  return groups;
}

module.exports = { generateBriefReport };
