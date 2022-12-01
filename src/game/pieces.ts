import type { GameState } from '@/game/Game';

export interface Piece {
  id: string;
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
  const { x } = pieceToCreate.position;
  if (G.cells[x]) {
    throw new Error('cell occupied');
  }
  G.cells[x] = pieceToCreate.owner;
  const pieceWithId = { ...pieceToCreate, id: G.pieces.length.toString() };
  G.pieces.push(pieceWithId);
};
