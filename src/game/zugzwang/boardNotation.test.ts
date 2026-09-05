import { zb, validateNotation } from './boardNotation';
import { test, expect } from 'vitest';

const validString = zb`
|a4|a2|a1|a3|
|--|--|--|--|
|--|--|--|--|
|b1|b3|b4|b2|
`;

const invalidCases = {
  missingDelimiter: zb`
|a4|a2|a1|a3|
|----|--|--|
|--|--|--|--|
|b1|b3|b4|b2|
`,
  invalidCellContent: zb`
|a4|c2|a1|a3|
|--|--|--|--|
|--|--|--|--|
|b1|b3|b4|b2|
`,
  invalidNumberRows: zb`
|a4|a2|a1|a3|
|--|--|--|--|
|b1|b3|b4|b2|
`,
  invalidEmptyCell: zb`
|a4|a2|a1|a3|
|==|--|--|--|
|--|--|--|--|
|b1|b3|b4|b2|
`,
};

test('should validate', () => {
  expect(validateNotation(validString)).toBe(true);
});
console.log(Object.entries(invalidCases));
test.each(Object.entries(invalidCases))(
  'should invalidate %s',
  (_, stringCase: string) => {
    expect(validateNotation(stringCase)).toBe(false);
  },
);
