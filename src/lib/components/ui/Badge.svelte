<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'purple';
    class?: string;
    children?: Snippet;
  }

  let { variant = 'neutral', class: customClass = '', children }: Props = $props();

  const variantStyles = {
    neutral: 'bg-white text-black border-black dark:bg-[#373e4d] dark:text-white',
    success: 'bg-[#86efac] text-black border-black dark:bg-[#86efac] dark:text-black',
    warning: 'bg-[#fde047] text-black border-black dark:bg-[#fde047] dark:text-black',
    info: 'bg-[#7dd3fc] text-black border-black dark:bg-[#7dd3fc] dark:text-black',
    danger: 'bg-[#fca5a5] text-black border-black dark:bg-[#fca5a5] dark:text-black',
    purple: 'bg-[#d8b4fe] text-black border-black dark:bg-[#d8b4fe] dark:text-black'
  };
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-0.5 text-xs font-black tracking-wide shadow-[2px_2px_0px_0px_#000] {variantStyles[
    variant
  ]} {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</span>
