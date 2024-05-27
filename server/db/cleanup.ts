import { Sequelize } from 'sequelize';
import { Match } from './index';

const findOldMatches = (db: Sequelize) => {
  const oldMatches = Match.findAll({
    where: {
      turn: 1,
    },
  });
  console.log(oldMatches);
};
