import type { IGameState } from '@/game/Game';

export interface IPiece {
  id?: string;
  position: { x: number; y: number };
  owner: number;
}

export const createPiece = ({
  G,
  pieceToCreate,
}: {
  G: IGameState;
  pieceToCreate: IPiece;
}) => {
  const { x } = pieceToCreate.position;
  if (G.cells[x]) {
    throw new Error('cell occupied');
  }
  G.cells[x] = pieceToCreate.owner;
  G.pieces.push(pieceToCreate);
};
