export type EconomicEventCategory = 'INFLATION' | 'SUBSIDY' | 'MARKET_BOOM' | 'POLICY' | 'CRISIS';

export type EconomicEventEffect =
  | { type: 'EXPENSE_MODIFIER'; category: 'food' | 'transport' | 'housing' | 'utilities' | 'all'; multiplier: number }
  | { type: 'ONE_OFF_EXPENSE'; amount: number; reason: string }
  | { type: 'ONE_OFF_INCOME'; amount: number; reason: string }
  | { type: 'INFLATION_RATE_MODIFIER'; rateDelta: number }
  | { type: 'CONDITION_CHANGE'; condition: 'STABLE' | 'BOOM' | 'RECESSION' | 'RECOVERY'; rateDelta?: number }
  | { type: 'PHK'; targetPlayerId?: string }
  | { type: 'RE_EMPLOYMENT'; targetPlayerId?: string; salary?: number };

export interface EconomicEvent {
  id: string;
  title: string;
  category: EconomicEventCategory;
  description: string;
  impactHeadline: string;
  durationMonths?: number;
  isPermanent?: boolean;
  effect?: EconomicEventEffect;
  affects?: 'ALL' | 'ACTIVE_PLAYER' | 'SALARIED' | 'UNEMPLOYED' | 'BUSINESS';
}

export interface ActiveEconomicEvent {
  eventId: string;
  title: string;
  description: string;
  impactHeadline: string;
  startedMonth: number;
  durationMonths: number;
  remainingMonths: number;
  effect: EconomicEventEffect;
  targetPlayerId?: string;
}
