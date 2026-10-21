export type AssetCategory =
  | 'RESIDENSIAL'
  | 'KOMERSIAL'
  | 'LOGISTIK'
  | 'KREATIF'
  | 'FINANSIAL'
  | 'INDUSTRI'
  | 'KORPORASI';

export interface ResalePolicy {
  type: 'PERCENTAGE';
  percentage: number;
}

export interface AssetDefinition {
  id: string;
  tileId: string;
  tileIndex: number;
  name: string;
  shortName: string;
  category: AssetCategory;
  description: string;
  flavorText?: string;
  cost: number;
  baseRent: number;
  resalePolicy: ResalePolicy;
  icon: string;
  colorBadge: string;
}

export interface AssetOwnership {
  id: string;
  assetId: string;
  ownerPlayerId: string;
  purchasePrice: number;
  acquiredRound: number;
  acquiredAt: number;
}

export type TransactionType =
  | 'PURCHASE_ASSET'
  | 'SELL_ASSET'
  | 'RENT_INCOME'
  | 'RENT_EXPENSE'
  | 'SALARY'
  | 'TAX_EXPENSE';

export interface Transaction {
  id: string;
  round: number;
  playerId: string;
  type: TransactionType;
  assetId?: string;
  amount: number;
  previousBalance: number;
  resultingBalance: number;
  description: string;
  timestamp: number;
}

export type AssetValuationPolicy = 'ACQUISITION_COST' | 'RESALE_VALUE';
