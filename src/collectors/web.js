const axios = require("axios");

async function collectWebData(competitorName) {
  const signals = [];

  try {
    // Search for recent competitor activity via web search
    const searchQueries = [
      `${competitorName} product launch 2026`,
      `${competitorName} pricing update`,
      `${competitorName} new feature announcement`,
      `${competitorName} company news`,
    ];

    for (const query of searchQueries) {
      try {
        // Using a public search API or scraping approach
        // In production, integrate with SerpAPI, Bing Search API, etc.
        signals.push({
          source: "web_search",
          query,
          competitor: competitorName,
          timestamp: new Date().toISOString(),
          data: `Search result placeholder for: ${query}`,
          type: inferSignalType(query),
        });
      } catch {
        // Skip failed queries silently
      }
    }
  } catch (error) {
    if (process.env.VERBOSE) {
      console.error(`Web collection error for ${competitorName}:`, error.message);
    }
  }

  return signals;
}

function inferSignalType(query) {
  if (query.includes("product") || query.includes("feature") || query.includes("launch")) {
    return "product";
  }
  if (query.includes("pricing") || query.includes("price")) {
    return "pricing";
  }
  if (query.includes("hiring") || query.includes("jobs")) {
    return "hiring";
  }
  if (query.includes("funding") || query.includes("investment")) {
    return "funding";
  }
  return "positioning";
}

module.exports = { collectWebData };
