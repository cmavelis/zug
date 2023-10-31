import type { GameState } from '@/game/Game';
import {
  type Coordinates,
  coordinatesToArray,
  reportError,
} from '@/game/common';
import { PRIORITIES_LIST } from '@/game/zugzwang/config';

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Piece {
  id: number;
  position: Coordinates;
  owner: number;
  isDefending: boolean;
  priority: number;
}

export const createPiece = ({
  G,
  pieceToCreate,
}: {
  G: GameState;
  pieceToCreate: Optional<Piece, 'id' | 'isDefending' | 'priority'>;
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

  let priority = pieceId;
  if (G.config.priority === 'piece') {
    const usedPriorities = G.pieces
      .filter((p) => p.owner === pieceToCreate.owner)
      .map((p) => p.priority);
    const availablePriorities = PRIORITIES_LIST.filter(
      (n) => !usedPriorities.includes(n),
    );
    const randomIndex = Math.floor(Math.random() * availablePriorities.length);
    priority = availablePriorities[randomIndex];
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
