const express = require("express");
const router = express.Router();
const betController = require("../controller/betController");

router.get("/users/:auth0_id/bets", betController.getUserBets);

router.post("/api/bets", betController.placeBet);

router.get("/match/:id", betController.getMatchId);

module.exports = router;
