const axios = require("axios");

async function collectNewsData(competitorName) {
  const signals = [];

  try {
    if (process.env.NEWS_API_KEY) {
      // Use NewsAPI for real news data
      const response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: competitorName,
          sortBy: "publishedAt",
          pageSize: 10,
          apiKey: process.env.NEWS_API_KEY,
        },
      });

      for (const article of response.data.articles || []) {
        signals.push({
          source: "news",
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          competitor: competitorName,
          type: classifyNewsArticle(article.title, article.description),
          priority: assessNewsPriority(article.title, article.description),
        });
      }
    } else {
      // Fallback: generate placeholder for demo
      signals.push({
        source: "news",
        competitor: competitorName,
        timestamp: new Date().toISOString(),
        data: `News monitoring active for ${competitorName}. Add NEWS_API_KEY to .env for live results.`,
        type: "general",
        priority: "low",
      });
    }
  } catch (error) {
    if (process.env.VERBOSE) {
      console.error(`News collection error for ${competitorName}:`, error.message);
    }
  }

  return signals;
}

function classifyNewsArticle(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (text.match(/launch|release|feature|update|ship/)) return "product";
  if (text.match(/pric|cost|tier|plan|subscri/)) return "pricing";
  if (text.match(/hir|recruit|appoint|cto|ceo|vp|head of/)) return "hiring";
  if (text.match(/fund|rais|invest|acqui|series|ipo/)) return "funding";
  if (text.match(/pivot|rebrand|market|expand|partner/)) return "positioning";

  return "general";
}

function assessNewsPriority(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  // High priority signals
  if (text.match(/acqui|ipo|major|billion|launch|pivot/)) return "high";
  if (text.match(/funding|series [c-z]|partnership/)) return "medium";

  return "low";
}

module.exports = { collectNewsData };
