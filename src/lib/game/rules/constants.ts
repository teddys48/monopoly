export const GAME_CONSTANTS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  DEFAULT_PLAYER_COUNT: 2,
  DEFAULT_STARTING_BALANCE: 10_000_000,
  SALARY_PER_LAP: 2_000_000,
  BONUS_ROLL_TOTAL: 12,
  BOARD_TILE_COUNT: 16,
  SUPPORTED_GAME_MODES: ['BOT', 'LOCAL_MULTIPLAYER'] as const,
  UNSUPPORTED_GAME_MODES: ['ONLINE_MULTIPLAYER'] as const
} as const;

export const PLAYER_COLORS = [
  { id: 'red', name: 'Merah Putih', hex: '#EF4444', border: '#B91C1C', text: '#FFFFFF' },
  { id: 'emerald', name: 'Hijau Zamrud', hex: '#10B981', border: '#047857', text: '#FFFFFF' },
  { id: 'amber', name: 'Kuning Emas', hex: '#F59E0B', border: '#B45309', text: '#000000' },
  { id: 'blue', name: 'Biru Bahari', hex: '#3B82F6', border: '#1D4ED8', text: '#FFFFFF' }
] as const;

export const DEFAULT_BOT_NAMES = [
  'Pak Budi (Bot)',
  'Bu Sri (Bot)',
  'Kang Asep (Bot)',
  'Mbak Dewi (Bot)'
] as const;
