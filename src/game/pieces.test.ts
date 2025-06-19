import { test, expect, vi } from 'vitest';
import { makeTestGame, makeTestPiece } from '@/game/test-utils';
import { generatePiecePriority, type PieceToCreate } from '@/game/pieces';

import * as common from '@/game/common';
import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';

const spy = vi.spyOn(common, 'randomFromArray');

const allButLastPriority = DEFAULT_ZUG_CONFIG.piecePriorityOptions.slice(0, -1);

const piecesallButOnePriority = allButLastPriority.map((v) =>
  makeTestPiece({ priority: v }),
);

const defaultG = makeTestGame();

const pieceToCreate: PieceToCreate = makeTestPiece({ id: 3 });

test('generate priorities, default', () => {
  const defaultPriorities = DEFAULT_ZUG_CONFIG.piecePriorityOptions;
  const newPriority = generatePiecePriority({
    G: defaultG,
    pieceToCreate,
  });
  expect(spy).toHaveBeenCalledWith(defaultPriorities);
  expect(DEFAULT_ZUG_CONFIG.piecePriorityOptions).toContain(newPriority);
});

test('generate priorities, default, one option', () => {
  const G = makeTestGame({
    pieces: piecesallButOnePriority,
  });
  const newPriority = generatePiecePriority({
    G,
    pieceToCreate,
  });
  expect(newPriority).toEqual(DEFAULT_ZUG_CONFIG.piecePriorityOptions.at(-1));
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

test('generate priorities, allow duplicates', () => {
  const GNone = makeTestGame({
    config: { ...defaultG.config, piecePriorityDuplicates: true },
    pieces: [1, 2, 3, 4, 5, 6].map((v) => makeTestPiece({ priority: v })),
  });
  const newPriority = generatePiecePriority({
    G: GNone,
    pieceToCreate,
  });
  // 99 is error
  expect(newPriority).not.toEqual(99);
});
