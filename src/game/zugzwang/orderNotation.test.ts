import { getOrdersFromNotation, validateOrderNotation } from './orderNotation';
import { test, expect } from 'vitest';

const validString = 'a1pN,a2mN,a3pNW,a4mNE,b2mS,b3mSW,b4pN,b5r3';
const invalidStrings = ['a7pN', 'a3rW', 'b5p3', 'c1pN', ',a1pN', 'a1pN,,b1pN'];

test('should validate', () => {
  expect(validateOrderNotation(validString)).toBe(true);
});
test.each(invalidStrings)('should invalidate %s', (string) => {
  expect(validateOrderNotation(string)).toBe(false);
});

const validStrings = [
  [
    'a1pN',
    [
      {
        type: 'push-straight',
        toTarget: { x: 0, y: -1 },
        owner: 0,
        piecePriority: 1,
      },
    ],
  ],
  [
    'b2mS',
    [
      {
        type: 'move-straight',
        toTarget: { x: 0, y: 1 },
        owner: 1,
        piecePriority: 2,
      },
    ],
  ],
  [
    'a3r4',
    [
      {
        type: 'place',
        toTarget: { x: 3, y: 0 },
        owner: 0,
        piecePriority: 3,
      },
    ],
    'b1r2',
    [
      {
        type: 'place',
        toTarget: { x: 1, y: 3 },
        owner: 1,
        piecePriority: 1,
      },
    ],
  ],
];
test.each(validStrings)('gets order template from %s', (string, output) => {
  // @ts-ignore
  expect(getOrdersFromNotation(string)).toEqual(output);
});
