<script lang="ts">
  import type { Player } from '../../game/domain/player';
  import type { BoardTile } from '../../game/domain/board';
  import { gameSession } from '../../stores/game.svelte';
  import { formatRupiah } from '../../utils/currency';
  import DicePair from '../dice/DicePair.svelte';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import {
    Dices,
    RotateCcw,
    Bot,
    User,
    History,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Info,
    AlertTriangle
  } from 'lucide-svelte';

  interface Props {
    players: Player[];
    activePlayerIndex?: number;
    board: BoardTile[];
    selectedTile?: BoardTile | null;
    onrollDice: () => void;
    onendTurn?: () => void;
  }

  let {
    players,
    activePlayerIndex = 0,
    board: _board,
    selectedTile: _selectedTile = null,
    onrollDice,
    onendTurn
  }: Props = $props();

  const activePlayer = $derived(players[activePlayerIndex] ?? players[0]);
  const currentPhase = $derived(gameSession.gameState?.phase ?? 'READY');
  const isRolling = $derived(currentPhase === 'ROLLING');
  const isMoving = $derived(currentPhase === 'MOVING');
  const isResolving = $derived(currentPhase === 'RESOLVING_TILE');
  const isTurnComplete = $derived(currentPhase === 'TURN_COMPLETE');
  const isBotTurn = $derived(activePlayer?.controller === 'AI');

  const diceRoll = $derived<[number, number]>(
    gameSession.gameState?.currentTurn?.dice ?? gameSession.gameState?.lastDiceRoll ?? [1, 1]
  );
  const statusLogs = $derived(gameSession.gameState?.statusLog.slice(0, 10) ?? []);
  const turnResolution = $derived(gameSession.gameState?.currentTurn?.resolution);

  const phaseBadgeInfo = $derived.by(() => {
    switch (currentPhase) {
      case 'ROLLING':
        return { label: 'Mengocok Dadu...', variant: 'warning' as const };
      case 'MOVING':
        return { label: 'Pion Melangkah...', variant: 'info' as const };
      case 'RESOLVING_TILE':
        return { label: 'Evaluasi Petak...', variant: 'purple' as const };
      case 'TURN_COMPLETE':
        return { label: 'Giliran Selesai', variant: 'success' as const };
      case 'GAME_OVER':
        return { label: 'Permainan Selesai', variant: 'danger' as const };
      default:
        return { label: 'Siap Melempar', variant: 'neutral' as const };
    }
  });

  const disableRollReason = $derived.by(() => {
    if (isRolling) return 'Dadu sedang bergulir...';
    if (isMoving) return 'Pion sedang melangkah...';
    if (isResolving) return 'Sedang mengevaluasi petak...';
    if (isTurnComplete) return 'Tekan tombol "Akhiri Giliran" untuk melanjutkan.';
    if (isBotTurn && gameSession.isProcessingBot) return 'Bot AI sedang bergerak...';
    return null;
  });

  function handleRoll() {
    if (!disableRollReason) {
      onrollDice();
    }
  }

  function handleEndTurn() {
    if (onendTurn) {
      onendTurn();
    } else {
      gameSession.dispatch({ type: 'END_TURN' });
    }
  }
</script>

