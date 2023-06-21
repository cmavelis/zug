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

  const pieceId = G.pieces.length;
  G.cells[cellIndex] = pieceId;
  const pieceWithId = { isDefending: false, ...pieceToCreate, id: pieceId };
  G.pieces.push(pieceWithId);
};
