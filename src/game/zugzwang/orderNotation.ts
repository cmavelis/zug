/**
 * utilities for working with zug order notation
 *
 * example notation:
 *
 * const a = 'a1pN,a2mN,a3pNW,a4mNE,b2mS,b3mSW,b4pN,b5r3'
 *
 * piece id is consistent with board notation
 *  a is player 1
 *  b is player 2
 *  a1 is player 1's 1-piece
 *
 * action ids:
 *  (p)ush
 *  (m)ove
 *  (r)eplace
 *
 * octilinear directions, use compass
 *  NW NN NE
 *  WW    EE
 *  SW SS SE
 *
 * replace action can be: 1-4, indicating the baseline of the board
 *
 */
