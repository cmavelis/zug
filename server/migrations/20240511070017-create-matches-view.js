'use strict';
/** @type {import('sequelize-cli').Migration} */

const matchesViewCreate = require('../db/matchesViewCreate');
const matchesViewDestroy = require('../db/matchesViewDestroy');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(matchesViewCreate);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(matchesViewDestroy);
  },
};
