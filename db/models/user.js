"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Bet, { foreignKey: "user_id" });
      User.hasMany(models.Transaction, { foreignKey: "user_id" });
    }
  }
  User.init(
    {
      auth0_id: { type: DataTypes.STRING, unique: true },
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password_hash: DataTypes.STRING,
      balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
      created_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
