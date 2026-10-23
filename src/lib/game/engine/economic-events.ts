import type { GameState } from '../domain/game-state';
import type { EconomicEvent, ActiveEconomicEvent } from '../domain/events';
import type { Rng } from './rng';
import { cloneGameState } from './clone-state';
import { formatRupiah } from '../../utils/currency';
import { calculatePlayerNetWorth } from './economy';

export const ECONOMIC_EVENT_DEFINITIONS: readonly EconomicEvent[] = [
  {
    id: 'evt-sembako-naik',
    title: 'Kenaikan Harga Kebutuhan Pokok',
    category: 'INFLATION',
    description: 'Lonjakan harga beras dan minyak goreng akibat hambatan rantai pasok pangan.',
    impactHeadline: 'Pengeluaran belanja makan naik 25% selama 3 bulan.',
    durationMonths: 3,
    affects: 'ALL',
    effect: { type: 'EXPENSE_MODIFIER', category: 'food', multiplier: 1.25 }
  },
  {
    id: 'evt-kesehatan-mendadak',
    title: 'Biaya Pengobatan Darurat',
    category: 'CRISIS',
    description: 'Pemeriksaan medis darurat keluarga tanpa perlindungan asuransi penuh.',
    impactHeadline: 'Beban pengeluaran mendadak sebesar Rp 600.000.',
    durationMonths: 0,
    affects: 'ACTIVE_PLAYER',
    effect: { type: 'ONE_OFF_EXPENSE', amount: 600_000, reason: 'Biaya Medis Darurat' }
  },
  {
    id: 'evt-bonus-proyek',
    title: 'Bonus Insentif Kinerja',
    category: 'SUBSIDY',
    description: 'Pencapaian target operasional membuahkan apresiasi insentif tunai.',
    impactHeadline: 'Tambahan insentif tunai sebesar Rp 1.000.000 cair.',
    durationMonths: 0,
    affects: 'ACTIVE_PLAYER',
    effect: { type: 'ONE_OFF_INCOME', amount: 1_000_000, reason: 'Insentif Kinerja Usaha' }
  },
  {
    id: 'evt-transportasi-naik',
    title: 'Kenaikan Tarif BBM & Angkutan',
    category: 'INFLATION',
    description: 'Penyesuaian tarif bahan bakar minyak dan tiket angkutan umum antarwilayah.',
    impactHeadline: 'Biaya transportasi bulanan naik 25% selama 2 bulan.',
    durationMonths: 2,
    affects: 'ALL',
    effect: { type: 'EXPENSE_MODIFIER', category: 'transport', multiplier: 1.25 }
  },
  {
    id: 'evt-perlambatan-ekonomi',
    title: 'Perlambatan Ekonomi Global',
    category: 'CRISIS',
    description: 'Ketidakpastian ekonomi global mendorong lonjakan inflasi dan pengetatan likuiditas.',
    impactHeadline: 'Laju inflasi bulanan naik +0.5% dan kondisi pasar memasuki resesi.',
    durationMonths: 3,
    affects: 'ALL',
    effect: { type: 'CONDITION_CHANGE', condition: 'RECESSION', rateDelta: 0.005 }
  },
  {
    id: 'evt-pemulihan-ekonomi',
    title: 'Pemulihan Ekonomi Nasional',
    category: 'MARKET_BOOM',
    description: 'Stimulus fiskal pemerintah dan penurunan suku bunga memicu kebangkitan daya beli.',
    impactHeadline: 'Kondisi pasar membaik, inflasi terkendali.',
    durationMonths: 3,
    affects: 'ALL',
    effect: { type: 'CONDITION_CHANGE', condition: 'RECOVERY', rateDelta: -0.003 }
  },
  {
    id: 'evt-phk',
    title: 'Efisiensi Perusahaan (PHK)',
    category: 'CRISIS',
    description: 'Restrukturisasi mendadak di tempat kerja mengakibatkan pemutusan hubungan kerja.',
    impactHeadline: 'Status kerja menjadi Pengangguran (gaji bulanan terhenti).',
    durationMonths: 3,
    affects: 'SALARIED',
    effect: { type: 'PHK' }
  },
  {
    id: 'evt-diterima-kerja',
    title: 'Peluang Karier Baru',
    category: 'POLICY',
    description: 'Setelah proses wawancara, Anda resmi diterima kembali bekerja.',
    impactHeadline: 'Status kerja kembali aktif sebagai Karyawan dengan gaji penuh!',
    durationMonths: 0,
    affects: 'UNEMPLOYED',
    effect: { type: 'RE_EMPLOYMENT' }
  }
];

