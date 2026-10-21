<script lang="ts">
  import type { Transaction } from '../../game/domain/economy';
  import { formatRupiah } from '../../utils/currency';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import {
    History,
    X,
    Receipt,
  } from 'lucide-svelte';

  interface Props {
    transactions: Transaction[];
    onclose: () => void;
  }

  let { transactions, onclose }: Props = $props();

  function getTypeBadge(type: Transaction['type']): {
    label: string;
    variant: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';
    isPositive: boolean;
  } {
    switch (type) {
      case 'PURCHASE_ASSET':
        return { label: 'Beli Aset', variant: 'warning', isPositive: false };
      case 'SELL_ASSET':
        return { label: 'Jual Aset', variant: 'success', isPositive: true };
      case 'RENT_INCOME':
        return { label: 'Sewa Masuk', variant: 'success', isPositive: true };
      case 'RENT_EXPENSE':
        return { label: 'Beban Sewa', variant: 'danger', isPositive: false };
      case 'SALARY':
        return { label: 'Gaji Pokok', variant: 'info', isPositive: true };
      case 'TAX_EXPENSE':
        return { label: 'Bayar Pajak', variant: 'danger', isPositive: false };
      default:
        return { label: 'Transaksi', variant: 'neutral', isPositive: true };
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
  role="dialog"
  aria-modal="true"
  aria-labelledby="tx-history-title"
>
  <div
    class="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] dark:bg-[#20242e] text-black dark:text-white space-y-3 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b-2 border-black pb-3 shrink-0">
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#fef08a] text-black font-black shadow-[2px_2px_0px_0px_#000]"
        >
          <History size={20} class="stroke-[2.5]" />
        </div>
        <div>
          <h3 id="tx-history-title" class="text-base sm:text-lg font-black leading-tight">
            Buku Besar & Riwayat Transaksi
          </h3>
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            Catatan mutasi kas, sewa, gaji, dan akuisisi aset
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={onclose}
        class="rounded-lg border-2 border-black bg-[#ff6b6b] p-1.5 text-black hover:bg-[#ff8787] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
        aria-label="Tutup Riwayat"
      >
        <X size={16} class="stroke-[3]" />
      </button>
    </div>

    <!-- Transaction List -->
    <div class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
      {#if transactions.length === 0}
        <div
          class="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-2"
        >
          <Receipt size={32} class="text-neutral-400 stroke-[1.5]" />
          <h4 class="text-xs font-black text-neutral-700 dark:text-neutral-300">
            Belum Ada Transaksi Tercatat
          </h4>
          <p class="text-[11px] font-medium text-neutral-500 max-w-sm">
            Aktivitas pembelian aset, pembayaran sewa, atau penerimaan gaji pokok akan dicatat rapi di sini.
          </p>
        </div>
      {:else}
        {#each transactions as tx (tx.id)}
          {@const meta = getTypeBadge(tx.type)}
          <div
            class="flex items-start justify-between gap-3 rounded-xl border-2 border-black bg-[#f6f5f0] p-3 text-xs dark:bg-[#2b303c] shadow-[2px_2px_0px_0px_#000]"
          >
            <div class="space-y-1 overflow-hidden leading-tight flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <Badge variant={meta.variant} class="text-[8px] font-black uppercase px-1.5 py-0.2">
                  {meta.label}
                </Badge>
                <span class="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                  Putaran #{tx.round}
                </span>
              </div>
              <p class="text-xs font-bold text-neutral-900 dark:text-neutral-100 break-words">
                {tx.description}
              </p>
              <div class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                Saldo: {formatRupiah(tx.previousBalance)} &rarr; <span class="font-black text-black dark:text-white">{formatRupiah(tx.resultingBalance)}</span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <div
                class="text-xs sm:text-sm font-black {meta.isPositive
                  ? 'text-[#059669] dark:text-[#34d399]'
                  : 'text-[#dc2626] dark:text-[#f87171]'}"
              >
                {meta.isPositive ? '+' : '-'}{formatRupiah(tx.amount)}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-2 border-t-2 border-black shrink-0 text-xs">
      <span class="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
        Total {transactions.length} transaksi tercatat
      </span>
      <Button variant="outline" size="sm" onclick={onclose} class="px-4 py-1 text-xs font-black">
        Tutup
      </Button>
    </div>
  </div>
</div>
