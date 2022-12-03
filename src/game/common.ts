export interface Coordinates {
  x: number;
  y: number;
}

export const coordinatesToArray = (
  coordinates: Coordinates,
  shape: Coordinates
) => {
  return shape.x * coordinates.x + coordinates.y;
};
