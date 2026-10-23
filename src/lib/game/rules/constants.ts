export const GAME_CONSTANTS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  DEFAULT_PLAYER_COUNT: 2,
  DEFAULT_STARTING_BALANCE: 10_000_000,
  SALARY_PER_LAP: 2_000_000,
  BONUS_ROLL_TOTAL: 12,
  BOARD_TILE_COUNT: 16,
  SUPPORTED_GAME_MODES: ['BOT', 'LOCAL_MULTIPLAYER'] as const,
  UNSUPPORTED_GAME_MODES: ['ONLINE_MULTIPLAYER'] as const,
  RESALE_RATE_PERCENT: 80,
  BOT_MIN_CASH_RESERVE: 1_000_000,
  TAX_EXPENSE_AMOUNT: 500_000,
  ASSET_VALUATION_POLICY: 'ACQUISITION_COST' as const
} as const;

export const ECONOMIC_CONSTANTS = {
  DEFAULT_MONTHLY_SALARY: 4_000_000,
  DEFAULT_FREELANCE_INCOME: 3_800_000,
  DEFAULT_BUSINESS_INCOME: 5_000_000,
  DEFAULT_LIVING_EXPENSES: {
    housing: 1_200_000,
    food: 1_000_000,
    transport: 400_000,
    utilities: 400_000
  },
  DEFAULT_TAX_RATE_PERCENT: 5,
  BASE_INFLATION_INDEX: 1.0,
  DEFAULT_MONTHLY_INFLATION_RATE: 0.005,
  MAX_LOAN_AMOUNT: 5_000_000,
  DEFAULT_LOAN_INTEREST_RATE_PERCENT: 3,
  DEFAULT_LOAN_TERM_MONTHS: 5,
  MONTHS_PER_GAME_YEAR: 12,
  THR_BONUS_MULTIPLIER: 1.0
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
