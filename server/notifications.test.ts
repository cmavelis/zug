import { describe, expect, it } from 'vitest';
import { getPlayersEnteringPlanning } from './notifications';

describe('getPlayersEnteringPlanning', () => {
  it('does not notify the player who just ended their turn', () => {
    expect(
      getPlayersEnteringPlanning(
        { 0: 'planning', 1: 'planning' },
        { 0: 'resolution', 1: 'planning' },
      ),
    ).toEqual([]);
  });

  it('notifies the waiting player when a new turn begins', () => {
    // player 1 submits last: the turn resolves and a new one starts in one update
    expect(
      getPlayersEnteringPlanning(
        { 0: 'resolution', 1: 'planning' },
        { 0: 'planning', 1: 'planning' },
      ),
    ).toEqual([0]);
  });

  it('notifies both players when both move into planning', () => {
    expect(
      getPlayersEnteringPlanning(
        { 0: 'resolution', 1: 'resolution' },
        { 0: 'planning', 1: 'planning' },
      ),
    ).toEqual([0, 1]);
  });

  it('does not notify when stages are unchanged', () => {
    expect(
      getPlayersEnteringPlanning(
        { 0: 'planning', 1: 'resolution' },
        { 0: 'planning', 1: 'resolution' },
      ),
    ).toEqual([]);
  });

  it('does not notify when a player leaves the active players', () => {
    expect(
      getPlayersEnteringPlanning(
        { 0: 'planning', 1: 'resolution' },
        { 0: 'planning' },
      ),
    ).toEqual([]);
  });

  it('returns no players when either state has no active players', () => {
    const planning = { 0: 'planning', 1: 'planning' };
    expect(getPlayersEnteringPlanning(null, planning)).toEqual([]);
    expect(getPlayersEnteringPlanning(planning, null)).toEqual([]);
    expect(getPlayersEnteringPlanning(undefined, undefined)).toEqual([]);
  });
});
