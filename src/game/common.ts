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
