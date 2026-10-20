<script lang="ts">
  interface Props {
    id: string;
    label?: string;
    value?: string | number;
    placeholder?: string;
    type?: 'text' | 'number';
    disabled?: boolean;
    helperText?: string;
    errorText?: string;
    min?: number;
    max?: number;
    class?: string;
    oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    id,
    label,
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    helperText,
    errorText,
    min,
    max,
    class: customClass = '',
    oninput
  }: Props = $props();
</script>

<div class="flex flex-col gap-1.5 {customClass}">
  {#if label}
    <label
      for={id}
      class="text-xs font-black uppercase tracking-wider text-black dark:text-neutral-200"
    >
      {label}
    </label>
  {/if}

  <input
    {id}
    {type}
    {disabled}
    {placeholder}
    {min}
    {max}
    bind:value
    {oninput}
    class="w-full rounded-lg border-2 border-black bg-white px-3.5 py-2.5 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] transition-all placeholder:font-medium placeholder:text-neutral-400 focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#000] focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60 dark:bg-[#20242e] dark:text-white dark:placeholder:text-neutral-400 {errorText
      ? 'border-[#ff6b6b] bg-[#fff5f5] dark:border-[#ff6b6b] dark:bg-[#3f1d24]'
      : ''}"
  />

  {#if errorText}
    <p class="text-xs font-black text-[#dc2626] dark:text-[#ff8787]">
      {errorText}
    </p>
  {:else if helperText}
    <p class="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
      {helperText}
    </p>
  {/if}
</div>
