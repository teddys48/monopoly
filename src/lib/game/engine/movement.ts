import { GAME_CONSTANTS } from '../rules/constants';

export interface MovementResult {
  startPosition: number;
  steps: number;
  traversedIndices: number[];
  destinationIndex: number;
  passedStart: boolean;
  landedOnStart: boolean;
  crossedStart: boolean;
}

/**
 * Calculates deterministic movement across a circular board.
 *
 * @param startPosition The 0-indexed starting tile position [0, boardSize - 1]
 * @param steps The number of tiles to advance (> 0)
 * @param boardSize Total number of tiles on the board (defaults to 16)
 * @returns Ordered traversed tiles and start-tile passing metadata
 */
export function calculateMovement(
  startPosition: number,
  steps: number,
  boardSize: number = GAME_CONSTANTS.BOARD_TILE_COUNT
): MovementResult {
  if (!Number.isInteger(boardSize) || boardSize < 2) {
    throw new Error(`Ukuran papan tidak valid: ${boardSize}. Harus berupa bilangan bulat >= 2.`);
  }

  if (!Number.isInteger(startPosition) || startPosition < 0 || startPosition >= boardSize) {
    throw new Error(
      `Posisi awal tidak valid: ${startPosition}. Harus berada dalam rentang [0, ${boardSize - 1}].`
    );
  }

  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(
      `Jumlah langkah tidak valid: ${steps}. Harus berupa bilangan bulat positif >= 1.`
    );
  }

  const traversedIndices: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const nextTile = (startPosition + i) % boardSize;
    traversedIndices.push(nextTile);
  }

  const destinationIndex = traversedIndices[traversedIndices.length - 1];
  const landedOnStart = destinationIndex === 0;
  // Passed start if tile 0 was traversed before the final destination tile
  const passedStart = traversedIndices.slice(0, -1).includes(0);
  const crossedStart = passedStart || landedOnStart;

  return {
    startPosition,
    steps,
    traversedIndices,
    destinationIndex,
    passedStart,
    landedOnStart,
    crossedStart
  };
}
