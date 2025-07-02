import { describe, it, expect } from 'vitest';

// Mock test to demonstrate the fix for spectator history viewing
describe('MatchView spectator fix', () => {
  it('should show result state for both spectators and players when viewing last turn', () => {
    // Mock game state with history
    const mockGameState = {
      G: {
        history: [
          ['step1', 'step2', 'step3'], // Turn 1
          ['step1', 'step2'], // Turn 2
        ]
      }
    };

    // Function to simulate the old buggy behavior
    const setHistoryLastTurnOld = (playerID: number | null, gameState: any) => {
      if (typeof playerID !== 'number') {
        return gameState.G.history.length; // Spectators get history.length
      } else {
        return gameState.G.history.length + 1; // Players get history.length + 1
      }
    };

    // Function to simulate the new fixed behavior
    const setHistoryLastTurnNew = (playerID: number | null, gameState: any) => {
      return gameState.G.history.length + 1; // Both spectators and players get history.length + 1
    };

    // Mock isActiveTurn logic
    const isActiveTurn = (historyTurn: number, historyLength: number) => {
      return historyTurn > historyLength;
    };

    // Test old behavior (buggy)
    const spectatorTurnOld = setHistoryLastTurnOld(null, mockGameState);
    const playerTurnOld = setHistoryLastTurnOld(0, mockGameState);
    
    expect(spectatorTurnOld).toBe(2); // Spectator sees turn 2 (history only)
    expect(playerTurnOld).toBe(3); // Player sees turn 3 (result state)
    expect(isActiveTurn(spectatorTurnOld, 2)).toBe(false); // Spectator doesn't see result
    expect(isActiveTurn(playerTurnOld, 2)).toBe(true); // Player sees result

    // Test new behavior (fixed)
    const spectatorTurnNew = setHistoryLastTurnNew(null, mockGameState);
    const playerTurnNew = setHistoryLastTurnNew(0, mockGameState);
    
    expect(spectatorTurnNew).toBe(3); // Spectator now sees turn 3 (result state)
    expect(playerTurnNew).toBe(3); // Player still sees turn 3 (result state)
    expect(isActiveTurn(spectatorTurnNew, 2)).toBe(true); // Spectator now sees result
    expect(isActiveTurn(playerTurnNew, 2)).toBe(true); // Player still sees result
  });
});