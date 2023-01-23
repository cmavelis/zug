/** for zugzwang game
 */
import type { Piece } from '@/game/pieces';
import type { AttackOrder, MoveOrder } from '@/game/orders';

export function moveValidator(piece: Piece, move: MoveOrder): boolean {
  // assume moves can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  const xChangeAllowed = 0;

  const yChange = move.moveTo.y - piece.position.y;
  const xChange = move.moveTo.x - piece.position.x;

  return yChange === yChangeAllowed && xChange === xChangeAllowed;
}

export function attackValidator(piece: Piece, attack: AttackOrder): boolean {
  // assume attacks can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  // attack is diagonal
  const xChangesAllowed = [-1, 1];

  const yChange = attack.target.y - piece.position.y;
  const xChange = attack.target.x - piece.position.x;

  return yChange === yChangeAllowed && xChangesAllowed.includes(xChange);
}
