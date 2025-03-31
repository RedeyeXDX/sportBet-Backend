const express = require("express");
const router = express.Router();
const { getFootballMatches } = require("../controller/footballcontroller");

router.get("/matches", getFootballMatches);

module.exports = router;
