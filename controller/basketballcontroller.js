const axios = require("axios");
const API_KEY = process.env.FOOTBALL_API_KEY;
const cache = require("../cache");
const HEADERS = {
  "x-apisports-key": API_KEY,
};

const getBasketballMatches = async (req, res) => {
  const BASE_URL = "https://v1.basketball.api-sports.io/games";
  try {
    let { date, live, next = 10 } = req.query;

    if (!date) {
      const today = new Date().toISOString().split("T")[0];
      date = today;
    }

    const cacheKey = live
      ? `basketball_live_${live}`
      : `basketball_date_${date}`;
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

    console.log("KEY:", API_KEY);
    cache.set(cacheKey, games);
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch basketball matches" });
  }
};

const getBasketballMatchesbyId = async (req, res) => {
  const matchId = req.params.id;
  const BASE_URL = "https://v1.basketball.api-sports.io";
  const cacheKey = `basketball_match_detail_${matchId}`;
  try {
    const cachedMatch = cache.get(cacheKey);
    if (cachedMatch) {
      console.log("Serving match detail from cache:", cacheKey);
      return res.json(cachedMatch);
    }
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
      venue: fixture.venue || fixture.arena?.name || "Unknown",
      date: fixture.date,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
      stats: {
        points: {
          home: fixture.scores.home.total,
          away: fixture.scores.away.total,
        },
        quarters: {
          home: fixture.scores.home,
          away: fixture.scores.away,
        },
        teamStats: {
          home: {
            fieldGoals: {
              total: homeStats.field_goals?.total ?? 0,
              attempts: homeStats.field_goals?.attempts ?? 0,
              percentage: homeStats.field_goals?.percentage ?? 0,
            },
            threePointGoals: {
              total: homeStats.threepoint_goals?.total ?? 0,
              attempts: homeStats.threepoint_goals?.attempts ?? 0,
              percentage: homeStats.threepoint_goals?.percentage ?? 0,
            },
            freeThrows: {
              total: homeStats.freethrows_goals?.total ?? 0,
              attempts: homeStats.freethrows_goals?.attempts ?? 0,
              percentage: homeStats.freethrows_goals?.percentage ?? 0,
            },
          },
          away: {
            fieldGoals: {
              total: awayStats.field_goals?.total ?? 0,
              attempts: awayStats.field_goals?.attempts ?? 0,
              percentage: awayStats.field_goals?.percentage ?? 0,
            },
            threePointGoals: {
              total: awayStats.threepoint_goals?.total ?? 0,
              attempts: awayStats.threepoint_goals?.attempts ?? 0,
              percentage: awayStats.threepoint_goals?.percentage ?? 0,
            },
            freeThrows: {
              total: awayStats.freethrows_goals?.total ?? 0,
              attempts: awayStats.freethrows_goals?.attempts ?? 0,
              percentage: awayStats.freethrows_goals?.percentage ?? 0,
            },
          },
        },
      },
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
module.exports = { getBasketballMatches, getBasketballMatchesbyId };