export function getAllEconomicEventDefinitions(): EconomicEvent[] {
  return ECONOMIC_EVENT_DEFINITIONS.map((e) => ({ ...e }));
}

export function getEconomicEventById(id: string): EconomicEvent | undefined {
  return ECONOMIC_EVENT_DEFINITIONS.find((e) => e.id === id);
}

/**
 * Checks if a player is eligible for a specific event.
 */
export function isPlayerEligibleForEvent(event: EconomicEvent, state: GameState, playerId: string): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isActive === false) return false;

  switch (event.affects) {
    case 'SALARIED':
      return player.employment?.type === 'KARYAWAN' && player.employment?.status === 'EMPLOYED';
    case 'UNEMPLOYED':
      return player.employment?.status === 'UNEMPLOYED';
    case 'BUSINESS':
      return player.employment?.type === 'WIRAUSAHA';
    case 'ACTIVE_PLAYER':
    case 'ALL':
    default:
      return true;
  }
}

/**
 * Calculates current expense multiplier for a given category based on active events.
 */
export function getActiveExpenseMultiplier(
  state: GameState,
  category: 'food' | 'transport' | 'housing' | 'utilities'
): number {
  let multiplier = 1.0;
  for (const active of state.activeEvents ?? []) {
    if (active.effect.type === 'EXPENSE_MODIFIER') {
      if (active.effect.category === category || active.effect.category === 'all') {
        multiplier *= active.effect.multiplier;
      }
    }
  }
  return multiplier;
}

/**
 * Applies an economic event to the game state.
 */
