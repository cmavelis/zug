import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';
import { createPiece } from '@/game/pieces';
import {
  getConditionalStartingBoard,
  hasFirstTurnScore,
} from '@/game/setup/util';
import { isEqual, negate, random, shuffle } from 'lodash';
import fairBoards from '@/game/setup/fair-boards.json';
import type { GameSetupData } from '@/game/Game';

let hostname: any;
let port: any;
let empty = false;
if (typeof window !== 'undefined' && window?.location) {
  hostname = window.location.hostname;
  port = window.location.port;

  const queryString = window.location.search; // Returns:'?q=123'
  const params = new URLSearchParams(queryString);
  empty = Boolean(params.get('empty'));
}

export const gameSetup = (
  _: any,
  setupData: GameSetupData = { config: {} },
) => {
  const board = { x: 4, y: 4 };
  const initialGame = {
    config: {
      board,
      ...DEFAULT_ZUG_CONFIG,
      ...setupData.config,
    },
    cells: Array(board.x * board.y).fill(null),
    pieces: [],
    orders: { 0: [], 1: [] },
    history: [],
    score: { 0: 0, 1: 0 },
    players: Object.fromEntries(
      [0, 1].map((i) => [i, { seenLatestTurn: true }]),
    ),
  };

  if (setupData?.empty || empty) {
    return initialGame;
  }
  if (hostname === 'localhost' && port === '5173') {
    [0, 1, 2, 3].forEach((x) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 0, position: { x, y: 0 } },
      }),
    );

    [0, 1, 2].forEach((x) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 1, position: { x, y: 2 } },
      }),
    );
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 3, y: 3 } },
    });
  } else {
    const {
      startingPiecePriorities,
      useFairStartingBoard,
      piecePriorityOptions,
    } = setupData.config;
    let p1PiecePriorities: number[] = [];
    let p2PiecePriorities: number[] = [];
    if (
      useFairStartingBoard === 'no-first-turn-score' &&
      piecePriorityOptions
    ) {
      p1PiecePriorities = getConditionalStartingBoard(
        piecePriorityOptions,
        negate(hasFirstTurnScore),
      );
      p2PiecePriorities = getConditionalStartingBoard(
        piecePriorityOptions,
        negate(hasFirstTurnScore),
      );
    } else if (
      useFairStartingBoard && // NOTE: this option is only configured for 2345 start
      isEqual(piecePriorityOptions, DEFAULT_ZUG_CONFIG.piecePriorityOptions)
    ) {
      const startingBoard = fairBoards[random(0, fairBoards.length)];
      p1PiecePriorities = startingBoard[0];
      p2PiecePriorities = startingBoard[1];
    } else {
      p1PiecePriorities = shuffle(startingPiecePriorities);
      p2PiecePriorities = shuffle(startingPiecePriorities);
    }

    [0, 1, 2, 3].forEach((x, i) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 0, position: { x, y: 0 } },
        forcedPriority: p1PiecePriorities[i],
      }),
    );

    [0, 1, 2, 3].forEach((x, i) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 1, position: { x, y: 3 } },
        forcedPriority: p2PiecePriorities[i],
      }),
    );
  }

  return initialGame;
};
