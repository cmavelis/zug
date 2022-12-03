import type { GameState } from '@/game/Game';
import { coordinatesToArray } from '@/game/common';

export interface Piece {
  id: number;
  position: { x: number; y: number };
  owner: number;
}

export const createPiece = ({
  G,
  pieceToCreate,
}: {
  G: GameState;
  pieceToCreate: Omit<Piece, 'id'>;
}) => {
  const cellIndex = coordinatesToArray(pieceToCreate.position, G.board);
  if (G.cells[cellIndex]) {
    throw new Error('cell occupied');
  }

  const pieceId = G.pieces.length;
  G.cells[cellIndex] = pieceId;
  const pieceWithId = { ...pieceToCreate, id: pieceId };
  G.pieces.push(pieceWithId);
};
