const axios = require("axios");
const chalk = require("chalk");

async function collectNewsData(competitorName) {
  const signals = [];

  // Try NewsAPI first, then fall back to free GNews API
  if (process.env.NEWS_API_KEY) {
    const newsApiResults = await collectViaNewsAPI(competitorName);
    signals.push(...newsApiResults);
  }

  // Also try GNews API (free tier: 100 requests/day, no key required for basic)
  const gnewsResults = await collectViaGNews(competitorName);
  signals.push(...gnewsResults);

  // If nothing was collected, provide a helpful message
  if (signals.length === 0) {
    signals.push({
      source: "news",
      competitor: competitorName,
      title: "No news results",
      description: `No recent news found for ${competitorName}. Add NEWS_API_KEY for better coverage (free at https://newsapi.org).`,
      timestamp: new Date().toISOString(),
      type: "general",
      priority: "low",
    });
  }

  return signals;
}

async function collectViaNewsAPI(competitorName) {
  const signals = [];

  try {
    // Get articles from the past 30 days
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: `"${competitorName}"`,
        sortBy: "publishedAt",
        pageSize: 15,
        from: fromDate.toISOString().split("T")[0],
        language: "en",
        apiKey: process.env.NEWS_API_KEY,
      },
      timeout: 15000,
    });

    const articles = response.data.articles || [];

    if (process.env.VERBOSE) {
      console.log(chalk.gray(`  NewsAPI: Found ${articles.length} articles for ${competitorName}`));
    }

    for (const article of articles) {
      // Skip removed articles
      if (article.title === "[Removed]") continue;

      signals.push({
        source: "newsapi",
        title: article.title,
        description: article.description || "",
        content: (article.content || "").substring(0, 500),
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        sourceInfo: article.source?.name || "Unknown",
        competitor: competitorName,
        timestamp: new Date().toISOString(),
        type: classifyNewsArticle(article.title, article.description),
        priority: assessNewsPriority(article.title, article.description, article.source?.name),
      });
    }
  } catch (error) {
    if (process.env.VERBOSE) {
      console.error(chalk.gray(`  NewsAPI error: ${error.message}`));
    }
  }

  return signals;
}

async function collectViaGNews(competitorName) {
  const signals = [];

  try {
    // GNews API — free tier available
    if (!process.env.GNEWS_API_KEY) return signals;

    const response = await axios.get("https://gnews.io/api/v4/search", {
      params: {
        q: competitorName,
        lang: "en",
        max: 10,
        sortby: "publishedAt",
        token: process.env.GNEWS_API_KEY,
      },
      timeout: 15000,
    });

    const articles = response.data.articles || [];

    if (process.env.VERBOSE) {
      console.log(chalk.gray(`  GNews: Found ${articles.length} articles for ${competitorName}`));
    }

    for (const article of articles) {
      signals.push({
        source: "gnews",
        title: article.title,
        description: article.description || "",
        content: (article.content || "").substring(0, 500),
        url: article.url,
        imageUrl: article.image,
        publishedAt: article.publishedAt,
        sourceInfo: article.source?.name || "Unknown",
        competitor: competitorName,
        timestamp: new Date().toISOString(),
        type: classifyNewsArticle(article.title, article.description),
        priority: assessNewsPriority(article.title, article.description, article.source?.name),
      });
    }
  } catch (error) {
    if (process.env.VERBOSE) {
      console.error(chalk.gray(`  GNews error: ${error.message}`));
    }
  }

  return signals;
}

function classifyNewsArticle(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (text.match(/launch|release|feature|update|ship|beta|announce|roll out|introduce/)) return "product";
  if (text.match(/pric|cost|tier|plan|subscri|discount|free tier|charge/)) return "pricing";
  if (text.match(/hir|recruit|appoint|cto|ceo|vp|head of|chief|talent|layoff/)) return "hiring";
  if (text.match(/fund|rais|invest|acqui|series|ipo|valuation|merger|deal/)) return "funding";
  if (text.match(/pivot|rebrand|market|expand|partner|strateg|enter|alliance/)) return "positioning";

  return "general";
}

function assessNewsPriority(title = "", description = "", sourceName = "") {
  const text = `${title} ${description}`.toLowerCase();
  const isTopSource = /techcrunch|bloomberg|reuters|wsj|verge|wired|cnbc/i.test(sourceName);

  // High priority signals
  if (text.match(/acqui|ipo|major|billion|launch|pivot|breach|layoff|shutdown/)) return "high";
  if (isTopSource && text.match(/funding|product|pricing/)) return "high";

  // Medium priority
  if (text.match(/funding|series [a-z]|partnership|new feature|expansion|hire/)) return "medium";
  if (isTopSource) return "medium";

  return "low";
}

module.exports = { collectNewsData };
