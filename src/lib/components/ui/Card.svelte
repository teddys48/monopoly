<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: customClass = '', children }: Props = $props();
</script>

<div
  class="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000] transition-all dark:bg-[#2b303c] {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</div>
