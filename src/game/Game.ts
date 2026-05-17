import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';

import { type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';
import { orderResolver } from '@/game/orders';
import type { Coordinates } from '@/game/common';
import { isValidOrder } from '@/game/zugzwang/validators';
import { validateTurnEnd } from '@/game/zugzwang/validators';
import type { ZugConfig as CommonGameConfig } from '@/game/zugzwang/config';
import { stripSecrets } from '@/game/common';
import { gameSetup } from '@/game/zugzwang/gameSetup';

export interface GameSetupData {
  config: Partial<CommonGameConfig>;
  empty?: boolean;
  initialState?: {
    boardNotation?: string;
    orderNotation?: string; // only works in conjunction with custom board setup
  };
}

export interface ZugConfig extends CommonGameConfig {
  board: Coordinates;
}

export interface GameState {
  config: ZugConfig;
  cells: Array<null | number>;
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
  piecesToPlace?: { [playerID: number]: number[] }; // optional key for back-compat
  players?: {
    // optional key for back-compat
    [playerID: number]: {
      seenLatestTurn: boolean;
    };
  };
  score: { [playerID: number]: number };
  events?: GameEvent[];
}

export interface GameEvent {
  type: 'score' | 'destroy';
  sourcePieceId: number;
}

export type GameStateHistory = Omit<GameState, 'config'>;

export type GObject = {
  history: GameStateHistory[][];
} & GameState;

export type ZugGameObject = Game<GObject>;

export const SimulChess: ZugGameObject = {
  name: 'zug',
  setup: gameSetup,

  // `playerID` could also be null or undefined for spectators.
  playerView: ({ G, playerID }) => {
    return stripSecrets(G, playerID);
  },

  turn: {
    onBegin: ({ events }) => {
      events.setActivePlayers({
        all: 'planning',
      });
    },
    stages: {
      planning: {
        moves: {
          addOrder: {
            move: (
              { G, playerID }: { G: GameState; playerID: string },
              order: Order,
            ) => {
              const playerNumber = +playerID;
              if (order.sourcePieceId >= 0) {
                // negative values don't reference a real source piece
                const movedPiece = G.pieces.find(
                  (p) => p.id === order.sourcePieceId,
                );

                // only order your pieces
                if (movedPiece?.owner !== playerNumber) {
                  return INVALID_MOVE;
                }

                // one order per piece
                if (
                  G.orders[playerNumber].find(
                    (currentOrders) =>
                      currentOrders.sourcePieceId === order.sourcePieceId,
                  )
                ) {
                  return INVALID_MOVE;
                }

                // validate type/direction
                if (!isValidOrder(movedPiece.owner, order)) {
                  return INVALID_MOVE;
                }
              }

              G.orders[playerNumber].push(order);
            },
            // Prevents the move counting towards a player's number of moves.
            noLimit: true,
          },
          removeLastOrder: {
            move: ({ G, playerID }: { G: GameState; playerID: string }) => {
              const playerNumber = +playerID;
              G.orders[playerNumber].pop();
            },
            noLimit: true,
          },
          removeOrder: {
            move: ({ G }: { G: GameState }, pieceID: number) => {
              for (const i of [0, 1]) {
                if (!G.orders[i]) return;
                G.orders[i] = G.orders[i].filter(
                  (order) => order.sourcePieceId !== pieceID,
                );
              }
            },
            noLimit: true,
          },
          markTurnSeen: {
            move: ({ G, playerID }: { G: GameState; playerID: string }) => {
              if (G.players) {
                G.players[Number(playerID)].seenLatestTurn = true;
              }
            },
          },
          endTurn: {
            move: ({
              G,
              playerID,
              events,
            }: {
              G: GameState;
              playerID: string;
              events: any;
            }) => {
              const playerNumber = +playerID;

              const validation = validateTurnEnd(
                playerNumber,
                G.orders,
                G.pieces,
                G.config?.expectedNumberOrders,
              );

              if (!validation.canEndTurn) {
                return INVALID_MOVE;
              }

              // If validation passes, end the stage and move to resolution
              events.endStage();
            },
          },
        },
        next: 'resolution',
      },
      resolution: {
        next: 'resolution',
      },
    },
    endIf: ({ ctx }) => {
      if (ctx.activePlayers)
        return Object.values(ctx.activePlayers).every(
          (p) => p === 'resolution',
        );
    },
    onEnd: ({ G }) => {
      try {
        // process all actions from players
        const newG = orderResolver({ G });
        // mark that all players haven't seen the new result
        for (const i in [0, 1]) {
          if (newG.players) {
            newG.players[i].seenLatestTurn = false;
          }
        }
        return newG;
      } catch (e) {
        console.error(e);
      }
    },
  },

  moves: {},

  endIf: ({ G }) => {
    const gameTo = 4;
    const p1Score = G.score[0];
    const p2Score = G.score[1];
    if (p1Score >= gameTo && p2Score >= gameTo) {
      if (p1Score === p2Score) {
        return { winner: -1 }; // TIE!
      }
      return { winner: p1Score > p2Score ? 0 : 1 };
    }
    if (p1Score >= gameTo) {
      return { winner: 0 };
    }
    if (p2Score >= gameTo) {
      return { winner: 1 };
    }
  },
};

export const zugGameDefinition = SimulChess;
