import type {
  ActivePlayers,
  LobbyAPI,
} from 'boardgame.io/dist/types/src/types';

export interface EnhancedMatch extends LobbyAPI.Match {
  activePlayers: ActivePlayers | null;
  score: { 0: number; 1: number };
  turn: number;
}

export interface MatchTokenPayload {
  credential: string;
}
