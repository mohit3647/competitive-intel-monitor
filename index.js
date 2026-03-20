#!/usr/bin/env node

const { Command } = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const dotenv = require("dotenv");
const { CompetitiveIntelAgent } = require("./src/agent");

dotenv.config();

const program = new Command();

program
  .name("competitive-intel-monitor")
  .description("AI-powered competitive intelligence monitor for Product Managers")
  .version("1.0.0");

program
  .option("-c, --competitor <name>", "Monitor a specific competitor")
  .option("-b, --brief <frequency>", "Generate intelligence brief (daily|weekly|monthly)")
  .option("-s, --signal <type>", "Track specific signal type (product|pricing|hiring|funding|positioning)")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (options) => {
    console.log(chalk.bold.cyan("\n🔍 Competitive Intelligence Monitor\n"));

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(chalk.red("Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key."));
      process.exit(1);
    }

    const agent = new CompetitiveIntelAgent({
      verbose: options.verbose || false,
    });

    if (options.brief) {
      await agent.generateBrief(options.brief, options.competitor);
    } else if (options.competitor) {
      await agent.monitorCompetitor(options.competitor, options.signal);
    } else {
      await runInteractiveMode(agent);
    }
  });

async function runInteractiveMode(agent) {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Monitor a competitor", value: "monitor" },
        { name: "Generate competitive brief", value: "brief" },
        { name: "Analyze competitive landscape", value: "landscape" },
        { name: "Check for new signals", value: "signals" },
        { name: "Compare competitors", value: "compare" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);

  if (action === "exit") {
    console.log(chalk.gray("Goodbye!"));
    return;
  }

  const competitors = agent.getCompetitors();

  switch (action) {
    case "monitor": {
      const { competitor } = await inquirer.prompt([
        {
          type: "input",
          name: "competitor",
          message: "Which competitor do you want to monitor?",
          default: competitors[0]?.name,
        },
      ]);
      const spinner = ora("Gathering intelligence...").start();
      const result = await agent.monitorCompetitor(competitor);
      spinner.stop();
      console.log(result);
      break;
    }

    case "brief": {
      const { frequency } = await inquirer.prompt([
        {
          type: "list",
          name: "frequency",
          message: "What time period?",
          choices: ["daily", "weekly", "monthly"],
        },
      ]);
      const spinner = ora("Generating competitive brief...").start();
      const result = await agent.generateBrief(frequency);
      spinner.stop();
      console.log(result);
      break;
    }

    case "landscape": {
      const spinner = ora("Analyzing competitive landscape...").start();
      const result = await agent.analyzeLandscape();
      spinner.stop();
      console.log(result);
      break;
    }

    case "signals": {
      const spinner = ora("Scanning for new signals...").start();
      const result = await agent.checkSignals();
      spinner.stop();
      console.log(result);
      break;
    }

    case "compare": {
      const { comp1, comp2 } = await inquirer.prompt([
        {
          type: "input",
          name: "comp1",
          message: "First competitor:",
        },
        {
          type: "input",
          name: "comp2",
          message: "Second competitor:",
        },
      ]);
      const spinner = ora("Comparing competitors...").start();
      const result = await agent.compareCompetitors(comp1, comp2);
      spinner.stop();
      console.log(result);
      break;
    }
  }

  // Loop back to menu
  await runInteractiveMode(agent);
}

program.parse();
