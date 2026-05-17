import {
  type ZugGameObject,
  zugGameDefinition,
  type GameSetupData,
} from '@/game/Game';
import { gameSetup } from '@/game/zugzwang/gameSetup';
import { zb } from '@/game/zugzwang/boardNotation';

export const oneMoveTutorial: ZugGameObject = {
  ...zugGameDefinition,
  setup: (argOne, setupData: GameSetupData) => {
    const mergedSetupData: GameSetupData = {
      ...setupData,
      // config: {// TODO: this is crashing for some reason
      //   ...setupData.config,
      // },
      initialState: {
        boardNotation: zb`
         |--|a1|--|--|
         |--|--|--|--|
         |--|--|--|--|
         |--|--|--|--|
        `,
        //  TODO:  add initial orders
        // orderNotation: '',
      },
    };
    return gameSetup(argOne, mergedSetupData);
  },
  endIf: ({ ctx }) => {
    if (ctx.turn > 1) {
      return { winner: 0 };
    }
  },
};
