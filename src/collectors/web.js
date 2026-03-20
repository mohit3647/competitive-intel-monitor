const axios = require("axios");
const chalk = require("chalk");

async function collectWebData(competitorName) {
  const signals = [];

  if (process.env.BRAVE_SEARCH_API_KEY) {
    // Brave Search API — best results (free: 2000 queries/month)
    const braveResults = await collectViaBraveSearch(competitorName);
    signals.push(...braveResults);
  }

  // Always try Google News RSS — free, no key needed
  const googleNewsResults = await collectViaGoogleNewsRSS(competitorName);
  signals.push(...googleNewsResults);

  if (signals.length === 0) {
    signals.push({
      source: "web",
      competitor: competitorName,
      title: "Limited web results",
      description: `Add BRAVE_SEARCH_API_KEY to .env for comprehensive web search (free at https://brave.com/search/api/).`,
      timestamp: new Date().toISOString(),
      type: "general",
      priority: "low",
    });
  }

  return signals;
}

async function collectViaGoogleNewsRSS(competitorName) {
  const signals = [];

  const searchQueries = [
    `${competitorName} product launch`,
    `${competitorName} pricing`,
    `${competitorName} funding`,
    `${competitorName} company news`,
  ];

  for (const query of searchQueries) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(
        `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`,
        {
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; CI-Monitor/1.0)",
          },
        }
      );

      const xml = response.data;

      // Parse RSS XML items using regex (lightweight, no extra dependency)
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of items.slice(0, 5)) {
        const title = extractTag(item, "title");
        const link = extractTag(item, "link");
        const pubDate = extractTag(item, "pubDate");
        const source = extractTag(item, "source");

        if (title) {
          signals.push({
            source: "google_news_rss",
            query,
            competitor: competitorName,
            title: decodeEntities(title),
            description: decodeEntities(title),
            url: link || "",
            publishedAt: pubDate || null,
            sourceInfo: source || "Google News",
            timestamp: new Date().toISOString(),
            type: inferSignalType(query, title, ""),
            priority: assessWebPriority(title, source),
          });
        }
      }
    } catch (error) {
      if (process.env.VERBOSE) {
        console.error(chalk.gray(`  Google News RSS error for "${query}": ${error.message}`));
      }
    }
  }

  return signals;
}

async function collectViaBraveSearch(competitorName) {
  const signals = [];

  const searchQueries = [
    `${competitorName} product launch 2026`,
    `${competitorName} pricing update`,
    `${competitorName} new feature announcement`,
    `${competitorName} company news`,
    `${competitorName} hiring key roles`,
  ];

  for (const query of searchQueries) {
    try {
      const response = await axios.get("https://api.search.brave.com/res/v1/web/search", {
        params: {
          q: query,
          count: 5,
          freshness: "pm",
        },
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
        },
        timeout: 10000,
      });

      const results = response.data.web?.results || [];

      for (const result of results) {
        signals.push({
          source: "brave_search",
          query,
          competitor: competitorName,
          title: result.title,
          description: result.description,
          url: result.url,
          publishedAt: result.page_age || null,
          timestamp: new Date().toISOString(),
          type: inferSignalType(query, result.title, result.description),
          priority: assessWebPriority(result.title + " " + result.description, ""),
        });
      }
    } catch (error) {
      if (process.env.VERBOSE) {
        console.error(chalk.gray(`  Brave search error for "${query}": ${error.message}`));
      }
    }
  }

  return signals;
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function inferSignalType(query, title = "", description = "") {
  const text = `${query} ${title} ${description}`.toLowerCase();

  if (text.match(/product|feature|launch|release|update|ship|beta|announce/)) return "product";
  if (text.match(/pric|cost|tier|plan|subscri|discount|free/)) return "pricing";
  if (text.match(/hir|recruit|job|role|team|engineer|head of|appoint|layoff/)) return "hiring";
  if (text.match(/fund|rais|invest|acqui|series|valuat|ipo|merger/)) return "funding";
  if (text.match(/partner|expand|market|rebrand|pivot|position|strateg/)) return "positioning";

  return "general";
}

function assessWebPriority(text = "", source = "") {
  const combined = `${text} ${source}`.toLowerCase();
  const isTopSource = /techcrunch|bloomberg|reuters|wsj|verge|wired|cnbc/i.test(combined);

  if (combined.match(/acqui|ipo|major launch|billion|breakthrough|exclusive/)) return "high";
  if (isTopSource) return "high";
  if (combined.match(/new product|funding|key hire|price change|partnership|series/)) return "medium";

  return "low";
}

module.exports = { collectWebData };
