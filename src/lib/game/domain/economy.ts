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
  | 'TAX_EXPENSE'
  | 'MONTHLY_SALARY'
  | 'MONTHLY_LIVING_EXPENSE'
  | 'MONTHLY_ASSET_EXPENSE'
  | 'MONTHLY_TAX'
  | 'THR_BONUS'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'LOAN_INTEREST'
  | 'ECONOMIC_EVENT'
  | 'UNPAID_OBLIGATION_SETTLED';

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

export type EmploymentType = 'KARYAWAN' | 'FREELANCER' | 'WIRAUSAHA' | 'TIDAK_BEKERJA';

export type EmploymentStatus = 'EMPLOYED' | 'UNEMPLOYED';

export interface EmploymentState {
  type: EmploymentType;
  status: EmploymentStatus;
  monthlySalary: number;
  baseSalary: number;
  jobTitle: string;
  salaryAdjustment?: number;
}

export interface LivingExpenseConfig {
  housing: number;
  food: number;
  transport: number;
  utilities: number;
  other?: number;
}

export interface Loan {
  id: string;
  playerId: string;
  principal: number;
  initialPrincipal: number;
  interestRatePercent: number;
  termMonths: number;
  remainingMonths: number;
  monthlyPayment: number;
  status: 'ACTIVE' | 'PAID_OFF';
  createdAtMonth: number;
}

export type EconomicCondition = 'STABLE' | 'BOOM' | 'RECESSION' | 'RECOVERY';

export interface EconomicIndicators {
  currentMonth: number;
  inflationIndex: number;
  currentInflationRate: number;
  condition: EconomicCondition;
}

export interface PlayerMonthlySettlement {
  playerId: string;
  playerName: string;
  startingBalance: number;
  income: {
    salary: number;
    bonus: number;
    assetIncome: number;
    other: number;
    total: number;
  };
  expenses: {
    living: number;
    assetMaintenance: number;
    total: number;
  };
  loanInterestPaid: number;
  loanPrincipalPaid: number;
  taxAssessed: number;
  taxPaid: number;
  unpaidAdded: number;
  endingBalance: number;
  endingNetWorth: number;
}

export interface MonthlySettlement {
  id: string;
  month: number;
  round: number;
  timestamp: number;
  playerSettlements: PlayerMonthlySettlement[];
  indicators: EconomicIndicators;
  eventsApplied: string[];
}