<div class="flex h-full min-h-0 flex-col justify-between gap-2 text-black dark:text-white">
  <!-- Top Status Bar -->
  <div class="flex items-center justify-between border-b-2 border-black pb-1.5 shrink-0">
    <div class="flex items-center gap-1.5 flex-wrap">
      <Badge variant="success" class="text-xs uppercase font-black px-2 py-0.5">
        Putaran #{gameSession.gameState?.currentRound ?? 1}
      </Badge>

      <Badge variant={phaseBadgeInfo.variant} class="text-xs uppercase font-black px-2 py-0.5">
        {phaseBadgeInfo.label}
      </Badge>
    </div>

    <Button
      variant="outline"
      size="sm"
      onclick={() => gameSession.dispatch({ type: 'RESET_GAME' })}
      class="text-xs py-0.5 px-2 shrink-0"
    >
      <RotateCcw size={12} class="stroke-[2.5]" /> Menu
    </Button>
  </div>

  <!-- Center Active Turn Hero Card (Compact Fixed Height) -->
  <div
    class="rounded-xl border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000] dark:bg-[#20242e] shrink-0"
  >
    <div class="flex items-center justify-between mb-1">
      <span
        class="text-[9px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
      >
        Giliran Pemain Aktif
      </span>

      <Badge variant={isBotTurn ? 'purple' : 'info'} class="text-[9px] px-1.5 py-0">
        {#if isBotTurn}
          <Bot size={10} class="stroke-[2.5]" /> Bot AI
        {:else}
          <User size={10} class="stroke-[2.5]" /> Pemain Manusia
        {/if}
      </Badge>
    </div>

    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black text-xs font-black text-white shadow-[1px_1px_0px_0px_#000]"
          style="background-color: {activePlayer.color};"
        >
          {activePlayer.name.charAt(0).toUpperCase()}
        </div>

        <div class="overflow-hidden leading-tight">
          <h3 class="text-xs sm:text-sm font-black text-black dark:text-white truncate">
            {activePlayer.name}
          </h3>
          <p class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 truncate">
            Petak #{activePlayer.position} &bull; Saldo: {formatRupiah(activePlayer.balance)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Two-Dice & Roll Interaction Area -->
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border-2 border-black bg-[#fef08a] p-2 shadow-[2px_2px_0px_0px_#000] dark:bg-[#854d0e]/30 shrink-0"
  >
    <!-- Dice Visualization -->
    <div class="flex items-center gap-1.5">
      <DicePair dice={diceRoll} {isRolling} showTotal={true} />
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col w-full sm:w-auto gap-1 items-stretch sm:items-end">
      {#if isTurnComplete}
        <Button
          variant="primary"
          size="md"
          onclick={handleEndTurn}
          class="w-full sm:w-auto bg-[#86efac] text-black hover:bg-[#4ade80] py-1.5"
        >
          <ArrowRight size={15} class="stroke-[3]" /> Akhiri Giliran
        </Button>
      {:else}
        <Button
          variant="primary"
          size="md"
          onclick={handleRoll}
          disabled={!!disableRollReason}
          class="w-full sm:w-auto py-1.5"
        >
          <Dices size={15} class="stroke-[2.5]" />
          {#if isRolling}
            Mengocok...
          {:else if isMoving}
            Melangkah...
          {:else if isBotTurn}
            Lempar Bot
          {:else}
            Lempar Dadu
          {/if}
        </Button>
      {/if}

      {#if disableRollReason}
        <span
          class="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 italic text-center sm:text-right"
        >
          {disableRollReason}
        </span>
      {/if}
    </div>
  </div>

  <!-- Dedicated Slot for Resolution Card (Compact Height so outer layout is static) -->
  <div class="h-[64px] shrink-0 flex flex-col justify-center overflow-hidden">
    {#if turnResolution}
      <div
        class="h-full rounded-xl border-2 border-black bg-[#ecfdf5] p-2 text-xs dark:bg-[#064e3b]/40 shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span
            class="font-black text-black dark:text-white flex items-center gap-1 text-[11px] truncate"
          >
            <Sparkles size={12} class="stroke-[2.5] text-[#059669] dark:text-[#34d399] shrink-0" />
            {turnResolution.headline}
          </span>
          <Badge variant="success" class="text-[8px] font-black uppercase px-1 py-0 shrink-0">
            #{turnResolution.tileIndex}
            {turnResolution.category}
          </Badge>
        </div>

        <p class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 truncate">
          {turnResolution.description}
        </p>

        {#if turnResolution.passedStartReward.awarded}
          <div
            class="text-[10px] font-black text-[#059669] dark:text-[#34d399] flex items-center gap-1"
          >
            <CheckCircle2 size={11} class="stroke-[3]" />
            Gaji Pokok putaran masuk ke saldo!
          </div>
        {:else}
          <div class="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
            Tekan "Akhiri Giliran" untuk melanjutkan putaran.
          </div>
        {/if}
      </div>
    {:else}
      <div
        class="h-full rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-2 text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 italic flex items-center justify-center"
      >
        Hasil petak yang dikunjungi akan ditampilkan di sini.
      </div>
    {/if}
  </div>

  <!-- Live Status & Ticker History (Full Natural Wrapping, Never Cut Off) -->
  <div
    class="flex-1 min-h-[110px] rounded-lg border-2 border-black bg-[#f6f5f0] p-2.5 text-xs dark:bg-[#20242e] shadow-[2px_2px_0px_0px_#000] overflow-hidden flex flex-col"
  >
    <div
      class="flex items-center justify-between font-black text-black dark:text-white mb-1.5 shrink-0 text-[11px]"
    >
      <span class="flex items-center gap-1">
        <History size={12} class="stroke-[2.5]" /> Catatan Aksi:
      </span>
      <span class="text-[9px] font-normal text-neutral-500 dark:text-neutral-400">
        Riwayat langkah
      </span>
    </div>

    {#if statusLogs.length > 0}
      <div class="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
        {#each statusLogs as log (log.id)}
          <div class="flex items-start gap-1.5 text-[11px] font-bold leading-snug">
            {#if log.type === 'success'}
              <CheckCircle2 size={12} class="shrink-0 stroke-[2.5] text-[#10b981] mt-0.5" />
            {:else if log.type === 'warning'}
              <AlertTriangle size={12} class="shrink-0 stroke-[2.5] text-[#f59e0b] mt-0.5" />
            {:else}
              <Info size={12} class="shrink-0 stroke-[2.5] text-[#3b82f6] mt-0.5" />
            {/if}
            <span class="text-neutral-800 dark:text-neutral-200 break-words flex-1 leading-tight">
              {log.message}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-[10px] font-bold text-neutral-400 italic">Belum ada aksi yang tercatat.</p>
    {/if}
  </div>
</div>
