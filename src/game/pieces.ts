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

  const pieceId = G.pieces.length;
  G.cells[x] = pieceId;
  const pieceWithId = { ...pieceToCreate, id: pieceId.toString() };
  G.pieces.push(pieceWithId);
};
