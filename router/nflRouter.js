const express = require("express");
const router = express.Router();
const { getNflMatches } = require("../controller/nflcontroller.js");

router.get("/matches", getNflMatches);

module.exports = router;
