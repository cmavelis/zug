import fs from 'fs'
import  _  from 'lodash';

const pieceSet = [2, 3, 4, 5];
const badBoards = [
  '2-5-3-4, 2-3-5-4',
  '2-5-3-4, 3-4-5-2',
  '2-5-3-4, 5-3-2-4',
  '2-5-3-4, 5-4-2-3',
  '3-2-5-4, 4-2-3-5',
  '3-2-5-4, 4-5-3-2',
  '3-5-2-4, 2-3-5-4',
  '3-5-2-4, 3-4-5-2',
  '3-5-2-4, 5-3-2-4',
  '3-5-2-4, 5-4-2-3',
].map((i) => i.split(', ').map((j) => j.split('-').map(Number)));

const reversedBadBoards = badBoards.map((board) =>
  board.map((side) => side.toReversed()),
);
const allBadBoards = badBoards.concat(reversedBadBoards);

function permuteUtil(nums, visited, permutation, result) {
  if (permutation.length === nums.length) {
    result.push([...permutation]);
    return;
  }

  for (let i = 0; i < nums.length; i++) {
    if (!visited[i]) {
      visited[i] = true;
      permutation.push(nums[i]);
      permuteUtil(nums, visited, permutation, result);
      permutation.pop();
      visited[i] = false;
    }
  }
}

function permute(nums) {
  const result = [];
  const visited = Array(nums.length).fill(false);
  permuteUtil(nums, visited, [], result);
  return result;
}

const linePermutations = permute(pieceSet);
const allStartingBoards = linePermutations.flatMap((line1) => {
  return linePermutations.map((line2) => {
    return [line1,line2]
  });
});


const fairBoards = allStartingBoards.filter((board) => !allBadBoards.some(board2=> _.isEqual(board, board2)) )

console.log(allStartingBoards.length, 'startingBoards');
console.log(allBadBoards.length, 'unfair boards');
console.log(fairBoards.length, 'fair boards');

const json = JSON.stringify(fairBoards, null, 2)

fs.writeFile('fair-boards.json', json, 'utf8', ()=> console.log('Written to file'));
