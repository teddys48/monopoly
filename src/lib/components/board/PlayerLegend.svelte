<script lang="ts">
  import type { Player } from '../../game/domain/player';
  import type { BoardTile } from '../../game/domain/board';
  import { formatRupiah } from '../../utils/currency';
  import Badge from '../ui/Badge.svelte';
  import { Bot, User, MapPin } from 'lucide-svelte';

  interface Props {
    players: Player[];
    activePlayerIndex?: number;
    board: BoardTile[];
  }

  let { players, activePlayerIndex = 0, board }: Props = $props();
</script>

<div
  class="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] dark:bg-[#2b303c]"
>
  <div class="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
    <h4 class="text-xs font-black uppercase tracking-wider text-black dark:text-white">
      Legenda Pemain & Posisi
    </h4>
    <span class="text-xs font-black text-neutral-600 dark:text-neutral-400">
      {players.length} Pemain
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {#each players as player, idx (player.id)}
      {@const isTurn = idx === activePlayerIndex}
      {@const currentTile = board[player.position]}
      <div
        class="flex flex-col justify-between rounded-lg border-2 border-black p-3 transition-all {isTurn
          ? 'bg-[#86efac] text-black shadow-[3px_3px_0px_0px_#000] dark:bg-[#10b981] dark:text-black'
          : 'bg-[#f6f5f0] text-black dark:bg-[#20242e] dark:text-white shadow-[2px_2px_0px_0px_#000]'}"
      >
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center gap-2">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-xs font-black text-white shadow-[1px_1px_0px_0px_#000]"
              style="background-color: {player.color};"
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span class="text-xs font-black truncate max-w-[110px]">
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
              <User size={10} class="stroke-[3]" /> User
            {/if}
          </Badge>
        </div>

        <div class="flex items-center justify-between text-xs font-black">
          <span>Saldo:</span>
          <span class="font-black">
            {formatRupiah(player.balance)}
          </span>
        </div>

        <div
          class="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
        >
          <MapPin size={11} class="shrink-0 stroke-[2.5]" />
          <span class="truncate">
            #{player.position}
            {currentTile?.shortName ?? 'Petak 0'}
          </span>
        </div>

        {#if isTurn}
          <div
            class="mt-2 text-center rounded border border-black bg-black py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
          >
            Giliran Berjalan
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
