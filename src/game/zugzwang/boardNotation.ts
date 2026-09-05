/**
 * utilities for working with zug board notation
 *
 * example notation:
 *
 * const a = `
 * |a4|a2|a1|a3|
 * |--|--|--|--|
 * |--|--|--|--|
 * |b1|b3|b4|b2|
 * `
 */
import type { PieceToCreate } from '@/game/pieces';

// Simple tagged template literal fn to remove newlines and extra spaces. Stands for "zug board"
export const zb = (strings: TemplateStringsArray, ...values: string[]) =>
  strings
    .reduce((acc, str, i) => acc + str + (values[i] || ''), '')
    .replace(/\s+/g, '')
    .trim();

const splitRows = (boardString: string) => {
  return boardString.split('||');
};

const splitColumns = (boardRowString: string) => {
  return boardRowString.split('|').filter(Boolean);
};

const cellHasPiece = (cell: string) => {
  return cell !== '--';
};

export const validateNotation = (boardString: string) => {
  let validity = true;
  try {
    // valid # of rows
    const rows = splitRows(boardString);
    if (rows.length !== 4) {
      validity = false;
      console.assert(validity, `Invalid number of rows in ${rows}`);
      return validity;
    }

    // valid # of cols
    const cellsArray = rows.map(splitColumns);
    if (cellsArray.some((row) => row.length !== 4)) {
      validity = false;
      console.assert(validity, `Invalid number of columns in ${cellsArray}`);
      return validity;
    }

    // valid cell contents
    const re = /[ab][1-9]|--/;
    const rowValidity = cellsArray.every((row) =>
      row.every((cell) => re.test(cell)),
    );
    console.assert(rowValidity, `Invalid cell contents in ${cellsArray}`);
    return rowValidity;
  } catch (e) {
    return false;
  }
};

export const getPiecesFromNotation = (boardString: string): PieceToCreate[] => {
  const rows = splitRows(boardString);
  const cellsArray = rows.map(splitColumns);
  const pieces: PieceToCreate[] = [];

  cellsArray.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cellHasPiece(cell)) {
        return;
      }
      const playerId = cell[0];
      const owner = playerId === 'a' ? 0 : 1;
      const priority = Number(cell[1]);

      pieces.push({
        position: { x: c, y: r },
        owner,
        priority,
      });
    }),
  );
  return pieces;
};
