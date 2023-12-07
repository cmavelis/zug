import type { LobbyAPI } from 'boardgame.io/dist/types/src/types';

export interface EnhancedMatch extends LobbyAPI.Match {
  score: { 0: number; 1: number };
  turn: number;
}
