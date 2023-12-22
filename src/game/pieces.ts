import type { GameState } from '@/game/Game';
import {
  type Coordinates,
  coordinatesToArray,
  randomFromArray,
  reportError,
} from '@/game/common';

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Piece {
  id: number;
  position: Coordinates;
  owner: 0 | 1;
  isDefending: boolean;
  priority: number;
}

export type PieceToCreate = Optional<Piece, 'id' | 'isDefending' | 'priority'>;

// priorityArray will override the game config
export const generatePiecePriority = ({
  G,
  pieceToCreate,
  priorityArray,
}: {
  G: GameState;
  pieceToCreate: PieceToCreate;
  priorityArray?: number[];
}) => {
  const { piecePriorityOptions } = G.config;
  // Setting priority
  let allowedPriorities = piecePriorityOptions;

  if (priorityArray) {
    const priorityDifference = priorityArray.filter(
      (x) => !piecePriorityOptions.includes(x),
    );
    if (priorityDifference.length > 0) {
      console.warn(
        'Priority range has the following numbers outside the configured :',
        priorityDifference,
      );
    }
    allowedPriorities = priorityArray;
  }
  let priority = 0;
  if (G.config.priority === 'piece') {
    const usedPriorities = G.pieces
      .filter((p) => p.owner === pieceToCreate.owner)
      .map((p) => p.priority);
    const availablePriorities = allowedPriorities.filter(
      (n) => !usedPriorities.includes(n),
    );
    if (availablePriorities.length === 0) {
      console.error('No priorities available to assign piece, assigning 99');
      availablePriorities.push(99);
    }
    priority = randomFromArray(availablePriorities);
  }

  return priority;
};

/**
 * Create piece based on game conditions and configuration
 * @param G
 * @param pieceToCreate
 * @param priorityArray
 * @param forcedPriority used to override all other options and set priority to a number
 */
export const createPiece = ({
  G,
  pieceToCreate,
  priorityArray,
  forcedPriority,
}: {
  G: GameState;
  pieceToCreate: PieceToCreate;
  priorityArray?: number[];
  forcedPriority?: number;
}) => {
  const cellIndex = coordinatesToArray(pieceToCreate.position, G.config.board);
  if (G.cells[cellIndex]) {
    reportError('cell occupied');
  }

  const idsByOwner: { [pID: number]: number[] } = {
    0: [0, 1, 2, 3],
    1: [4, 5, 6, 7],
  };

  const usedIds = G.pieces.map((p) => p.id);
  const availableIds = idsByOwner[pieceToCreate.owner].filter(
    (id) => !usedIds.includes(id),
  );

  if (availableIds.length === 0) {
    console.error('no ids available to create piece');
    return;
  }

  const pieceId = availableIds[0];
  let priority =
    forcedPriority ??
    generatePiecePriority({ G, pieceToCreate, priorityArray });
  if (priority === 0) {
    priority = pieceId;
  }

  G.cells[cellIndex] = pieceId;
  const pieceWithId = {
    isDefending: false,
    priority,
    ...pieceToCreate,
    id: pieceId,
  };
  G.pieces.push(pieceWithId);
};
