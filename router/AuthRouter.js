const express = require("express");
const router = express.Router();
const userController = require("../controller/Authcontroller");
const { jwtCheck } = require("../middleware/Authmiddleware");

router.get("/", jwtCheck, userController.getUser);
router.post("/sync", jwtCheck, userController.syncUser);

module.exports = router;
