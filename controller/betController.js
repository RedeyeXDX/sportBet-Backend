const { Bet, User, Match } = require("../db/models");
const cache = require("../cache");
const axios = require("axios");
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_URL = "https://v3.football.api-sports.io/fixtures";

const placeBet = async (req, res) => {
  const { matchId, team, stake, odds } = req.body;
  const auth0_id = req.user?.sub || req.body.auth0_id;

  if (!auth0_id || !matchId || !team || !stake || !odds) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ where: { auth0_id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.balance < stake) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct stake
    user.balance -= stake;
    await user.save();

    const potential_win = stake * odds;

    const bet = await Bet.create({
      user_id: user.id,
      match_id: matchId,
      bet_choice: team,
      amount: stake,
      odds,
      payout: potential_win,
      status: "pending",
      created_at: new Date(),
    });

    res.status(201).json({
      message: "Bet placed successfully",
      bet,
    });
  } catch (error) {
    console.error("Error placing bet:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resolveBets = async (matchId, finalScore) => {
  const { home, away } = finalScore;

  const bets = await Bet.findAll({
    where: { match_id: matchId, status: "pending" },
  });

  for (let bet of bets) {
    let didWin = false;

    if (
      (bet.team === "home" && home > away) ||
      (bet.team === "away" && away > home) ||
      (bet.team === "draw" && home === away)
    ) {
      didWin = true;
      const user = await User.findByPk(bet.user_id);
      user.balance += bet.potential_win;
      await user.save();
    }

    bet.status = didWin ? "won" : "lost";
    await bet.save();
  }

  return true;
};

const getUserBets = async (req, res) => {
  const { auth0_id } = req.params;

  try {
    const user = await User.findOne({ where: { auth0_id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const bets = await Bet.findAll({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]],
    });

    const pending = bets.filter((bet) => bet.status === "pending");
    const settled = bets.filter(
      (bet) => bet.status === "won" || bet.status === "lost"
    );

    res.json({
      pending,
      settled,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bet history", error: err.message });
  }
};

const getMatchId = async (req, res) => {
  try {
    const matchId = req.params.id;
    const cacheKey = `match:${matchId}`;

    const cachedMatch = await cache.get(cacheKey);
    if (cachedMatch) {
      return res.json(cachedMatch);
    }

    let match = await Match.findOne({
      where: { api_match_id: Number(matchId) },
      attributes: ["api_match_id", "home_team", "away_team"],
    });

    if (match) return res.json(match);

    const response = await axios.get(`${FOOTBALL_API_URL}?id=${matchId}`, {
      headers: {
        "x-apisports-key": FOOTBALL_API_KEY,
      },
    });

    const fixture = response.data.response[0];

    if (!fixture || !fixture.teams) {
      return res.status(404).json({ error: "Match not found in API" });
    }

    const homeTeam = fixture.teams.home.name;
    const awayTeam = fixture.teams.away.name;

    match = await Match.create({
      api_match_id: Number(matchId),
      home_team: homeTeam,
      away_team: awayTeam,
    });

    await cache.set(cacheKey, match);
    res.json(match);
  } catch (error) {
    console.error("Failed to fetch match:", error.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = { placeBet, getUserBets, resolveBets, getMatchId };
