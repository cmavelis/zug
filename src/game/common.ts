export interface Coordinates {
  x: number;
  y: number;
}

// assumes everything starts at 0
export const coordinatesToArray = (
  coordinates: Coordinates,
  shape: Coordinates
) => {
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
  displacement: Coordinates
) => {
  return { x: start.x + displacement.x, y: start.y + displacement.y };
};
