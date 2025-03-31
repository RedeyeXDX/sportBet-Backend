require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = 8080;
const app = express();
const AuthRouter = require("./router/AuthRouter");
const footballRouter = require("./router/footballRouter");
const basketballRouter = require("./router/basketballRouter");
const nflRouter = require("./router/nflRouter");

app.use(cors());
app.use(express.json());
app.use("/Auth", AuthRouter);
app.use("/api/football", footballRouter);
app.use("/api/basketball", basketballRouter);
app.use("/api/nfl", nflRouter);

console.log("Successfully connected to sportbetDB!");
app.listen(port, () => console.log(`Server running on port ${port}`));
