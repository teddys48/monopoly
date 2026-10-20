<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    value: number;
    isRolling?: boolean;
    label?: string;
  }

  let { value = 1, isRolling = false, label = 'Dadu' }: Props = $props();

  // 3x3 grid cell active indices (0-8) for standard die faces
  const PIP_PATTERNS: Record<number, number[]> = {
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  let displayValue = $state(1);
  let reducedMotion = $state(false);

  onMount(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion = mediaQuery.matches;
      const listener = (e: MediaQueryListEvent) => {
        reducedMotion = e.matches;
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  });

  $effect(() => {
    if (isRolling && !reducedMotion) {
      const interval = setInterval(() => {
        displayValue = Math.floor(Math.random() * 6) + 1;
      }, 70);

      return () => clearInterval(interval);
    } else {
      displayValue = value;
    }
  });

  const activePips = $derived(PIP_PATTERNS[displayValue] ?? PIP_PATTERNS[1]);
</script>

<div
  class="relative flex flex-col items-center select-none"
  role="img"
  aria-label="{label}: {displayValue}"
>
  <div
    class="grid grid-cols-3 grid-rows-3 h-12 w-12 sm:h-14 sm:w-14 items-center justify-items-center rounded-xl border-3 border-black bg-white p-1.5 shadow-[3px_3px_0px_0px_#000] transition-transform dark:border-white dark:bg-[#1a1d24] {isRolling &&
    !reducedMotion
      ? 'animate-bounce scale-105 rotate-3'
      : ''}"
  >
    {#each Array(9) as _, idx (idx)}
      {#if activePips.includes(idx)}
        <div
          class="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-black dark:bg-white shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,0.4)]"
        ></div>
      {:else}
        <div class="h-2 w-2 sm:h-2.5 sm:w-2.5"></div>
      {/if}
    {/each}
  </div>
</div>
