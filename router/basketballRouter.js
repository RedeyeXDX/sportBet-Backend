const express = require("express");
const router = express.Router();
const {
  getBasketballMatches,
  getBasketballMatchesbyId,
} = require("../controller/basketballcontroller");

router.get("/matches", getBasketballMatches);

router.get("/match/:id", getBasketballMatchesbyId);

module.exports = router;
