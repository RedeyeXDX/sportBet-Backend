const express = require("express");
const router = express.Router();
const { getBasketballMatches } = require("../controller/basketballcontroller");

router.get("/matches", getBasketballMatches);

module.exports = router;
