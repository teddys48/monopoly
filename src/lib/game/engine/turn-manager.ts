import type { Player } from '../domain/player';

export interface NextPlayerResult {
  nextIndex: number;
  wrappedAround: boolean;
}

/**
 * Finds the index of the next active player, skipping any inactive/eliminated players.
 *
 * @param players List of players in the game
 * @param currentIndex Index of the current active player
 * @returns The next eligible player index and whether the turn wrapped around to a new round
 */
export function getNextActivePlayerIndex(
  players: Player[],
  currentIndex: number
): NextPlayerResult {
  if (!players || players.length === 0) {
    throw new Error('Daftar pemain kosong.');
  }

  const total = players.length;
  if (currentIndex < 0 || currentIndex >= total) {
    throw new Error(`Indeks pemain saat ini tidak valid: ${currentIndex}.`);
  }

  for (let offset = 1; offset <= total; offset++) {
    const candidateIndex = (currentIndex + offset) % total;
    const candidate = players[candidateIndex];

    if (candidate.isActive !== false) {
      const wrappedAround = candidateIndex <= currentIndex;
      return {
        nextIndex: candidateIndex,
        wrappedAround
      };
    }
  }

  throw new Error('Tidak ada pemain aktif yang tersisa dalam permainan.');
}

/**
 * Checks whether the game has reached a terminal state (less than 2 active players).
 */
export function isGameOver(players: Player[]): boolean {
  const activeCount = players.filter((p) => p.isActive !== false).length;
  return activeCount < 2;
}
