"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Bet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Bet.belongsTo(models.User, { foreignKey: "user_id" });
      Bet.belongsTo(models.Match, { foreignKey: "match_id" });
    }
  }
  Bet.init(
    {
      user_id: DataTypes.INTEGER,
      match_id: DataTypes.INTEGER,
      bet_type: DataTypes.STRING,
      bet_choice: DataTypes.STRING,
      odds: DataTypes.DECIMAL,
      amount: DataTypes.DECIMAL,
      status: DataTypes.STRING,
      payout: DataTypes.DECIMAL,
      created_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Bet",
    }
  );
  return Bet;
};
