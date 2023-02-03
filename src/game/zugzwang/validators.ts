/** for zugzwang game
 */
import type { Piece } from '@/game/pieces';
import type {
  AttackOrder,
  MoveDiagonalOrder,
  MoveStraightOrder,
} from '@/game/orders';
import type { Coordinates } from '@/game/common';

export function isDiagonal(vector: Coordinates): boolean {
  const xChangesAllowed = [-1, 1];
  const yChangesAllowed = [-1, 1];

  return (
    xChangesAllowed.includes(vector.x) && yChangesAllowed.includes(vector.y)
  );
}

export function isStraight(vector: Coordinates): boolean {
  if (Math.abs(vector.x) > 0) {
    return vector.y === 0;
  }
  if (Math.abs(vector.y) > 0) {
    return vector.x === 0;
  }
  return false;
}

export function isValidMoveDiagonal(
  piece: Piece,
  move: MoveDiagonalOrder
): boolean {
  return isDiagonal(move.toTarget);
}

export function isValidMoveStraight(
  piece: Piece,
  move: MoveStraightOrder
): boolean {
  // assume moves can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  const xChangeAllowed = 0;

  const yChange = move.toTarget.y;
  const xChange = move.toTarget.x;

  return yChange === yChangeAllowed && xChange === xChangeAllowed;
}

export function isValidAttack(piece: Piece, attack: AttackOrder): boolean {
  // assume attacks can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  // attack is diagonal
  const xChangesAllowed = [-1, 1];

  const yChange = attack.toTarget.y;
  const xChange = attack.toTarget.x;

  return yChange === yChangeAllowed && xChangesAllowed.includes(xChange);
}
