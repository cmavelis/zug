import type { GameState } from '@/game/Game';
import {
  type Coordinates,
  coordinatesToArray,
  reportError,
} from '@/game/common';

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

  const usedPriorities = G.pieces
    .filter((p) => p.owner === pieceToCreate.owner)
    .map((p) => p.priority);

  const availablePriorities = [1, 2, 3, 4, 5, 6].filter(
    (n) => !usedPriorities.includes(n),
  );
  const randomIndex = Math.ceil(Math.random() * availablePriorities.length);
  const priority = availablePriorities[randomIndex];

  const pieceId = availableIds[0];
  G.cells[cellIndex] = pieceId;
  const pieceWithId = {
    isDefending: false,
    priority,
    ...pieceToCreate,
    id: pieceId,
  };
  G.pieces.push(pieceWithId);
};
