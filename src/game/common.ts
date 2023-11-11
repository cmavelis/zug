import type { GameState } from '@/game/Game';

export interface Coordinates {
  x: number;
  y: number;
}

// assumes everything starts at 0
export const coordinatesToArray = (
  coordinates: Coordinates,
  shape: Coordinates,
) => {
  // off board -
  if (coordinates.y < 0 || coordinates.x < 0) {
    return -999;
  }
  // off board +
  if (coordinates.y >= shape.y || coordinates.x >= shape.x) {
    return 999;
  }
  return shape.x * coordinates.y + coordinates.x;
};

// assumes everything starts at 0
export const arrayToCoordinates = (arrayIndex: number, shape: Coordinates) => {
  const remainderX = arrayIndex % shape.x;
  const y = (arrayIndex - remainderX) / shape.x;

  return { x: remainderX, y };
};

export const getDisplacement = (start: Coordinates, end: Coordinates) => {
  return { x: end.x - start.x, y: end.y - start.y };
};

export const addDisplacement = (
  start: Coordinates,
  displacement: Coordinates,
) => {
  return { x: start.x + displacement.x, y: start.y + displacement.y };
};

export const isOppositeVector = (
  vector1: Coordinates,
  vector2: Coordinates,
) => {
  return vector1.x === -vector2.x && vector1.y === -vector2.y;
};

export function reportError(e: string) {
  console.error(e);
}

export const getPiece = (G: GameState, id: number) => {
  return G.pieces.find((p) => p.id === id);
};
