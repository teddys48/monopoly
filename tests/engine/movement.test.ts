import { describe, it, expect } from 'vitest';
import { calculateMovement } from '../../src/lib/game/engine/movement';

describe('Movement Engine', () => {
  const BOARD_SIZE = 16;

  it('moves by a normal number of steps correctly within board bounds', () => {
    const result = calculateMovement(2, 5, BOARD_SIZE);
    expect(result.startPosition).toBe(2);
    expect(result.steps).toBe(5);
    expect(result.traversedIndices).toEqual([3, 4, 5, 6, 7]);
    expect(result.destinationIndex).toBe(7);
    expect(result.landedOnStart).toBe(false);
    expect(result.passedStart).toBe(false);
    expect(result.crossedStart).toBe(false);
  });

  it('moves across the final board tile (index 15) and wraps around to starting positions', () => {
    // Starting at 14, moving 4 steps: 14 -> 15 -> 0 -> 1 -> 2
    const result = calculateMovement(14, 4, BOARD_SIZE);
    expect(result.startPosition).toBe(14);
    expect(result.steps).toBe(4);
    expect(result.traversedIndices).toEqual([15, 0, 1, 2]);
    expect(result.destinationIndex).toBe(2);
    expect(result.landedOnStart).toBe(false);
    expect(result.passedStart).toBe(true);
    expect(result.crossedStart).toBe(true);
  });

  it('handles moving exactly onto the starting tile (index 0)', () => {
    // Starting at 13, moving 3 steps: 13 -> 14 -> 15 -> 0
    const result = calculateMovement(13, 3, BOARD_SIZE);
    expect(result.startPosition).toBe(13);
    expect(result.steps).toBe(3);
    expect(result.traversedIndices).toEqual([14, 15, 0]);
    expect(result.destinationIndex).toBe(0);
    expect(result.landedOnStart).toBe(true);
    expect(result.passedStart).toBe(false);
    expect(result.crossedStart).toBe(true);
  });

  it('handles moving past the starting tile (index 0 traversed as intermediate step)', () => {
    // Starting at 15, moving 2 steps: 15 -> 0 -> 1
    const result = calculateMovement(15, 2, BOARD_SIZE);
    expect(result.traversedIndices).toEqual([0, 1]);
    expect(result.destinationIndex).toBe(1);
    expect(result.landedOnStart).toBe(false);
    expect(result.passedStart).toBe(true);
    expect(result.crossedStart).toBe(true);
  });

  it('moving from start (index 0) forward does not register as passing start', () => {
    // Starting at 0, moving 6 steps: 0 -> 1, 2, 3, 4, 5, 6
    const result = calculateMovement(0, 6, BOARD_SIZE);
    expect(result.traversedIndices).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.destinationIndex).toBe(6);
    expect(result.landedOnStart).toBe(false);
    expect(result.passedStart).toBe(false);
    expect(result.crossedStart).toBe(false);
  });

  it('guarantees no duplicate tile processing during standard single turn movement (steps <= 12)', () => {
    // In 2-dice roll, max steps is 12. Since board is 16, every traversed tile is distinct
    const result = calculateMovement(10, 12, BOARD_SIZE);
    expect(result.steps).toBe(12);
    expect(result.traversedIndices.length).toBe(12);
    const uniqueTiles = new Set(result.traversedIndices);
    expect(uniqueTiles.size).toBe(12);
  });

  it('rejects invalid board size', () => {
    expect(() => calculateMovement(0, 4, 1)).toThrow(/Ukuran papan tidak valid/);
    expect(() => calculateMovement(0, 4, -5)).toThrow(/Ukuran papan tidak valid/);
  });

  it('rejects out-of-bounds startPosition', () => {
    expect(() => calculateMovement(-1, 4, 16)).toThrow(/Posisi awal tidak valid/);
    expect(() => calculateMovement(16, 4, 16)).toThrow(/Posisi awal tidak valid/);
  });

  it('rejects non-positive step counts', () => {
    expect(() => calculateMovement(0, 0, 16)).toThrow(/Jumlah langkah tidak valid/);
    expect(() => calculateMovement(0, -3, 16)).toThrow(/Jumlah langkah tidak valid/);
  });
});
