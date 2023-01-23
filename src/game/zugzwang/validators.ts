/** for zugzwang game
 */
import type { Piece } from '@/game/pieces';
import type { AttackOrder, MoveOrder } from '@/game/orders';

export function moveValidator(piece: Piece, move: MoveOrder): boolean {
  // assume moves can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  const xChangeAllowed = 0;

  const yChange = move.toTarget.y;
  const xChange = move.toTarget.x;

  return yChange === yChangeAllowed && xChange === xChangeAllowed;
}

export function attackValidator(piece: Piece, attack: AttackOrder): boolean {
  // assume attacks can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  // attack is diagonal
  const xChangesAllowed = [-1, 1];

  const yChange = attack.toTarget.y;
  const xChange = attack.toTarget.x;

  return yChange === yChangeAllowed && xChangesAllowed.includes(xChange);
}
