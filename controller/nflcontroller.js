const axios = require("axios");
const API_KEY = process.env.FOOTBALL_API_KEY;
const cache = require("../cache");
const BASE_URL = "https://v1.american-football.api-sports.io/games";

const getNflMatches = async (req, res) => {
  try {
    let { date, live, next = 10 } = req.query;

    if (!date) {
      const today = new Date().toISOString().split("T")[0];
      date = today;
    }

    const cacheKey = live ? `nfl_live_${live}` : `nfl_date_${date}`;
    const cachedMatches = cache.get(cacheKey);

    if (cachedMatches) {
      console.log("Serving from cache:", cacheKey);
      return res.json(cachedMatches);
    }

    const query = {};
    if (live) query.live = live;
    else query.date = date;

    const response = await axios.get(BASE_URL, {
      headers: {
        "x-apisports-key": API_KEY,
      },
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

    cache.set(cacheKey, games);
    res.json(games);
  } catch (err) {
    console.error("NFL API error:", err.message);
    res.status(500).json({ error: "Failed to fetch NFL matches" });
  }
};

const getNflMatchById = async (req, res) => {
  const matchId = req.params.id;
  const BASE_URL = "https://v1.american-football.api-sports.io";
  const HEADERS = {
    "x-rapidapi-key": process.env.API_KEY, // or however you're storing your API key
    "x-rapidapi-host": "v1.american-football.api-sports.io",
  };

  try {
    // 1. Fetch match details
    const fixtureRes = await axios.get(`${BASE_URL}/games?id=${matchId}`, {
      headers: HEADERS,
    });

    const fixture = fixtureRes.data.response[0];
    if (!fixture) {
      return res.status(404).json({ error: "Match not found" });
    }

    // 2. Fetch team statistics
    const statsRes = await axios.get(`${BASE_URL}/games/statistics/teams`, {
      headers: HEADERS,
      params: { id: matchId },
    });

    const homeStatsRaw = statsRes.data.response.find(
      (t) => t.team.id === fixture.teams.home.id
    );
    const awayStatsRaw = statsRes.data.response.find(
      (t) => t.team.id === fixture.teams.away.id
    );

    const homeStats = homeStatsRaw || {};
    const awayStats = awayStatsRaw || {};

    // 3. Fetch odds
    const oddsRes = await axios.get(`${BASE_URL}/odds?game=${matchId}`, {
      headers: HEADERS,
    });

    const oddsData =
      oddsRes.data.response[0]?.bookmakers[0]?.bets[0]?.values || [];

    const homeOdd = oddsData.find((o) => o.value === "Home")?.odd || null;
    const drawOdd = oddsData.find((o) => o.value === "Draw")?.odd || null;
    const awayOdd = oddsData.find((o) => o.value === "Away")?.odd || null;

    // 4. Final data response
    const data = {
      id: fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      league: fixture.league.name,
      venue: fixture.venue.name || "Unknown",
      date: fixture.date,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
      stats: {
        scores: {
          home: fixture.scores.home.total,
          away: fixture.scores.away.total,
        },
        teamStats: {
          home: {
            totalYards: homeStats.total_yards || 0,
            passingYards: homeStats.passing_yards || 0,
            rushingYards: homeStats.rushing_yards || 0,
            turnovers: homeStats.turnovers || 0,
          },
          away: {
            totalYards: awayStats.total_yards || 0,
            passingYards: awayStats.passing_yards || 0,
            rushingYards: awayStats.rushing_yards || 0,
            turnovers: awayStats.turnovers || 0,
          },
        },
      },
    };

    res.json(data);
  } catch (err) {
    console.error(
      "Error fetching NFL match details:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch match details" });
  }
};

module.exports = { getNflMatches, getNflMatchById };
