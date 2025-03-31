const axios = require("axios");
const API_KEY = process.env.FOOTBALL_API_KEY;
const cache = require("../cache");
const BASE_URL = "https://v3.football.api-sports.io/fixtures";

const getFootballMatches = async (req, res) => {
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

    const matches = response.data.response.map((match) => ({
      id: match.fixture.id,
      date: match.fixture.date,
      league: match.league.name,
      venue: match.fixture.venue.name,
      status: match.fixture.status.short,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      score: match.goals,
    }));

    cache.set(cacheKey, matches);
    res.json(matches);
    console.log("Serving from cache:", cacheKey);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch football matches" });
  }
};

module.exports = { getFootballMatches };
