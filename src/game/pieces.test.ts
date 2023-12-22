import { test, expect, vi } from 'vitest';
import { makeTestGame, makeTestPiece } from '@/game/test-utils';
import { generatePiecePriority, type PieceToCreate } from '@/game/pieces';

import * as common from '@/game/common';

const spy = vi.spyOn(common, 'randomFromArray');

const pieces1to5priority = [1, 2, 3, 4, 5].map((v) =>
  makeTestPiece({ priority: v }),
);

const defaultG = makeTestGame();

const pieceToCreate: PieceToCreate = makeTestPiece({ id: 3 });

test('generate priorities, default', () => {
  const defaultPriorities = [1, 2, 3, 4, 5, 6];
  const newPriority = generatePiecePriority({
    G: defaultG,
    pieceToCreate,
  });
  expect(spy).toHaveBeenCalledWith(defaultPriorities);
  expect([1, 2, 3, 4, 5, 6]).toContain(newPriority);
});

test('generate priorities, default', () => {
  const G = makeTestGame({
    pieces: pieces1to5priority,
  });
  const newPriority = generatePiecePriority({
    G,
    pieceToCreate,
  });
  expect(newPriority).toEqual(6);
});

test('generate priorities, using seed array', () => {
  const newPriority = generatePiecePriority({
    G: defaultG,
    pieceToCreate,
    priorityArray: [1],
  });
  expect(newPriority).toEqual(1);
});

test('generate priorities, none available', () => {
  const GNone = makeTestGame({
    pieces: [1, 2, 3, 4, 5, 6].map((v) => makeTestPiece({ priority: v })),
  });
  const newPriority = generatePiecePriority({
    G: GNone,
    pieceToCreate,
  });
  // 99 is error
  expect(newPriority).toEqual(99);
});
