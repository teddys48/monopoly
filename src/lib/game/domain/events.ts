export type EconomicEventCategory = 'INFLATION' | 'SUBSIDY' | 'MARKET_BOOM' | 'POLICY' | 'CRISIS';

export interface EconomicEvent {
  id: string;
  title: string;
  category: EconomicEventCategory;
  description: string;
  impactHeadline: string;
}
