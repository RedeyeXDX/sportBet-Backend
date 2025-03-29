"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Match extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Match.hasMany(models.Bet, { foreignKey: "match_id" });
    }
  }
  Match.init(
    {
      api_match_id: DataTypes.INTEGER,
      home_team: DataTypes.STRING,
      away_team: DataTypes.STRING,
      start_time: DataTypes.DATE,
      status: DataTypes.STRING,
      score_home: DataTypes.INTEGER,
      score_away: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Match",
    }
  );
  return Match;
};
