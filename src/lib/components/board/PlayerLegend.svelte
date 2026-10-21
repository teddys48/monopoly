<script lang="ts">
  import type { Player } from '../../game/domain/player';
  import type { BoardTile } from '../../game/domain/board';
  import type { AssetOwnership } from '../../game/domain/economy';
  import { formatRupiah, formatShortRupiah } from '../../utils/currency';
  import { calculatePlayerAssetValuation, calculatePlayerNetWorth } from '../../game/engine/economy';
  import Badge from '../ui/Badge.svelte';
  import Button from '../ui/Button.svelte';
  import { Bot, User, MapPin, Briefcase } from 'lucide-svelte';

  interface Props {
    players: Player[];
    activePlayerIndex?: number;
    board: BoardTile[];
    ownerships?: AssetOwnership[];
    onopenPortfolio?: (playerId: string) => void;
  }

  let {
    players,
    activePlayerIndex = 0,
    board,
    ownerships = [],
    onopenPortfolio
  }: Props = $props();
</script>

<div
  class="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] dark:bg-[#2b303c] select-none"
>
  <div class="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
    <h4 class="text-xs font-black uppercase tracking-wider text-black dark:text-white">
      Legenda Pemain & Ringkasan Ekonomi
    </h4>
    <span class="text-xs font-black text-neutral-600 dark:text-neutral-400">
      {players.length} Pemain
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {#each players as player, idx (player.id)}
      {@const isTurn = idx === activePlayerIndex}
      {@const currentTile = board[player.position]}
      {@const ownedCount = ownerships.filter((o) => o.ownerPlayerId === player.id).length}
      {@const valuation = calculatePlayerAssetValuation(player.id, ownerships)}
      {@const netWorth = calculatePlayerNetWorth(player, ownerships)}
      <div
        class="flex flex-col justify-between rounded-lg border-2 border-black p-3 transition-all {isTurn
          ? 'bg-[#86efac] text-black shadow-[3px_3px_0px_0px_#000] dark:bg-[#10b981] dark:text-black'
          : 'bg-[#f6f5f0] text-black dark:bg-[#20242e] dark:text-white shadow-[2px_2px_0px_0px_#000]'}"
      >
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-2">
            <div class="flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-xs font-black text-white shadow-[1px_1px_0px_0px_#000]"
                style="background-color: {player.color};"
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span class="text-xs font-black truncate max-w-[100px]">
                {player.name}
              </span>
            </div>

            <Badge
              variant={player.controller === 'AI' ? 'purple' : 'info'}
              class="text-[9px] px-1 py-0 font-black"
            >
              {#if player.controller === 'AI'}
                <Bot size={10} class="stroke-[3]" /> Bot
              {:else}
                <User size={10} class="stroke-[3]\" /> User
              {/if}
            </Badge>
          </div>

          <!-- Financial Stats -->
          <div class="space-y-1 text-xs">
            <div class="flex items-center justify-between font-bold">
              <span class="text-[10px] text-neutral-600 dark:text-neutral-400">Kas Tunai:</span>
              <span class="font-black truncate">{formatRupiah(player.balance)}</span>
            </div>

            <div class="flex items-center justify-between font-bold">
              <span class="text-[10px] text-neutral-600 dark:text-neutral-400">Aset ({ownedCount}):</span>
              <span class="font-black truncate">{formatShortRupiah(valuation)}</span>
            </div>

            <div class="flex items-center justify-between font-black border-t border-black/30 dark:border-white/30 pt-1">
              <span class="text-[10px] uppercase">Net Worth:</span>
              <span class="text-xs font-black text-[#047857] dark:text-[#34d399] truncate">
                {formatRupiah(netWorth)}
              </span>
            </div>
          </div>

          <div
            class="mt-2 flex items-center gap-1 text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
          >
            <MapPin size={11} class="shrink-0 stroke-[2.5]" />
            <span class="truncate">
              #{player.position}
              {currentTile?.shortName ?? 'Petak 0'}
            </span>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-black/20 dark:border-white/20 flex items-center gap-1.5">
          {#if onopenPortfolio}
            <Button
              variant="outline"
              size="sm"
              onclick={() => onopenPortfolio(player.id)}
              class="flex-1 text-[10px] font-black py-0.5 px-2 bg-white text-black dark:bg-[#1e2129] dark:text-white"
            >
              <Briefcase size={10} class="stroke-[2.5]" /> Portofolio ({ownedCount})
            </Button>
          {/if}

          {#if isTurn}
            <span
              class="rounded border border-black bg-black px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shrink-0"
            >
              Aktif
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
