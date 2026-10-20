import { describe, it, expect } from 'vitest';
import { validateGameConfig } from '../../src/lib/game/rules/validation';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('validateGameConfig', () => {
  const validBotConfig: GameConfig = {
    mode: 'BOT',
    playerCount: 2,
    startingBalance: 10_000_000,
    players: [
      { name: 'Pemain 1', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
      { name: 'Pak Budi (Bot)', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
    ]
  };

  it('approves a valid BOT game configuration', () => {
    const result = validateGameConfig(validBotConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('approves a valid LOCAL_MULTIPLAYER configuration with 3 human players', () => {
    const config: GameConfig = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 3,
      startingBalance: 10_000_000,
      players: [
        { name: 'Andi', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Bambang', controller: 'HUMAN', color: '#10B981', tokenIcon: 'User' },
        { name: 'Citra', controller: 'HUMAN', color: '#F59E0B', tokenIcon: 'User' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(true);
  });

  it('rejects unsupported ONLINE_MULTIPLAYER mode', () => {
    const config = {
      ...validBotConfig,
      mode: 'ONLINE_MULTIPLAYER' as const
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('belum didukung'))).toBe(true);
  });

  it('rejects player count below minimum (< 2)', () => {
    const config: GameConfig = {
      mode: 'BOT',
      playerCount: 1,
      startingBalance: 10_000_000,
      players: [{ name: 'Solo', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' }]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('antara 2 dan 4'))).toBe(true);
  });

  it('rejects player count above maximum (> 4)', () => {
    const config = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 5,
      startingBalance: 10_000_000,
      players: [
        { name: 'P1', controller: 'HUMAN', color: '#1', tokenIcon: 'User' },
        { name: 'P2', controller: 'HUMAN', color: '#2', tokenIcon: 'User' },
        { name: 'P3', controller: 'HUMAN', color: '#3', tokenIcon: 'User' },
        { name: 'P4', controller: 'HUMAN', color: '#4', tokenIcon: 'User' },
        { name: 'P5', controller: 'HUMAN', color: '#5', tokenIcon: 'User' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('antara 2 dan 4'))).toBe(true);
  });

  it('rejects duplicate player names', () => {
    const config: GameConfig = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'teddy', controller: 'HUMAN', color: '#10B981', tokenIcon: 'User' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('terduplikasi'))).toBe(true);
  });

  it('rejects duplicate player colors', () => {
    const config: GameConfig = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Asep', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Warna pion'))).toBe(true);
  });

  it('rejects BOT mode if no AI player is configured', () => {
    const config: GameConfig = {
      mode: 'BOT',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Budi', controller: 'HUMAN', color: '#10B981', tokenIcon: 'User' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('minimal satu pemain bot AI'))).toBe(true);
  });

  it('rejects empty or whitespace-only player names', () => {
    const config: GameConfig = {
      mode: 'BOT',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: '   ', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Pak Budi', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
      ]
    };
    const result = validateGameConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('tidak boleh kosong'))).toBe(true);
  });
});
