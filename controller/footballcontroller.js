const axios = require("axios");
const API_KEY = process.env.FOOTBALL_API_KEY;
const cache = require("../cache");
const BASE_URL = "https://v3.football.api-sports.io/fixtures";
const FOOTBALL_API_BASE = "https://v3.football.api-sports.io";
const HEADERS = {
  "x-apisports-key": API_KEY,
};

const getFootballMatches = async (req, res) => {
  try {
    let { date, live, next = 10 } = req.query;

    if (!date) {
      const today = new Date().toISOString().split("T")[0];
      date = today;
    }

    const cacheKey = live ? `football_live_${live}` : `football_date_${date}`;
    const cachedMatches = cache.get(cacheKey);

    if (cachedMatches) {
      return res.json(cachedMatches);
    }

    const query = {};
    if (live) query.live = live;
    else query.date = date;

    const response = await axios.get(BASE_URL, {
      headers: { "x-apisports-key": API_KEY },
      params: query,
    });

    const LIVE_STATUSES = ["1H", "2H", "HT", "ET", "P"];
    const matches = response.data.response.map((match) => ({
      id: match.fixture.id,
      date: match.fixture.date,
      league: match.league.name,
      venue: match.fixture.venue.name,
      status: LIVE_STATUSES.includes(match.fixture.status.short)
        ? "LIVE"
        : match.fixture.status.short,
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

const getFootballMatchById = async (req, res) => {
  const matchId = req.params.id;
  const cacheKey = `football_match_detail_${matchId}`;
  try {
    const cachedMatch = cache.get(cacheKey);
    if (cachedMatch) {
      console.log("Serving match detail from cache:", cacheKey);
      return res.json(cachedMatch);
    }
    // 1. Fetch fixture info
    const fixtureRes = await axios.get(`${FOOTBALL_API_BASE}/fixtures`, {
      headers: HEADERS,
      params: { id: matchId },
    });

    const fixture = fixtureRes.data.response[0];
    if (!fixture) {
      return res.status(404).json({ error: "Match not found" });
    }

    console.log("HOME TEAM ID:", fixture.teams.home.id);
    console.log("AWAY TEAM ID:", fixture.teams.away.id);

    // 2. Fetch team statistics (individually)
    const [homeStatsRes, awayStatsRes] = await Promise.all([
      axios.get(`${FOOTBALL_API_BASE}/fixtures/statistics`, {
        headers: HEADERS,
        params: {
          fixture: matchId,
          team: fixture.teams.home.id,
        },
      }),
      axios.get(`${FOOTBALL_API_BASE}/fixtures/statistics`, {
        headers: HEADERS,
        params: {
          fixture: matchId,
          team: fixture.teams.away.id,
        },
      }),
    ]);

    console.log("Home Stats Raw:", homeStatsRes.data);
    console.log("Away Stats Raw:", awayStatsRes.data);

    const homeStats = homeStatsRes.data.response?.[0]?.statistics || [];
    const awayStats = awayStatsRes.data.response?.[0]?.statistics || [];

    // Helper to format stats side-by-side
    const statTypes = [
      "Shots on Goal",
      "Shots off Goal",
      "Total Shots",
      "Blocked Shots",
      "Shots insidebox",
      "Shots outsidebox",
      "Fouls",
      "Corner Kicks",
      "Offsides",
      "Ball Possession",
      "Yellow Cards",
      "Red Cards",
      "Goalkeeper Saves",
      "Total passes",
      "Passes accurate",
      "Passes %",
    ];

    const formattedStats = statTypes.map((type) => ({
      type,
      home: homeStats.find((s) => s.type === type)?.value ?? "N/A",
      away: awayStats.find((s) => s.type === type)?.value ?? "N/A",
    }));

    // 3. Fetch odds
    const oddsRes = await axios.get(`${FOOTBALL_API_BASE}/odds`, {
      headers: HEADERS,
      params: { fixture: matchId },
    });

    const oddsData =
      oddsRes.data.response[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];

    const homeOdd = oddsData.find((o) => o.value === "Home")?.odd || null;
    const drawOdd = oddsData.find((o) => o.value === "Draw")?.odd || null;
    const awayOdd = oddsData.find((o) => o.value === "Away")?.odd || null;

    // 4. Final combined response
    const data = {
      id: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      league: fixture.league.name,
      venue: fixture.fixture.venue.name,
      date: fixture.fixture.date,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
      stats: formattedStats,
    };

    cache.set(cacheKey, data, 300);
    res.json(data);
  } catch (err) {
    console.error(
      "Error fetching match details:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch match details" });
  }
};

module.exports = { getFootballMatches, getFootballMatchById };
