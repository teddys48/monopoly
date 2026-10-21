import { describe, it, expect } from 'vitest';
import {
  rollDice,
  startMovement,
  finishMovement,
  resolveTurnTile,
  endTurn,
  executeFullTurn
} from '../../src/lib/game/engine/game-engine';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Game Engine State Machine & Core Loop', () => {
  const sampleConfig: GameConfig = {
    mode: 'LOCAL_MULTIPLAYER',
    playerCount: 2,
    startingBalance: 10_000_000,
    players: [
      { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
      { name: 'Andi', controller: 'HUMAN', color: '#10B981', tokenIcon: 'User' }
    ]
  };

  it('progresses through all turn phases successfully with deterministic actions', () => {
    const initialState = createGameState(sampleConfig);
    expect(initialState.phase).toBe('WAITING_ROLL');
    expect(initialState.activePlayerIndex).toBe(0);

    // 1. Roll Dice (Teddy rolls 3 + 4 = 7)
    const { state: rolledState, dice, movement } = rollDice(initialState, { dice: [3, 4] });
    expect(rolledState.phase).toBe('ROLLING');
    expect(dice).toEqual([3, 4]);
    expect(movement.steps).toBe(7);
    expect(movement.destinationIndex).toBe(7);
    // Player authoritative position is NOT changed yet!
    expect(rolledState.players[0].position).toBe(0);

    // 2. Start Movement
    const movingState = startMovement(rolledState);
    expect(movingState.phase).toBe('MOVING');

    // 3. Finish Movement
    const finishedState = finishMovement(movingState);
    expect(finishedState.phase).toBe('RESOLVING_TILE');
    expect(finishedState.players[0].position).toBe(7);
    expect(finishedState.selectedTileIndex).toBe(7);

    // 4. Resolve Tile
    const { state: resolvedState, resolution } = resolveTurnTile(finishedState);
    expect(resolvedState.phase).toBe('TURN_COMPLETE');
    expect(resolution.tileIndex).toBe(7);
    expect(resolution.tileName).toBe('Sentra Kerajinan Nusantara');

    // 5. End Turn
    const nextState = endTurn(resolvedState);
    expect(nextState.phase).toBe('READY');
    expect(nextState.activePlayerIndex).toBe(1); // Switched to Andi!
    expect(nextState.currentTurn).toBeNull();
  });

  it('rejects invalid actions when in the wrong phase without mutating original state', () => {
    const initialState = createGameState(sampleConfig);

    // Cannot start movement before rolling
    expect(() => startMovement(initialState)).toThrow(/Tidak dapat memulai pergerakan/);
    expect(initialState.phase).toBe('WAITING_ROLL');

    // Cannot finish movement before starting movement
    expect(() => finishMovement(initialState)).toThrow(/Tidak dapat menyelesaikan pergerakan/);

    // Cannot end turn before resolving tile
    expect(() => endTurn(initialState)).toThrow(/Tidak dapat mengakhiri giliran/);

    // Roll dice once
    const { state: rolledState } = rollDice(initialState, { dice: [2, 2] });

    // Cannot roll dice again while already in ROLLING phase!
    expect(() => rollDice(rolledState, { dice: [1, 1] })).toThrow(/Tidak dapat melempar dadu/);
    expect(rolledState.phase).toBe('ROLLING');
  });

  it('correctly awards lap salary when moving across the start tile', () => {
    const state = createGameState(sampleConfig);
    // Position Teddy at tile 14 (Pelabuhan Petikemas)
    state.players[0].position = 14;
    const initialBalance = state.players[0].balance;

    // Roll 3 (14 -> 15 -> 0 -> 1) => crosses tile 0
    const { state: rolled } = rollDice(state, { dice: [1, 2] });
    const moving = startMovement(rolled);
    const finished = finishMovement(moving);

    expect(finished.players[0].position).toBe(1);
    expect(finished.players[0].balance).toBe(initialBalance + 2_000_000);
  });

  it('keeps the same player when the dice total is 12', () => {
    let state = createGameState(sampleConfig);

    state = executeFullTurn(state, { dice: [6, 6] });

    expect(state.phase).toBe('READY');
    expect(state.activePlayerIndex).toBe(0);
    expect(state.currentRound).toBe(1);
    expect(state.currentTurn).toBeNull();
    expect(state.statusLog[0].message).toMatch(/melempar dadu lagi/);
  });

  it('cycles through multiple players and increments currentRound on wraparound', () => {
    let state = createGameState(sampleConfig);
    expect(state.currentRound).toBe(1);
    expect(state.activePlayerIndex).toBe(0);

    // Player 0 (Teddy) completes turn
    state = executeFullTurn(state, { dice: [1, 1] });
    expect(state.activePlayerIndex).toBe(1);
    expect(state.currentRound).toBe(1);

    // Player 1 (Andi) completes turn -> wraps around to Teddy
    state = executeFullTurn(state, { dice: [2, 1] });
    expect(state.activePlayerIndex).toBe(0);
    expect(state.currentRound).toBe(2); // Round incremented!
  });
});
