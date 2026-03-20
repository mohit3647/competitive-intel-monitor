const SIGNAL_TYPES = ["product", "pricing", "hiring", "funding", "positioning"];

function detectSignals(rawData, filterType = null) {
  let signals = rawData.map((item) => ({
    ...item,
    type: item.type || classifySignal(item),
    priority: item.priority || assessPriority(item),
    detectedAt: new Date().toISOString(),
  }));

  if (filterType && SIGNAL_TYPES.includes(filterType)) {
    signals = signals.filter((s) => s.type === filterType);
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  signals.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return signals;
}

function classifySignal(item) {
  const text = JSON.stringify(item).toLowerCase();

  if (text.match(/product|feature|launch|release|update|ship|beta/)) return "product";
  if (text.match(/pric|cost|tier|plan|free|discount|subscri/)) return "pricing";
  if (text.match(/hir|recruit|job|role|team|engineer|head of/)) return "hiring";
  if (text.match(/fund|rais|invest|acqui|series|valuat|ipo/)) return "funding";
  if (text.match(/partner|expand|market|rebrand|pivot|position/)) return "positioning";

  return "general";
}

function assessPriority(item) {
  const text = JSON.stringify(item).toLowerCase();

  // High priority keywords
  if (text.match(/acqui|ipo|major launch|direct competitor|our market/)) return "high";
  if (text.match(/new product|funding round|key hire|price cut/)) return "medium";

  return "low";
}

module.exports = { detectSignals, classifySignal, SIGNAL_TYPES };
