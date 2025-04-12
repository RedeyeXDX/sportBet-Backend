const cron = require("node-cron");
const axios = require("axios");
const { Bet } = require("../db/models"); // make sure your Bet model is imported
const { resolveBets } = require("../controller/betController");
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;

const API_URL = "https://v3.football.api-sports.io/fixtures";

const runResolveJob = async () => {
  try {
    // 1. Get all pending bets
    const pendingBets = await Bet.findAll({
      where: { status: "pending" },
      attributes: ["match_id"],
      group: ["match_id"],
    });

    const matchIds = [...new Set(pendingBets.map((b) => b.match_id))];

    if (matchIds.length === 0) {
      console.log("No pending bets to resolve.");
      return;
    }

    for (const matchId of matchIds) {
      // 2. Fetch match info from Football API
      const response = await axios.get(`${API_URL}?id=${matchId}`, {
        headers: {
          "x-apisports-key": FOOTBALL_API_KEY,
        },
      });

      const match = response.data.response[0];
      if (!match || match.fixture.status.short !== "FT") {
        console.log(`Match ${matchId} not finished yet`);
        continue;
      }

      const home = match.goals.home;
      const away = match.goals.away;

      if (home != null && away != null) {
        console.log(`✅ Resolving match ${matchId}: ${home} - ${away}`);
        await resolveBets(matchId, { home, away });
      }
    }
  } catch (error) {
    console.error("Failed to auto-resolve bets:", error.message);
  }
};

// Run every 10 minutes
cron.schedule("*/10 * * * *", () => {
  console.log(
    `[${new Date().toISOString()}] ⏱️ Running bet-based resolve job...`
  );
  runResolveJob();
});
