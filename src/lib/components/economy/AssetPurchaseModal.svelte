<script lang="ts">
  import type { AssetDefinition } from '../../game/domain/economy';
  import type { Player } from '../../game/domain/player';
  import { formatRupiah } from '../../utils/currency';
  import { calculateResalePrice } from '../../game/engine/economy';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import {
    ShoppingBag,
    Coins,
    ShieldAlert,
    CheckCircle2,
    X,
  } from 'lucide-svelte';

  interface Props {
    asset: AssetDefinition;
    player: Player;
    onpurchase: (assetId: string) => void;
    ondecline: () => void;
  }

  let { asset, player, onpurchase, ondecline }: Props = $props();

  const canAfford = $derived(player.balance >= asset.cost);
  const shortfall = $derived(Math.max(0, asset.cost - player.balance));
  const estimatedResale = $derived(calculateResalePrice(asset.cost, asset.resalePolicy.percentage));
  const balanceAfterPurchase = $derived(Math.max(0, player.balance - asset.cost));
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
  role="dialog"
  aria-modal="true"
  aria-labelledby="purchase-title"
>
  <div
    class="relative w-full max-w-lg rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] dark:bg-[#20242e] text-black dark:text-white space-y-4 animate-in fade-in zoom-in-95 duration-150"
  >
    <!-- Modal Header -->
    <div class="flex items-start justify-between border-b-2 border-black pb-3">
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-black font-black text-black shadow-[2px_2px_0px_0px_#000]"
          style="background-color: {asset.colorBadge};"
        >
          <ShoppingBag size={22} class="stroke-[2.5]" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 id="purchase-title" class="text-base sm:text-lg font-black leading-tight">
              {asset.name}
            </h3>
            <Badge variant="purple" class="text-[9px] font-black uppercase px-1.5 py-0.5">
              {asset.category}
            </Badge>
          </div>
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
            Petak #{asset.tileIndex} &bull; Sektor: {asset.category}
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={ondecline}
        class="rounded-lg border-2 border-black bg-[#ff6b6b] p-1.5 text-black hover:bg-[#ff8787] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
        aria-label="Tutup dan Lewati"
      >
        <X size={16} class="stroke-[3]" />
      </button>
    </div>

    <!-- Description & Flavor -->
    <div class="space-y-2">
      <p class="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-medium">
        {asset.description}
      </p>

      {#if asset.flavorText}
        <p
          class="text-[11px] italic font-bold text-neutral-600 dark:text-neutral-400 border-l-3 border-black pl-2"
        >
          "{asset.flavorText}"
        </p>
      {/if}
    </div>

    <!-- Financial Matrix (2x2 Grid) -->
    <div class="grid grid-cols-2 gap-2.5 text-xs">
      <!-- Cost Box -->
      <div
        class="rounded-xl border-2 border-black bg-[#fef08a] dark:bg-[#78350f]/40 p-2.5 shadow-[2px_2px_0px_0px_#000]"
      >
        <span
          class="text-[9px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block"
        >
          Harga Akuisisi
        </span>
        <div class="text-sm sm:text-base font-black text-black dark:text-white truncate mt-0.5">
          {formatRupiah(asset.cost)}
        </div>
        <span class="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
          Investasi Awal
        </span>
      </div>

      <!-- Expected Income Box -->
      <div
        class="rounded-xl border-2 border-black bg-[#bbf7d0] dark:bg-[#064e3b]/50 p-2.5 shadow-[2px_2px_0px_0px_#000]"
      >
        <span
          class="text-[9px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block"
        >
          Hasil Sewa / Kunjungan
        </span>
        <div class="text-sm sm:text-base font-black text-[#047857] dark:text-[#34d399] truncate mt-0.5">
          +{formatRupiah(asset.baseRent)}
        </div>
        <span class="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
          Per Kunjungan Lawan
        </span>
      </div>

      <!-- Player Cash Balance -->
      <div
        class="rounded-xl border-2 border-black bg-[#e0f2fe] dark:bg-[#0c4a6e]/40 p-2.5 shadow-[2px_2px_0px_0px_#000]"
      >
        <span
          class="text-[9px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block"
        >
          Kas Tersedia Anda
        </span>
        <div class="text-sm sm:text-base font-black text-black dark:text-white truncate mt-0.5">
          {formatRupiah(player.balance)}
        </div>
        <span class="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
          {#if canAfford}
            Sisa Kas: {formatRupiah(balanceAfterPurchase)}
          {:else}
            Kurang: {formatRupiah(shortfall)}
          {/if}
        </span>
      </div>

      <!-- Resale Guarantee Box -->
      <div
        class="rounded-xl border-2 border-black bg-[#f1f5f9] dark:bg-[#334155]/40 p-2.5 shadow-[2px_2px_0px_0px_#000]"
      >
        <span
          class="text-[9px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block"
        >
          Nilai Likuidasi ({asset.resalePolicy.percentage}%)
        </span>
        <div class="text-sm sm:text-base font-black text-black dark:text-white truncate mt-0.5">
          {formatRupiah(estimatedResale)}
        </div>
        <span class="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
          Dapat Dijual Kapan Saja
        </span>
      </div>
    </div>

    <!-- Alert / Status Notice -->
    {#if !canAfford}
      <div
        class="flex items-start gap-2 rounded-xl border-2 border-black bg-[#fee2e2] p-2.5 text-xs dark:bg-[#7f1d1d]/40 shadow-[2px_2px_0px_0px_#000]"
      >
        <ShieldAlert size={16} class="shrink-0 stroke-[2.5] text-[#dc2626] mt-0.5" />
        <div class="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
          Saldo kas tidak mencukupi untuk membeli aset ini. Butuh tambahan kas sebesar
          <span class="font-black text-[#dc2626]">{formatRupiah(shortfall)}</span>. Anda dapat melewati kesempatan ini tanpa penalti.
        </div>
      </div>
    {:else}
      <div
        class="flex items-center gap-2 rounded-xl border-2 border-black bg-[#ecfdf5] p-2.5 text-xs dark:bg-[#064e3b]/30 shadow-[2px_2px_0px_0px_#000]"
      >
        <CheckCircle2 size={15} class="shrink-0 stroke-[2.5] text-[#059669]" />
        <span class="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
          Dana Anda mencukupi! Pembelian akan langsung menambah portofolio dan net worth Anda.
        </span>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
      <Button variant="outline" size="md" onclick={ondecline} class="px-4 py-1.5 text-xs font-black">
        Lewati Giliran
      </Button>

      <Button
        variant="primary"
        size="md"
        disabled={!canAfford}
        onclick={() => onpurchase(asset.id)}
        class="bg-[#86efac] text-black hover:bg-[#4ade80] px-5 py-1.5 text-xs font-black shadow-[3px_3px_0px_0px_#000]"
      >
        <Coins size={14} class="stroke-[2.5]" />
        Beli Aset ({formatRupiah(asset.cost)})
      </Button>
    </div>
  </div>
</div>
