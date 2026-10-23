import type { EmploymentState } from './economy';

export type PlayerController = 'HUMAN' | 'AI';

export interface Player {
  id: string;
  name: string;
  controller: PlayerController;
  color: string;
  tokenIcon: string;
  balance: number;
  position: number;
  netWorth: number;
  isActive: boolean;
  employment?: EmploymentState;
  unpaidObligations?: number;
}
