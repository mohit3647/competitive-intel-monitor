const Anthropic = require("@anthropic-ai/sdk");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { collectWebData } = require("./collectors/web");
const { collectNewsData } = require("./collectors/news");
const { detectSignals, classifySignal } = require("./analyzers/signals");
const { analyzeTrends } = require("./analyzers/trends");
const { generateBriefReport } = require("./reporters/brief");
const { checkAlerts } = require("./reporters/alerts");

const SYSTEM_PROMPT = `You are a competitive intelligence analyst for a Product Manager. Your job is to:
1. Analyze competitor data and identify strategic signals
2. Classify signals by type: product, pricing, hiring, funding, positioning
3. Assess the strategic impact (high/medium/low) of each signal
4. Generate actionable recommendations for the PM

Be specific, data-driven, and actionable. Avoid vague observations.
Format output with clear sections and bullet points.`;

class CompetitiveIntelAgent {
  constructor(options = {}) {
    this.client = new Anthropic();
    this.verbose = options.verbose || false;
    this.competitorsConfig = this.loadCompetitors();
  }

  loadCompetitors() {
    const configPath = path.join(__dirname, "..", "competitors.json");
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      return { competitors: [], settings: {} };
    }
  }

  getCompetitors() {
    return this.competitorsConfig.competitors;
  }

  async chat(userMessage, context = "") {
    const messages = [
      {
        role: "user",
        content: context
          ? `Context:\n${context}\n\nRequest: ${userMessage}`
          : userMessage,
      },
    ];

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    return response.content[0].text;
  }

  async monitorCompetitor(competitorName, signalType = null) {
    if (this.verbose) {
      console.log(chalk.gray(`Monitoring: ${competitorName}`));
    }

    // Collect data from multiple sources
    const webData = await collectWebData(competitorName);
    const newsData = await collectNewsData(competitorName);

    const allData = [...webData, ...newsData];

    // Detect and classify signals
    const signals = detectSignals(allData, signalType);

    // Use AI to analyze
    const prompt = `Analyze the following competitive intelligence data for "${competitorName}" and provide a structured intelligence report.

Data collected:
${JSON.stringify(signals, null, 2)}

Provide:
1. Key findings (top 3-5 signals)
2. Strategic implications for our product
3. Recommended actions
4. Risk assessment`;

    const analysis = await this.chat(prompt);

    console.log(chalk.bold.yellow(`\n📊 Intelligence Report: ${competitorName}\n`));
    console.log(analysis);

    // Check for high-priority alerts
    const alerts = checkAlerts(signals);
    if (alerts.length > 0) {
      console.log(chalk.bold.red("\n🚨 Priority Alerts:"));
      alerts.forEach((alert) => console.log(chalk.red(`  • ${alert.message}`)));
    }

    return analysis;
  }

  async generateBrief(frequency, specificCompetitor = null) {
    const competitors = specificCompetitor
      ? [{ name: specificCompetitor }]
      : this.competitorsConfig.competitors;

    const allSignals = [];

    for (const competitor of competitors) {
      const webData = await collectWebData(competitor.name);
      const newsData = await collectNewsData(competitor.name);
      const signals = detectSignals([...webData, ...newsData]);
      allSignals.push({ competitor: competitor.name, signals });
    }

    const briefContent = generateBriefReport(allSignals, frequency);

    const prompt = `Generate a ${frequency} competitive intelligence brief based on the following data:

${JSON.stringify(briefContent, null, 2)}

Structure the brief as:
1. Executive Summary (2-3 sentences)
2. Key Competitive Moves (by competitor)
3. Market Trends
4. Strategic Recommendations
5. Watch List (things to monitor closely)`;

    const brief = await this.chat(prompt);

    console.log(chalk.bold.cyan(`\n📋 ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Competitive Brief\n`));
    console.log(brief);

    return brief;
  }

  async analyzeLandscape() {
    const competitors = this.competitorsConfig.competitors;

    const allData = [];
    for (const competitor of competitors) {
      const webData = await collectWebData(competitor.name);
      allData.push({ competitor: competitor.name, data: webData });
    }

    const trends = analyzeTrends(allData);

    const prompt = `Analyze the overall competitive landscape based on this data:

${JSON.stringify({ competitors: allData, trends }, null, 2)}

Provide:
1. Market positioning map (describe where each competitor sits)
2. Emerging threats
3. Gaps and opportunities
4. Overall market direction`;

    const analysis = await this.chat(prompt);

    console.log(chalk.bold.green("\n🗺️  Competitive Landscape Analysis\n"));
    console.log(analysis);

    return analysis;
  }

  async checkSignals() {
    const competitors = this.competitorsConfig.competitors;
    const allSignals = [];

    for (const competitor of competitors) {
      const webData = await collectWebData(competitor.name);
      const newsData = await collectNewsData(competitor.name);
      const signals = detectSignals([...webData, ...newsData]);
      allSignals.push(...signals.map((s) => ({ ...s, competitor: competitor.name })));
    }

    const highPriority = allSignals.filter((s) => s.priority === "high");

    if (highPriority.length === 0) {
      console.log(chalk.green("\n✅ No high-priority signals detected.\n"));
      return "No high-priority signals.";
    }

    const prompt = `The following high-priority competitive signals were detected:

${JSON.stringify(highPriority, null, 2)}

For each signal:
1. Explain why it matters
2. What it means for our strategy
3. Recommended immediate action`;

    const analysis = await this.chat(prompt);

    console.log(chalk.bold.red("\n🚨 Signal Alert Report\n"));
    console.log(analysis);

    return analysis;
  }

  async compareCompetitors(comp1, comp2) {
    const data1 = await collectWebData(comp1);
    const data2 = await collectWebData(comp2);

    const prompt = `Compare these two competitors side by side:

${comp1}:
${JSON.stringify(data1, null, 2)}

${comp2}:
${JSON.stringify(data2, null, 2)}

Provide:
1. Strengths comparison
2. Weaknesses comparison
3. Strategic positioning differences
4. Where each is investing
5. Who poses the bigger threat and why`;

    const analysis = await this.chat(prompt);

    console.log(chalk.bold.magenta(`\n⚖️  Comparison: ${comp1} vs ${comp2}\n`));
    console.log(analysis);

    return analysis;
  }
}

module.exports = { CompetitiveIntelAgent };
