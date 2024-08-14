import { Match, User } from '../db';
import { type LobbyAPI } from 'boardgame.io';

export default function main() {
  Match.findAll()
    .then((matches) => {
      matches.forEach((match) => {
        const { players } = match as unknown as LobbyAPI.Match;
        Object.values(players).forEach((player) => {
          console.log(player);
          if (!player.name) {
            return;
          }
          User.findOne({ where: { name: player.name } }).then((user) => {
            if (!user) return;
            user.addMatch(match);
          });
        });
      });
    })
    .catch(console.error)
    .finally(() => {
      console.log('connectUserMatches script complete');
    });
}
