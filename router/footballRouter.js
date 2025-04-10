const express = require("express");
const router = express.Router();
const {
  getFootballMatches,
  getFootballMatchById,
} = require("../controller/footballcontroller");

router.get("/matches", getFootballMatches);

router.get("/match/:id", getFootballMatchById);

module.exports = router;
