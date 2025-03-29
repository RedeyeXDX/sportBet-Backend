require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "sportBet",
    host: "127.0.0.1",
    dialect: "mysql",
    seederStorage: "sequelize",
  },
};
