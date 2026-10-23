<script lang="ts">
    import type { GameState } from '../../game/domain/game-state';
  import { gameSession } from '../../stores/game.svelte';
  import { formatRupiah, formatShortRupiah } from '../../utils/currency';
  import {
    calculatePlayerAssetValuation,
    calculatePlayerTotalDebt,
    calculatePlayerNetWorth
  } from '../../game/engine/economy';
  import { calculateLivingExpensesBreakdown } from '../../game/engine/monthly-settlement';
  import { canApplyLoan } from '../../game/engine/loans';
  import { ECONOMIC_CONSTANTS } from '../../game/rules/constants';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import {
    X,
    Wallet,
    TrendingUp,
    Landmark,
    Briefcase,
    AlertTriangle,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Coins,
    Percent,
    Receipt,
    FileText,
    Activity
  } from 'lucide-svelte';

  interface Props {
    gameState: GameState;
    onclose: () => void;
  }

  let { gameState, onclose }: Props = $props();

  let selectedTab = $state<'OVERVIEW' | 'CASHFLOW' | 'LOANS' | 'EMPLOYMENT' | 'MACRO'>('OVERVIEW');
  let customPlayerId = $state<string | null>(null);
  const selectedPlayerId = $derived(
    customPlayerId ?? gameState.players[gameState.activePlayerIndex]?.id ?? gameState.players[0]?.id ?? ''
  );

  // Form states for loan and obligation repayment
  let loanAmountInput = $state<number>(1_000_000);
  let resolveObligationAmount = $state<number>(0);
  let feedbackMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedPlayer = $derived(
    gameState.players.find((p) => p.id === selectedPlayerId) ?? gameState.players[0]
  );

  const valuation = $derived(
    calculatePlayerAssetValuation(selectedPlayer.id, gameState.ownerships)
  );

  const totalDebt = $derived(
    calculatePlayerTotalDebt(selectedPlayer.id, gameState.loans)
  );

  const unpaidObligations = $derived(
    selectedPlayer.unpaidObligations ?? 0
  );

  const netWorth = $derived(
    calculatePlayerNetWorth(selectedPlayer, gameState.ownerships, gameState.loans)
  );

  const playerLoans = $derived(
    gameState.loans.filter((l) => l.playerId === selectedPlayer.id)
  );

  const activeLoans = $derived(
    playerLoans.filter((l) => l.status === 'ACTIVE')
  );

  const livingBreakdown = $derived(
    calculateLivingExpensesBreakdown(gameState)
  );

  // Cash flow estimations
  const monthlySalary = $derived(
    selectedPlayer.employment?.status === 'EMPLOYED'
      ? (selectedPlayer.employment.monthlySalary ?? 0)
      : 0
  );

  const monthlyLiving = $derived(livingBreakdown.total);

  const monthlyInterest = $derived(
    activeLoans.reduce(
      (sum, l) => sum + Math.floor((l.principal * l.interestRatePercent) / 100),
      0
    )
  );

  const estimatedTax = $derived(
    Math.floor((monthlySalary * ECONOMIC_CONSTANTS.DEFAULT_TAX_RATE_PERCENT) / 100)
  );

  const netCashFlow = $derived(
    monthlySalary - monthlyLiving - monthlyInterest - estimatedTax
  );

  const loanCheck = $derived(
    canApplyLoan(gameState, selectedPlayer.id, loanAmountInput)
  );

  const nextThrMonth = $derived.by(() => {
    const cur = gameState.currentMonth;
    const yearLength = ECONOMIC_CONSTANTS.MONTHS_PER_GAME_YEAR;
    const nextMonth = Math.ceil(cur / yearLength) * yearLength;
    return nextMonth === cur ? cur : nextMonth;
  });

  const monthsUntilThr = $derived(
    Math.max(0, nextThrMonth - gameState.currentMonth)
  );

  function handleApplyLoan() {
    feedbackMessage = null;
    if (!loanCheck.allowed) {
      feedbackMessage = { text: loanCheck.reason ?? 'Gagal mengajukan pinjaman', type: 'error' };
      return;
    }

    try {
      gameSession.dispatch({
        type: 'APPLY_LOAN',
        payload: { amount: loanAmountInput, playerId: selectedPlayer.id }
      });
      feedbackMessage = {
        text: `Pengajuan pinjaman ${formatRupiah(loanAmountInput)} berhasil dicairkan!`,
        type: 'success'
      };
      loanAmountInput = 1_000_000;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      feedbackMessage = { text: msg, type: 'error' };
    }
  }

  function handleRepayLoan(loanId: string, amount: number) {
    feedbackMessage = null;
    if (amount <= 0) return;

    try {
      gameSession.dispatch({
        type: 'REPAY_LOAN',
        payload: { loanId, amount, playerId: selectedPlayer.id }
      });
      feedbackMessage = {
        text: `Berhasil membayar angsuran pokok pinjaman ${formatRupiah(amount)}!`,
        type: 'success'
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melunasi pinjaman.';
      feedbackMessage = { text: msg, type: 'error' };
    }
  }

  function handleResolveObligations() {
    feedbackMessage = null;
    if (resolveObligationAmount <= 0) return;

    try {
      gameSession.dispatch({
        type: 'RESOLVE_OBLIGATIONS',
        payload: { amount: resolveObligationAmount, playerId: selectedPlayer.id }
      });
      feedbackMessage = {
        text: `Tunggakan kewajiban sebesar ${formatRupiah(resolveObligationAmount)} berhasil dilunasi!`,
        type: 'success'
      };
      resolveObligationAmount = 0;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melunasi kewajiban.';
      feedbackMessage = { text: msg, type: 'error' };
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm select-none"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dashboard-title"
>
  <div
    class="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border-4 border-black bg-[#f6f5f0] shadow-[8px_8px_0px_0px_#000] dark:bg-[#16181f] text-black dark:text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150"
  >
    <!-- Modal Header -->
    <div
      class="flex items-center justify-between border-b-3 border-black bg-[#fef08a] px-4 py-3 dark:bg-[#854d0e]/60 shrink-0"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] dark:bg-[#20242e]"
        >
          <Activity size={18} class="stroke-[2.5] text-black dark:text-white" />
        </div>
        <div>
          <h2 id="dashboard-title" class="text-sm sm:text-base font-black tracking-tight text-black dark:text-white leading-tight">
            Dashboard Ekonomi & Finansial WNI
          </h2>
          <p class="text-[10px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Siklus Bulan #{gameState.currentMonth} &bull; Inflasi: {(gameState.indicators.inflationIndex * 100).toFixed(1)}% ({gameState.indicators.condition})
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={onclose}
          class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white hover:bg-neutral-100 dark:bg-[#20242e] dark:hover:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          aria-label="Tutup"
        >
          <X size={16} class="stroke-[3]" />
        </button>
      </div>
    </div>

    <!-- Player Switcher Tabs -->
    <div
      class="flex items-center gap-1.5 border-b-2 border-black bg-white px-3 py-1.5 dark:bg-[#20242e] overflow-x-auto shrink-0"
    >
      <span class="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 mr-1 shrink-0">
        Pemain:
      </span>
      {#each gameState.players as p (p.id)}
        <button
          onclick={() => {
            customPlayerId = p.id;
            feedbackMessage = null;
          }}
          class="flex items-center gap-1.5 rounded-lg border-2 border-black px-2.5 py-1 text-xs font-black shadow-[1px_1px_0px_0px_#000] transition-colors shrink-0 cursor-pointer {selectedPlayerId === p.id
            ? 'bg-[#86efac] text-black dark:bg-[#059669] dark:text-white'
            : 'bg-[#f6f5f0] text-black dark:bg-[#2b303c] dark:text-neutral-300'}"
        >
          <span
            class="h-2.5 w-2.5 rounded-full border border-black"
            style="background-color: {p.color};"
          ></span>
          {p.name}
          {#if p.unpaidObligations && p.unpaidObligations > 0}
            <span class="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Ada tunggakan kewajiban!"></span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Navigation Sub-Tabs -->
    <div
      class="flex items-center gap-1 border-b-2 border-black bg-[#f6f5f0] px-3 py-1.5 dark:bg-[#16181f] overflow-x-auto shrink-0 text-xs font-bold"
    >
      <button
        onclick={() => (selectedTab = 'OVERVIEW')}
        class="rounded-lg border-2 border-black px-3 py-1 transition-colors cursor-pointer {selectedTab === 'OVERVIEW'
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
          : 'bg-white text-black dark:bg-[#20242e] dark:text-white'}"
      >
        Ringkasan Neraca
      </button>

      <button
        onclick={() => (selectedTab = 'CASHFLOW')}
        class="rounded-lg border-2 border-black px-3 py-1 transition-colors cursor-pointer {selectedTab === 'CASHFLOW'
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
          : 'bg-white text-black dark:bg-[#20242e] dark:text-white'}"
      >
        Arus Kas Bulanan
      </button>

      <button
        onclick={() => (selectedTab = 'LOANS')}
        class="rounded-lg border-2 border-black px-3 py-1 transition-colors cursor-pointer {selectedTab === 'LOANS'
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
          : 'bg-white text-black dark:bg-[#20242e] dark:text-white'}"
      >
        Pinjaman & Kredit ({activeLoans.length})
      </button>

      <button
        onclick={() => (selectedTab = 'EMPLOYMENT')}
        class="rounded-lg border-2 border-black px-3 py-1 transition-colors cursor-pointer {selectedTab === 'EMPLOYMENT'
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
          : 'bg-white text-black dark:bg-[#20242e] dark:text-white'}"
      >
        Pekerjaan & THR
      </button>

      <button
        onclick={() => (selectedTab = 'MACRO')}
        class="rounded-lg border-2 border-black px-3 py-1 transition-colors cursor-pointer {selectedTab === 'MACRO'
          ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
          : 'bg-white text-black dark:bg-[#20242e] dark:text-white'}"
      >
        Indikator Makro ({gameState.activeEvents.length})
      </button>
    </div>

    <!-- Feedback Banner -->
    {#if feedbackMessage}
      <div
        class="mx-4 mt-3 rounded-lg border-2 border-black p-2 text-xs font-bold shadow-[2px_2px_0px_0px_#000] flex items-center justify-between {feedbackMessage.type === 'success' ? 'bg-[#86efac] text-black' : 'bg-[#fecaca] text-black'}"
      >
        <span>{feedbackMessage.text}</span>
        <button onclick={() => (feedbackMessage = null)} class="font-black text-sm">&times;</button>
      </div>
    {/if}

    <!-- Unpaid Obligations Distress Alert -->
    {#if unpaidObligations > 0}
      <div
        class="mx-4 mt-3 rounded-xl border-3 border-black bg-[#fee2e2] p-3 text-xs dark:bg-[#7f1d1d]/50 shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle size={20} class="stroke-[2.5] text-red-600 shrink-0" />
          <div>
            <div class="font-black text-red-800 dark:text-red-200">
              Kewajiban Menunggak: {formatRupiah(unpaidObligations)}
            </div>
            <p class="text-[11px] text-neutral-700 dark:text-neutral-300">
              Saldo kas tidak mencukupi saat siklus settlement sebelumnya. Lunasi segera menggunakan kas atau likuidasi aset.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <input
            type="number"
            min="100000"
            max={Math.min(selectedPlayer.balance, unpaidObligations)}
            step="100000"
            bind:value={resolveObligationAmount}
            placeholder="Nominal"
            class="w-28 rounded-lg border-2 border-black bg-white px-2 py-1 text-xs font-bold text-black dark:bg-[#20242e] dark:text-white"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={selectedPlayer.balance < resolveObligationAmount || resolveObligationAmount <= 0}
            onclick={handleResolveObligations}
            class="bg-[#ef4444] text-white hover:bg-[#dc2626] font-black text-xs py-1"
          >
            Bayar Tunggakan
          </Button>
        </div>
      </div>
    {/if}

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {#if selectedTab === 'OVERVIEW'}
        <!-- 5-Pillar Financial Balance Card -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div
            class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400">
                Kas Tunai
              </span>
              <Wallet size={14} class="stroke-[2.5] text-[#10b981]" />
            </div>
            <div class="text-sm sm:text-base font-black text-black dark:text-white">
              {formatShortRupiah(selectedPlayer.balance)}
            </div>
            <div class="text-[9px] font-bold text-neutral-500">Likuid siap pakai</div>
          </div>

          <div
            class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400">
                Valuasi Aset
              </span>
              <Landmark size={14} class="stroke-[2.5] text-[#3b82f6]" />
            </div>
            <div class="text-sm sm:text-base font-black text-black dark:text-white">
              {formatShortRupiah(valuation)}
            </div>
            <div class="text-[9px] font-bold text-neutral-500">Nilai portofolio</div>
          </div>

          <div
            class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400">
                Pokok Hutang
              </span>
              <Receipt size={14} class="stroke-[2.5] text-[#f59e0b]" />
            </div>
            <div class="text-sm sm:text-base font-black text-[#b45309] dark:text-[#fbbf24]">
              {formatShortRupiah(totalDebt)}
            </div>
            <div class="text-[9px] font-bold text-neutral-500">{activeLoans.length} pinjaman aktif</div>
          </div>

          <div
            class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400">
                Tunggakan
              </span>
              <AlertTriangle size={14} class="stroke-[2.5] text-[#ef4444]" />
            </div>
            <div class="text-sm sm:text-base font-black {unpaidObligations > 0 ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300'}">
              {formatShortRupiah(unpaidObligations)}
            </div>
            <div class="text-[9px] font-bold text-neutral-500">Kewajiban tertunda</div>
          </div>

          <div
            class="col-span-2 sm:col-span-1 rounded-xl border-2 border-black bg-[#86efac] p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#059669]/60"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase text-black dark:text-white">
                Net Worth
              </span>
              <TrendingUp size={14} class="stroke-[2.5] text-black dark:text-white" />
            </div>
            <div class="text-sm sm:text-base font-black text-black dark:text-white">
              {formatShortRupiah(netWorth)}
            </div>
            <div class="text-[9px] font-bold text-neutral-700 dark:text-neutral-200">Kekayaan bersih</div>
          </div>
        </div>

        <!-- Quick Summary & Instructions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            class="rounded-xl border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-2"
          >
            <h3 class="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
              <Coins size={14} class="stroke-[2.5]" /> Rumus Neraca Finansial
            </h3>
            <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              <strong>Net Worth</strong> dihitung dari Kas Tunai ditambah Valuasi Aset, dikurangi Pokok Pinjaman dan Tunggakan Kewajiban:
            </p>
            <div class="rounded-lg border-2 border-black bg-[#f6f5f0] p-2 text-xs font-mono font-bold dark:bg-[#16181f]">
              {formatRupiah(selectedPlayer.balance)} + {formatRupiah(valuation)} - {formatRupiah(totalDebt)} - {formatRupiah(unpaidObligations)} = <span class="text-[#059669] dark:text-[#34d399] font-black">{formatRupiah(netWorth)}</span>
            </div>
          </div>

          <div
            class="rounded-xl border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-2"
          >
            <h3 class="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
              <Calendar size={14} class="stroke-[2.5]" /> Siklus Settlement Bulanan
            </h3>
            <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              Siklus ekonomi berjalan otomatis setiap kali seluruh pemain menyelesaikan putarannya (wrap-around). Pemain menerima gaji, membayar biaya hidup terinflasi, mencicil hutang, dan membayar pajak daerah.
            </p>
            <div class="flex items-center gap-2">
              <Badge variant="purple" class="text-[9px] font-black">
                Bulan Aktif: #{gameState.currentMonth}
              </Badge>
              <Badge variant="info" class="text-[9px] font-black">
                Settled Terakhir: Bulan #{gameState.lastSettledMonth}
              </Badge>
            </div>
          </div>
        </div>

      {:else if selectedTab === 'CASHFLOW'}
        <!-- Monthly Cash Flow Detailed Breakdown -->
        <div class="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-3">
          <div class="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 class="text-xs sm:text-sm font-black uppercase text-black dark:text-white flex items-center gap-1.5">
              <FileText size={15} class="stroke-[2.5]" /> Estimasi Arus Kas Bulanan (Monthly Cash Flow)
            </h3>
            <span class="text-[10px] font-bold text-neutral-500">
              Proyeksi Bulan #{gameState.currentMonth}
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <!-- Income Rows -->
            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight size={14} class="stroke-[3]" /> Gaji & Penghasilan Bulanan ({selectedPlayer.employment?.jobTitle ?? 'Karyawan'})
              </span>
              <span class="font-black text-emerald-700 dark:text-emerald-400">
                +{formatRupiah(monthlySalary)}
              </span>
            </div>

            <!-- Expense Rows -->
            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} class="stroke-[3]" /> Biaya Kos & Tempat Tinggal
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(livingBreakdown.housing)}
              </span>
            </div>

            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} class="stroke-[3]" /> Biaya Makan & Belanja Harian
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(livingBreakdown.food)}
              </span>
            </div>

            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} class="stroke-[3]" /> Biaya Transportasi & Mobilitas
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(livingBreakdown.transport)}
              </span>
            </div>

            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ArrowDownRight size={14} class="stroke-[3]" /> Utilitas, Listrik & Komunikasi
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(livingBreakdown.utilities)}
              </span>
            </div>

            <!-- Interest & Tax -->
            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Percent size={14} class="stroke-[2.5]" /> Beban Bunga Pinjaman Bank
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(monthlyInterest)}
              </span>
            </div>

            <div class="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700 font-bold">
              <span class="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Receipt size={14} class="stroke-[2.5]" /> Pajak Penghasilan Game ({ECONOMIC_CONSTANTS.DEFAULT_TAX_RATE_PERCENT}%)
              </span>
              <span class="text-neutral-800 dark:text-neutral-200">
                -{formatRupiah(estimatedTax)}
              </span>
            </div>

            <!-- Net Cash Flow Summary -->
            <div class="flex items-center justify-between pt-2 text-sm font-black border-t-2 border-black">
              <span>Arus Kas Bersih (Net Monthly Cash Flow)</span>
              <span class="{netCashFlow >= 0 ? 'text-[#059669] dark:text-[#34d399]' : 'text-red-600 dark:text-red-400'}">
                {netCashFlow >= 0 ? '+' : ''}{formatRupiah(netCashFlow)} / bulan
              </span>
            </div>
          </div>
        </div>

      {:else if selectedTab === 'LOANS'}
        <!-- Loan Management Tab -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Active Loans List -->
          <div class="rounded-xl border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-3">
            <div class="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 class="text-xs font-black uppercase text-black dark:text-white flex items-center gap-1.5">
                <Landmark size={14} class="stroke-[2.5]" /> Pinjaman Aktif ({activeLoans.length})
              </h3>
              <span class="text-[10px] font-bold text-neutral-500">
                Total Hutang: {formatRupiah(totalDebt)}
              </span>
            </div>

            {#if activeLoans.length > 0}
              <div class="space-y-2.5">
                {#each activeLoans as loan (loan.id)}
                  <div class="rounded-lg border-2 border-black bg-[#f6f5f0] p-2.5 text-xs dark:bg-[#16181f] space-y-1.5">
                    <div class="flex items-center justify-between font-black">
                      <span>Pokok: {formatRupiah(loan.principal)}</span>
                      <Badge variant="warning" class="text-[8px] px-1 py-0 font-black">
                        Bunga {loan.interestRatePercent}% / bln
                      </Badge>
                    </div>
                    <div class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      Angsuran: ~{formatRupiah(loan.monthlyPayment)} / bulan &bull; Sisa: {loan.remainingMonths} bulan
                    </div>
                    <!-- Repay Early Row -->
                    <div class="flex items-center gap-1 pt-1 border-t border-neutral-300 dark:border-neutral-700">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedPlayer.balance < loan.principal}
                        onclick={() => handleRepayLoan(loan.id, loan.principal)}
                        class="text-[10px] py-0.5 px-2 font-black"
                      >
                        Lunasi Sekarang ({formatRupiah(loan.principal)})
                      </Button>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="rounded-lg border-2 border-dashed border-neutral-300 p-4 text-center text-xs font-bold text-neutral-400 dark:border-neutral-700">
                Pemain tidak memiliki pinjaman aktif saat ini.
              </div>
            {/if}
          </div>

          <!-- Apply Loan Form -->
          <div class="rounded-xl border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-3">
            <div class="border-b-2 border-black pb-2">
              <h3 class="text-xs font-black uppercase text-black dark:text-white flex items-center gap-1.5">
                <Receipt size={14} class="stroke-[2.5]" /> Ajukan Pinjaman Modal Bank
              </h3>
              <p class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                Plafon maksimal per pemain: {formatRupiah(ECONOMIC_CONSTANTS.MAX_LOAN_AMOUNT)}
              </p>
            </div>

            <div class="space-y-2 text-xs">
              <div>
                <label for="loan-amount-input" class="block font-black text-neutral-700 dark:text-neutral-300 mb-1">
                  Nominal Pinjaman: {formatRupiah(loanAmountInput)}
                </label>
                <input
                  id="loan-amount-input"
                  type="range"
                  min="500000"
                  max={Math.max(500000, loanCheck.maxBorrowable)}
                  step="500000"
                  bind:value={loanAmountInput}
                  disabled={loanCheck.maxBorrowable <= 0}
                  class="w-full accent-black dark:accent-white cursor-pointer"
                />
                <div class="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>Rp 500 rb</span>
                  <span>Sisa Plafon: {formatRupiah(loanCheck.maxBorrowable)}</span>
                </div>
              </div>

              <div class="rounded-lg border-2 border-black bg-[#fef08a] p-2 dark:bg-[#78350f]/40 font-bold space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span>Suku Bunga Bulanan:</span>
                  <span>{loanCheck.interestRatePercent}%</span>
                </div>
                <div class="flex justify-between text-[11px]">
                  <span>Tenor Pelunasan:</span>
                  <span>{loanCheck.termMonths} Bulan</span>
                </div>
                <div class="flex justify-between text-[11px]">
                  <span>Estimasi Angsuran / Bln:</span>
                  <span>{formatRupiah(loanCheck.estimatedMonthlyPayment ?? 0)}</span>
                </div>
              </div>

              {#if !loanCheck.allowed}
                <div class="text-[11px] font-bold text-red-600">
                  {loanCheck.reason}
                </div>
              {/if}

              <Button
                variant="primary"
                size="md"
                disabled={!loanCheck.allowed}
                onclick={handleApplyLoan}
                class="w-full bg-[#86efac] text-black hover:bg-[#4ade80] font-black py-1.5 shadow-[2px_2px_0px_0px_#000]"
              >
                Cairkan Pinjaman {formatRupiah(loanAmountInput)}
              </Button>
            </div>
          </div>
        </div>

      {:else if selectedTab === 'EMPLOYMENT'}
        <!-- Employment & THR Card -->
        <div class="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-4">
          <div class="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 class="text-xs sm:text-sm font-black uppercase text-black dark:text-white flex items-center gap-1.5">
              <Briefcase size={16} class="stroke-[2.5]" /> Status Ketenagakerjaan & Hak THR
            </h3>
            <Badge
              variant={selectedPlayer.employment?.status === 'EMPLOYED' ? 'success' : 'danger'}
              class="text-xs uppercase font-black px-2 py-0.5"
            >
              {selectedPlayer.employment?.status === 'EMPLOYED' ? 'Bekerja Aktif' : 'Pengangguran'}
            </Badge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-lg border-2 border-black bg-[#f6f5f0] p-3 text-xs dark:bg-[#16181f]">
              <span class="text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">Profesi / Jabatan</span>
              <span class="font-black text-sm text-black dark:text-white">
                {selectedPlayer.employment?.jobTitle ?? 'Karyawan Swasta'}
              </span>
              <span class="text-[9px] font-bold text-neutral-400 block mt-1">
                Tipe: {selectedPlayer.employment?.type ?? 'KARYAWAN'}
              </span>
            </div>

            <div class="rounded-lg border-2 border-black bg-[#f6f5f0] p-3 text-xs dark:bg-[#16181f]">
              <span class="text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">Gaji Pokok Bulanan</span>
              <span class="font-black text-sm text-[#059669] dark:text-[#34d399]">
                {formatRupiah(monthlySalary)}
              </span>
              <span class="text-[9px] font-bold text-neutral-400 block mt-1">
                Dicairkan tiap settlement bulanan
              </span>
            </div>

            <div class="rounded-lg border-2 border-black bg-[#fef08a] p-3 text-xs dark:bg-[#78350f]/40">
              <span class="text-[10px] font-bold text-black dark:text-white uppercase block mb-0.5">Tunjangan Hari Raya (THR)</span>
              <span class="font-black text-sm text-black dark:text-white">
                {monthsUntilThr === 0 ? 'Cair Bulan Ini!' : `${monthsUntilThr} Bulan Lagi (Bulan #${nextThrMonth})`}
              </span>
              <span class="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 block mt-1">
                Hak: 1x Gaji Pokok ({formatRupiah(selectedPlayer.employment?.baseSalary ?? 4_000_000)})
              </span>
            </div>
          </div>

          {#if selectedPlayer.employment?.status === 'UNEMPLOYED'}
            <div class="rounded-lg border-2 border-black bg-[#fee2e2] p-3 text-xs font-bold text-red-900 dark:bg-[#7f1d1d]/60 dark:text-red-100 flex items-center justify-between">
              <div>
                Status PHK aktif. Gaji bulanan terhenti sementara waktu sampai mendapatkan pekerjaan baru melalui peristiwa ekonomi.
              </div>
            </div>
          {/if}
        </div>

      {:else if selectedTab === 'MACRO'}
        <!-- Macroeconomic Indicators & Active Events -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]">
              <span class="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">Bulan Permainan</span>
              <span class="text-base font-black text-black dark:text-white">Bulan #{gameState.currentMonth}</span>
            </div>

            <div class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]">
              <span class="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">Indeks Inflasi</span>
              <span class="text-base font-black text-black dark:text-white">
                {(gameState.indicators.inflationIndex * 100).toFixed(1)}%
              </span>
            </div>

            <div class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]">
              <span class="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">Laju Inflasi / Bln</span>
              <span class="text-base font-black text-[#b45309] dark:text-[#fbbf24]">
                +{(gameState.indicators.currentInflationRate * 100).toFixed(1)}%
              </span>
            </div>

            <div class="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e]">
              <span class="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">Kondisi Pasar</span>
              <Badge variant="purple" class="text-xs font-black uppercase">
                {gameState.indicators.condition}
              </Badge>
            </div>
          </div>

          <!-- Active Events List -->
          <div class="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000] dark:bg-[#20242e] space-y-3">
            <div class="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 class="text-xs font-black uppercase text-black dark:text-white flex items-center gap-1.5">
                <Activity size={14} class="stroke-[2.5]" /> Peristiwa Ekonomi Makro Aktif ({gameState.activeEvents.length})
              </h3>
            </div>

            {#if gameState.activeEvents.length > 0}
              <div class="space-y-2">
                {#each gameState.activeEvents as evt (evt.eventId)}
                  <div class="rounded-lg border-2 border-black bg-[#f6f5f0] p-2.5 text-xs dark:bg-[#16181f] flex items-center justify-between gap-2">
                    <div>
                      <div class="font-black text-black dark:text-white">{evt.title}</div>
                      <div class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        {evt.impactHeadline}
                      </div>
                    </div>
                    <Badge variant="warning" class="text-[9px] font-black shrink-0">
                      Sisa {evt.remainingMonths} bln
                    </Badge>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="rounded-lg border-2 border-dashed border-neutral-300 p-4 text-center text-xs font-bold text-neutral-400 dark:border-neutral-700">
                Kondisi pasar saat ini relatif tenang tanpa guncangan aktif.
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <div
      class="flex items-center justify-between border-t-3 border-black bg-[#f6f5f0] px-4 py-2.5 dark:bg-[#16181f] shrink-0"
    >
      <div class="flex items-center gap-1.5 text-xs font-black">
        <span>{selectedPlayer.name}</span>
        <span class="text-neutral-400">&bull;</span>
        <span class="text-[#059669] dark:text-[#34d399]">{formatRupiah(netWorth)} Net Worth</span>
      </div>

      <Button variant="outline" size="sm" onclick={onclose} class="text-xs py-1 px-3 font-black">
        Tutup
      </Button>
    </div>
  </div>
</div>
