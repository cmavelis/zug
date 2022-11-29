import type { GameState } from '@/game/Game';

export interface Piece {
  id?: string;
  position: { x: number; y: number };
  owner: number;
}

export const createPiece = ({
  G,
  pieceToCreate,
}: {
  G: GameState;
  pieceToCreate: Piece;
}) => {
  const { x } = pieceToCreate.position;
  if (G.cells[x]) {
    throw new Error('cell occupied');
  }
  G.cells[x] = pieceToCreate.owner;
  pieceToCreate.id = G.pieces.length.toString();
  G.pieces.push(pieceToCreate);
};
