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
