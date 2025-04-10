const express = require("express");
const router = express.Router();
const {
  getUserByAuth0Id,
  updateBalance,
} = require("../controller/usercontroller");

router.get("/:auth0_id", getUserByAuth0Id);

module.exports = router;
