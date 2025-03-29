'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Matches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      api_match_id: {
        type: Sequelize.INTEGER
      },
      home_team: {
        type: Sequelize.STRING
      },
      away_team: {
        type: Sequelize.STRING
      },
      start_time: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      score_home: {
        type: Sequelize.INTEGER
      },
      score_away: {
        type: Sequelize.INTEGER
      },
      created_at: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Matches');
  }
};