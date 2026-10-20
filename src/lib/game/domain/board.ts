export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'TRANSIT'
  | 'FINANCIAL'
  | 'TAX'
  | 'EVENT'
  | 'REST';

export interface BoardTile {
  id: string;
  index: number;
  name: string;
  shortName: string;
  type: TileType;
  group?: string;
  description: string;
  flavorText?: string;
  baseCost?: number;
  baseRent?: number;
  colorBadge: string;
  icon: string;
}
