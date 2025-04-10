const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactioncontroller");

router.post(
  "/users/:auth0_id/balance",
  transactionController.transactionRecord
);
router.get(
  "/users/:auth0_id/transactions",
  transactionController.getUserTransactions
);
module.exports = router;
