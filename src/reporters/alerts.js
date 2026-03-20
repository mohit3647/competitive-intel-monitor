function checkAlerts(signals) {
  const alerts = [];

  for (const signal of signals) {
    if (signal.priority === "high") {
      alerts.push({
        type: signal.type,
        competitor: signal.competitor,
        message: formatAlertMessage(signal),
        timestamp: new Date().toISOString(),
        signal,
      });
    }
  }

  return alerts;
}

function formatAlertMessage(signal) {
  const typeLabels = {
    product: "Product Move",
    pricing: "Pricing Change",
    hiring: "Key Hire",
    funding: "Funding Event",
    positioning: "Strategic Shift",
  };

  const label = typeLabels[signal.type] || "Competitive Signal";
  const competitor = signal.competitor || "Unknown";
  const source = signal.source || "monitoring";

  return `[${label}] ${competitor} — detected via ${source}: ${signal.title || signal.data || "New high-priority signal"}`;
}

module.exports = { checkAlerts };
