import { Op } from 'sequelize';
import { Match } from './index';
import { DateTime } from 'luxon';

export const removeOldMatches = async () => {
  const oldMatches = await Match.findAll({
    where: {
      'state.ctx.turn': 1,
      updatedAt: {
        [Op.lte]: DateTime.now().minus({ day: 7 }).toJSDate(),
      },
    },
  });
  if (oldMatches.length) {
    console.log(
      `Deleting ${oldMatches.length} abandoned matches:`,
      oldMatches.map((i) => i.get('id')),
    );
    oldMatches.forEach((m) => m.destroy());
  } else {
    console.log('No matches to delete.');
  }
};
