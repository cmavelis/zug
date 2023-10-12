import type { GameState } from '@/game/Game';
import {
  type Coordinates,
  coordinatesToArray,
  reportError,
} from '@/game/common';

export interface Piece {
  id: number;
  position: Coordinates;
  owner: number;
  isDefending: boolean;
}

export const createPiece = ({
  G,
  pieceToCreate,
}: {
  G: GameState;
  pieceToCreate: Omit<Piece, 'id' | 'isDefending'>;
}) => {
  const cellIndex = coordinatesToArray(pieceToCreate.position, G.board);
  if (G.cells[cellIndex]) {
    reportError('cell occupied');
  }

  const idsByOwner: { [pID: number]: number[] } = {
    0: [0, 1, 2, 3],
    1: [4, 5, 6, 7],
  };

  const usedIds = G.pieces.map((p) => p.id);
  const availableIds = idsByOwner[pieceToCreate.owner].filter(
    (id) => !usedIds.includes(id)
  );

  if (availableIds.length === 0) {
    console.error('no ids available to create piece');
    return;
  }

  const pieceId = availableIds[0];
  G.cells[cellIndex] = pieceId;
  const pieceWithId = { isDefending: false, ...pieceToCreate, id: pieceId };
  G.pieces.push(pieceWithId);
};
