# Competitive Intelligence Monitor Agent

AI-powered CLI agent that tracks and analyzes competitor activity — product launches, pricing changes, feature updates, hiring signals, and market positioning — to generate actionable intelligence briefs for Product Managers.

## What It Does

- **Competitor Tracking** — Monitor specified competitors across multiple data sources
- **Signal Detection** — Identify product launches, pricing changes, feature updates, leadership moves, and funding events
- **Intelligence Briefs** — Generate structured summaries with strategic implications
- **Trend Analysis** — Spot patterns and shifts in competitive landscape over time
- **Alert System** — Flag high-priority competitive moves that need immediate attention

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run the agent
node index.js
```

## Usage

```bash
# Interactive mode — guided competitor analysis
node index.js

# Monitor a specific competitor
node index.js --competitor "CompanyName"

# Generate a weekly competitive brief
node index.js --brief weekly

# Track a specific signal type
node index.js --signal pricing --competitor "CompanyName"
```

## Configuration

Edit `competitors.json` to define your competitive landscape:

```json
{
  "competitors": [
    {
      "name": "Competitor A",
      "website": "https://competitor-a.com",
      "signals": ["product", "pricing", "hiring", "funding"]
    }
  ]
}
```

## Signal Types

| Signal | Description |
|--------|------------|
| `product` | New features, launches, deprecations |
| `pricing` | Plan changes, new tiers, discounts |
| `hiring` | Key hires, job postings indicating strategy |
| `funding` | Funding rounds, acquisitions, partnerships |
| `positioning` | Messaging changes, new markets, pivots |

## Project Structure

```
competitive-intel-monitor/
├── index.js              # Main entry point & CLI
├── src/
│   ├── agent.js          # Core agent orchestration
│   ├── collectors/       # Data collection modules
│   │   ├── web.js        # Web scraping & search
│   │   └── news.js       # News & press monitoring
│   ├── analyzers/        # Analysis & intelligence
│   │   ├── signals.js    # Signal detection & classification
│   │   └── trends.js     # Trend analysis over time
│   └── reporters/        # Output & reporting
│       ├── brief.js      # Intelligence brief generation
│       └── alerts.js     # Priority alert system
├── competitors.json      # Competitor configuration
├── .env.example          # Environment template
└── package.json
```

## License

MIT
