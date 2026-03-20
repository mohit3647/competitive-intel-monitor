function analyzeTrends(competitorData) {
  const trends = {
    signalCounts: {},
    topSignalTypes: [],
    competitorActivity: [],
    emergingPatterns: [],
  };

  for (const { competitor, data } of competitorData) {
    const signalsByType = {};

    for (const item of data) {
      const type = item.type || "general";
      signalsByType[type] = (signalsByType[type] || 0) + 1;
    }

    trends.competitorActivity.push({
      competitor,
      totalSignals: data.length,
      signalBreakdown: signalsByType,
      activityLevel: data.length > 10 ? "high" : data.length > 5 ? "medium" : "low",
    });

    // Aggregate signal counts
    for (const [type, count] of Object.entries(signalsByType)) {
      trends.signalCounts[type] = (trends.signalCounts[type] || 0) + count;
    }
  }

  // Determine top signal types across all competitors
  trends.topSignalTypes = Object.entries(trends.signalCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }));

  // Detect emerging patterns
  const highActivityCompetitors = trends.competitorActivity.filter(
    (c) => c.activityLevel === "high"
  );

  if (highActivityCompetitors.length > 0) {
    trends.emergingPatterns.push({
      pattern: "High competitor activity detected",
      competitors: highActivityCompetitors.map((c) => c.competitor),
      recommendation: "Increase monitoring frequency for these competitors",
    });
  }

  return trends;
}

module.exports = { analyzeTrends };
