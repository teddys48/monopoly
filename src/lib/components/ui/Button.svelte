<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    title?: string;
    ariaLabel?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    class: customClass = '',
    title,
    ariaLabel,
    onclick,
    children
  }: Props = $props();

  const variantClasses = {
    primary:
      'bg-[#10b981] text-black border-2 border-black dark:bg-[#10b981] dark:text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    secondary:
      'bg-[#facc15] text-black border-2 border-black dark:bg-[#facc15] dark:text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    outline:
      'bg-white text-black border-2 border-black dark:bg-[#2b303c] dark:text-white dark:hover:bg-[#343a49] shadow-[4px_4px_0px_0px_#000] hover:bg-neutral-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    danger:
      'bg-[#ff6b6b] text-black border-2 border-black dark:bg-[#ff6b6b] dark:text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    ghost:
      'bg-transparent text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700/60 border-2 border-transparent shadow-none hover:border-black'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-black gap-1.5',
    md: 'px-4 py-2 text-sm font-black gap-2',
    lg: 'px-6 py-3 text-base font-black gap-2.5'
  };
</script>

<button
  {type}
  {disabled}
  {title}
  aria-label={ariaLabel}
  {onclick}
  class="inline-flex items-center justify-center rounded-lg transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 {variantClasses[
    variant
  ]} {sizeClasses[size]} {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</button>