export function triggerEconomicEvent(
  currentState: GameState,
  eventId: string,
  targetPlayerId?: string
): GameState {
  const eventDef = getEconomicEventById(eventId);
  if (!eventDef) {
    throw new Error(`Peristiwa ekonomi dengan ID '${eventId}' tidak ditemukan.`);
  }

  const nextState = cloneGameState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];
  const targetId = targetPlayerId ?? activePlayer?.id;
  const targetPlayer = nextState.players.find((p) => p.id === targetId);

  // If already active with duration, don't duplicate
  if (eventDef.durationMonths && eventDef.durationMonths > 0) {
    const existing = nextState.activeEvents.find((e) => e.eventId === eventId);
    if (existing) {
      existing.remainingMonths = eventDef.durationMonths; // refresh duration
      return nextState;
    }
  }

  if (eventDef.effect) {
    switch (eventDef.effect.type) {
      case 'ONE_OFF_EXPENSE': {
        if (targetPlayer) {
          const expense = eventDef.effect.amount;
          const prevBalance = targetPlayer.balance;
          const payable = Math.min(targetPlayer.balance, expense);
          const unpaid = expense - payable;

          targetPlayer.balance -= payable;
          if (unpaid > 0) {
            targetPlayer.unpaidObligations = (targetPlayer.unpaidObligations ?? 0) + unpaid;
          }
          targetPlayer.netWorth = calculatePlayerNetWorth(targetPlayer, nextState.ownerships, nextState.loans);

          nextState.transactions.unshift({
            id: `tx-evt-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            round: nextState.currentRound,
            playerId: targetPlayer.id,
            type: 'ECONOMIC_EVENT',
            amount: payable,
            previousBalance: prevBalance,
            resultingBalance: targetPlayer.balance,
            description: `${targetPlayer.name}: ${eventDef.title} (-${formatRupiah(payable)}${unpaid > 0 ? `, kurang ${formatRupiah(unpaid)}` : ''}).`,
            timestamp: Date.now()
          });
        }
        break;
      }

      case 'ONE_OFF_INCOME': {
        if (targetPlayer) {
          const income = eventDef.effect.amount;
          const prevBalance = targetPlayer.balance;
          targetPlayer.balance += income;
          targetPlayer.netWorth = calculatePlayerNetWorth(targetPlayer, nextState.ownerships, nextState.loans);

          nextState.transactions.unshift({
            id: `tx-evt-inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            round: nextState.currentRound,
            playerId: targetPlayer.id,
            type: 'ECONOMIC_EVENT',
            amount: income,
            previousBalance: prevBalance,
            resultingBalance: targetPlayer.balance,
            description: `${targetPlayer.name}: ${eventDef.title} (+${formatRupiah(income)}).`,
            timestamp: Date.now()
          });
        }
        break;
      }

      case 'PHK': {
        if (targetPlayer && targetPlayer.employment) {
          targetPlayer.employment.status = 'UNEMPLOYED';
          targetPlayer.employment.jobTitle = 'Pencari Kerja (Eks Karyawan)';
        }
        break;
      }

      case 'RE_EMPLOYMENT': {
        if (targetPlayer && targetPlayer.employment) {
          targetPlayer.employment.status = 'EMPLOYED';
          targetPlayer.employment.jobTitle = 'Karyawan Swasta';
        }
        break;
      }

      case 'CONDITION_CHANGE': {
        nextState.indicators.condition = eventDef.effect.condition;
        if (eventDef.effect.rateDelta) {
          nextState.indicators.currentInflationRate = Math.max(
            0,
            Number((nextState.indicators.currentInflationRate + eventDef.effect.rateDelta).toFixed(4))
          );
        }
        break;
      }

      case 'INFLATION_RATE_MODIFIER': {
        nextState.indicators.currentInflationRate = Math.max(
          0,
          Number((nextState.indicators.currentInflationRate + eventDef.effect.rateDelta).toFixed(4))
        );
        break;
      }

      case 'EXPENSE_MODIFIER':
        // Evaluated continuously via getActiveExpenseMultiplier
        break;
    }
  }

  // Register in active events if it has lasting duration
  if (eventDef.durationMonths && eventDef.durationMonths > 0 && eventDef.effect) {
    const activeEvt: ActiveEconomicEvent = {
      eventId: eventDef.id,
      title: eventDef.title,
      description: eventDef.description,
      impactHeadline: eventDef.impactHeadline,
      startedMonth: nextState.currentMonth,
      durationMonths: eventDef.durationMonths,
      remainingMonths: eventDef.durationMonths,
      effect: eventDef.effect,
      targetPlayerId: targetId
    };
    nextState.activeEvents.push(activeEvt);
  }

  nextState.statusLog.unshift({
    id: `log-event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `[Peristiwa Ekonomi] ${eventDef.title}: ${eventDef.impactHeadline}`,
    type: eventDef.category === 'CRISIS' ? 'warning' : 'info'
  });

  return nextState;
}

/**
 * Ticks active economic events down by one month, removing expired ones.
 */
export function tickActiveEconomicEvents(currentState: GameState): GameState {
  const nextState = cloneGameState(currentState);
  const remainingList: ActiveEconomicEvent[] = [];

  for (const active of nextState.activeEvents) {
    active.remainingMonths -= 1;
    if (active.remainingMonths > 0) {
      remainingList.push(active);
    } else {
      nextState.statusLog.unshift({
        id: `log-evt-end-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        message: `Masa berlaku peristiwa '${active.title}' telah berakhir.`,
        type: 'info'
      });
    }
  }

  nextState.activeEvents = remainingList;
  return nextState;
}

/**
 * Selects an eligible random economic event reproducibly using the given RNG.
 */
export function selectRandomEconomicEvent(
  rng: Rng,
  state: GameState,
  targetPlayerId?: string
): EconomicEvent | undefined {
  const eligibleEvents = ECONOMIC_EVENT_DEFINITIONS.filter((e) => {
    // If already active, skip
    if (state.activeEvents.some((active) => active.eventId === e.id)) {
      return false;
    }
    if (targetPlayerId) {
      return isPlayerEligibleForEvent(e, state, targetPlayerId);
    }
    return true;
  });

  if (eligibleEvents.length === 0) return undefined;
  const index = rng.nextInt(0, eligibleEvents.length - 1);
  return eligibleEvents[index];
}
