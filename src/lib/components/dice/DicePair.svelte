<script lang="ts">
  import Dice from './Dice.svelte';

  interface Props {
    dice: [number, number];
    isRolling?: boolean;
    showTotal?: boolean;
  }

  let { dice, isRolling = false, showTotal = true }: Props = $props();

  const total = $derived(dice[0] + dice[1]);
</script>

<div
  class="flex items-center gap-2 sm:gap-3 p-2 rounded-xl border-2 border-black bg-white dark:bg-[#20242e] shadow-[2px_2px_0px_0px_#000]"
  aria-live="polite"
>
  <Dice value={dice[0]} {isRolling} label="Dadu Pertama" />

  <span class="font-black text-lg text-black dark:text-white select-none">+</span>

  <Dice value={dice[1]} {isRolling} label="Dadu Kedua" />

  {#if showTotal}
    <span class="font-black text-lg text-black dark:text-white select-none">=</span>

    <div
      class="flex h-12 min-w-12 sm:h-14 sm:min-w-14 px-3 flex-col items-center justify-center rounded-xl border-3 border-black bg-[#10b981] font-black text-black shadow-[3px_3px_0px_0px_#000] transition-transform select-none {isRolling
        ? 'opacity-50 scale-95'
        : 'scale-100'}"
      title="Total Langkah Dadu: {total}"
    >
      <span class="text-[9px] font-black uppercase tracking-wider text-black/70 leading-none">
        Total
      </span>
      <span class="text-lg sm:text-xl font-black leading-none mt-0.5">
        {isRolling ? '?' : total}
      </span>
    </div>
  {/if}
</div>
