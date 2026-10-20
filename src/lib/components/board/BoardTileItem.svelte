<script lang="ts">
  import type { BoardTile } from '../../game/domain/board';
  import type { Player } from '../../game/domain/player';
  import { formatShortRupiah } from '../../utils/currency';
  import {
    Coins,
    Home,
    Store,
    Briefcase,
    Bus,
    Utensils,
    Zap,
    Sparkles,
    Landmark,
    Coffee,
    Factory,
    Receipt,
    ShoppingBag,
    Ship,
    TrendingUp,
    Building2,
    HelpCircle,
    Target
  } from 'lucide-svelte';

  interface Props {
    tile: BoardTile;
    playersOnTile?: Player[];
    isSelected?: boolean;
    isTraversing?: boolean;
    isDestination?: boolean;
    onclick?: () => void;
  }

  let {
    tile,
    playersOnTile = [],
    isSelected = false,
    isTraversing = false,
    isDestination = false,
    onclick
  }: Props = $props();

  const iconMap: Record<string, typeof Coins> = {
    Coins,
    Home,
    Store,
    Briefcase,
    Bus,
    Utensils,
    Zap,
    Sparkles,
    Landmark,
    Coffee,
    Factory,
    Receipt,
    ShoppingBag,
    Ship,
    TrendingUp,
    Building2
  };

  const IconComponent = $derived(iconMap[tile.icon] || HelpCircle);

  // Dynamic visual state styling without any scale transforms to prevent card expand/compact
  const stateClasses = $derived.by(() => {
    if (isTraversing) {
      return 'ring-3 ring-[#f59e0b] bg-[#fef08a] dark:bg-[#78350f] z-20 shadow-[3px_3px_0px_0px_#000]';
    }
    if (isDestination) {
      return 'ring-3 ring-[#10b981] bg-[#dcfce7] dark:bg-[#064e3b] z-15 shadow-[3px_3px_0px_0px_#000]';
    }
    if (isSelected) {
      return 'ring-3 ring-black bg-[#fef9c3] dark:bg-[#383f4f] z-10 shadow-[3px_3px_0px_0px_#000]';
    }
    return 'shadow-[2px_2px_0px_0px_#000] bg-white dark:bg-[#2b303c]';
  });
</script>

<button
  type="button"
  {onclick}
  class="relative flex h-full w-full min-h-0 min-w-0 flex-col justify-between rounded-lg border-2 border-black p-2 text-left transition-colors duration-150 cursor-pointer overflow-hidden select-none box-border {stateClasses}"
  aria-label="Petak {tile.index}: {tile.name}, tipe: {tile.type}"
>
  <!-- Top Category Color Bar (strictly 2px height) -->
  <div
    class="absolute top-0 left-0 right-0 h-2 border-b-2 border-black shrink-0"
    style="background-color: {tile.colorBadge};"
  ></div>

  <!-- Tile Header (strictly 20px height) -->
  <div class="mt-1 flex h-5 w-full shrink-0 items-center justify-between gap-1 overflow-hidden">
    <span
      class="rounded border border-black bg-black px-1.5 py-0.2 text-[9px] font-black text-white shrink-0 leading-none"
    >
      #{tile.index}
    </span>

    {#if isDestination}
      <span
        class="flex items-center gap-0.5 rounded border border-black bg-[#10b981] px-1 py-0.2 text-[8px] font-black text-black shrink-0 leading-none"
      >
        <Target size={9} class="stroke-[3]" /> Tujuan
      </span>
    {:else if isTraversing}
      <span
        class="rounded border border-black bg-[#f59e0b] px-1 py-0.2 text-[8px] font-black text-black shrink-0 leading-none"
      >
        Langkah
      </span>
    {:else}
      <span
        class="text-[9px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 truncate max-w-[65px] leading-none"
      >
        {tile.group ?? tile.type}
      </span>
    {/if}
  </div>

  <!-- Tile Icon & Name Body (flexible, never overflows) -->
  <div class="my-0.5 flex flex-1 min-h-0 w-full items-center gap-1.5 overflow-hidden">
    <div
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-black text-black shadow-[1.5px_1.5px_0px_0px_#000]"
      style="background-color: {tile.colorBadge};"
    >
      <IconComponent size={13} class="stroke-[2.5]" />
    </div>

    <div class="leading-tight overflow-hidden flex-1 min-w-0">
      <div class="text-[11px] font-black text-black truncate dark:text-white">
        {tile.shortName}
      </div>
      <div class="text-[9px] font-black text-[#047857] dark:text-[#34d399] truncate">
        {#if tile.baseCost}
          {formatShortRupiah(tile.baseCost)}
        {:else if tile.type === 'START'}
          +Rp 2 Jt
        {:else}
          <span class="font-bold text-neutral-500 dark:text-neutral-400">{tile.type}</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Player Tokens Overlay on this tile (strictly 24px height) -->
  <div
    class="mt-auto flex h-6 w-full shrink-0 items-center gap-1 border-t-2 border-black dark:border-neutral-700 pt-0.5 overflow-hidden"
  >
    {#if playersOnTile.length > 0}
      {#each playersOnTile as player (player.id)}
        <div
          class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 border-black text-[9px] font-black text-white shadow-[1px_1px_0px_0px_#000] {isTraversing
            ? 'animate-token-hop'
            : ''}"
          style="background-color: {player.color};"
          title="{player.name} ({player.controller === 'AI' ? 'Bot' : 'Manusia'})"
        >
          {player.name.charAt(0).toUpperCase()}
        </div>
      {/each}
    {:else}
      <span class="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 italic">Kosong</span>
    {/if}
  </div>
</button>
