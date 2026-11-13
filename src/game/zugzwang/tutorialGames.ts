import {
  type ZugGameObject,
  zugGameDefinition,
  type GameSetupData,
} from '@/game/Game';
import { gameSetup } from '@/game/zugzwang/gameSetup';
import { zb } from '@/game/zugzwang/boardNotation';

export const oneMoveTutorial: ZugGameObject = {
  ...zugGameDefinition,
  setup: (argOne, setupData?: GameSetupData) => {
    const mergedSetupData: GameSetupData = {
      ...setupData,
      config: {
        ...setupData?.config,
        piecePriorityOptions: [1],
        expectedNumberOrders: {
          0: 1,
          1: 0,
        },
        expectedNumberPieces: {
          0: 1,
          1: 0,
        },
      },
      initialState: {
        boardNotation: zb`
         |--|a1|--|--|
         |--|--|--|--|
         |--|--|--|--|
         |--|--|--|--|
        `,
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

export const oneMoveScoringTutorial: ZugGameObject = {
  ...zugGameDefinition,
  setup: (argOne, setupData?: GameSetupData) => {
    const mergedSetupData: GameSetupData = {
      ...setupData,
      config: {
        ...setupData?.config,
        piecePriorityOptions: [1, 2],
        expectedNumberOrders: {
          0: 2,
          1: 0,
        },
        expectedNumberPieces: {
          0: 2,
          1: 0,
        },
      },
      initialState: {
        boardNotation: zb`
         |--|a1|--|--|
         |--|a2|--|--|
         |--|--|--|--|
         |--|--|--|--|
        `,
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

export const fullOneMoveTutorial: ZugGameObject = {
  ...zugGameDefinition,
  setup: (argOne, setupData?: GameSetupData) => {
    const mergedSetupData: GameSetupData = {
      ...setupData,
      config: {
        ...setupData?.config,
        piecePriorityOptions: [1, 2, 3, 4],
        expectedNumberOrders: {
          0: 4,
          1: 0,
        },
        expectedNumberPieces: {
          0: 4,
          1: 0,
        },
      },
      piecesToPlace: { 0: [1], 1: [] },
      initialState: {
        boardNotation: zb`
         |--|--|--|a2|
         |--|--|a3|--|
         |--|a4|--|--|
         |--|--|--|--|
        `,
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

export const blockAndScoreTutorial: ZugGameObject = {
  ...zugGameDefinition,
  setup: (argOne, setupData?: GameSetupData) => {
    const mergedSetupData: GameSetupData = {
      ...setupData,
      config: {
        ...setupData?.config,
        expectedNumberOrders: {
          0: 4,
          1: 4,
        },
        expectedNumberPieces: {
          0: 4,
          1: 4,
        },
      },
      piecesToPlace: { 0: [], 1: [1, 6] },
      initialState: {
        boardNotation: zb`
         |--|--|a2|a3|
         |a5|--|--|--|
         |a4|--|b4|--|
         |--|--|b2|--|
        `,
        orderNotation: 'b2pN,b4mNW,b1r1,b6r2',
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
