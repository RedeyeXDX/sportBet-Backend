const axios = require("axios");
const API_KEY = process.env.FOOTBALL_API_KEY;
const cache = require("../cache");
const BASE_URL = "https://v1.basketball.api-sports.io/games";

const getBasketballMatches = async (req, res) => {
  try {
    let { date, live, next = 10 } = req.query;

    if (!date) {
      const today = new Date().toISOString().split("T")[0];
      date = today;
    }

    const cacheKey = live ? `live_${live}` : `date_${date}`;
    const cachedMatches = cache.get(cacheKey);

    if (cachedMatches) {
      console.log("Serving from cache:", cacheKey);
      return res.json(cachedMatches);
    }

    const query = {};
    if (live) query.live = live;
    else query.date = date;

    const response = await axios.get(BASE_URL, {
      headers: { "x-apisports-key": API_KEY },
      params: query,
    });

    const games = response.data.response.map((game) => ({
      id: game.id,
      league: game.league.name,
      homeTeam: game.teams.home.name,
      awayTeam: game.teams.away.name,
      venue: game.arena?.name || "Unknown Arena",
      date: game.date,
      status: game.status.short,
      score: {
        home: game.scores.home.total,
        away: game.scores.away.total,
      },
    }));

    cache.set(cacheKey, matches);
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch basketball matches" });
  }
};

module.exports = { getBasketballMatches };
