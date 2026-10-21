<script lang="ts">
  import type { Player } from '../../game/domain/player';
  import type { AssetOwnership } from '../../game/domain/economy';
  import { formatRupiah } from '../../utils/currency';
  import {
    calculateResalePrice,
    calculatePlayerAssetValuation,
    calculatePlayerNetWorth
  } from '../../game/engine/economy';
  import { getAssetById } from '../../game/data/assets';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import {
    Briefcase,
    Store,
    Trash2,
    AlertTriangle,
    X,
  } from 'lucide-svelte';

  interface Props {
    players: Player[];
    activePlayerId: string;
    selectedPlayerId: string;
    ownerships: AssetOwnership[];
    onselectPlayer: (playerId: string) => void;
    onsellAsset: (assetId: string) => void;
    onclose: () => void;
  }

  let {
    players,
    activePlayerId,
    selectedPlayerId,
    ownerships,
    onselectPlayer,
    onsellAsset,
    onclose
  }: Props = $props();

  let assetToSell = $state<{
    assetId: string;
    name: string;
    resaleValue: number;
    purchasePrice: number;
  } | null>(null);

  const viewedPlayer = $derived(
    players.find((p) => p.id === selectedPlayerId) ??
      players.find((p) => p.id === activePlayerId) ??
      players[0]
  );

  const isViewedPlayerActive = $derived(viewedPlayer.id === activePlayerId);

  const playerOwnerships = $derived(
    ownerships.filter((o) => o.ownerPlayerId === viewedPlayer.id)
  );

  const playerValuation = $derived(
    calculatePlayerAssetValuation(viewedPlayer.id, ownerships)
  );

  const playerNetWorth = $derived(
    calculatePlayerNetWorth(viewedPlayer, ownerships)
  );

  function promptSell(assetId: string, name: string, purchasePrice: number, resaleValue: number) {
    assetToSell = {
      assetId,
      name,
      resaleValue,
      purchasePrice
    };
  }

  function confirmSell() {
    if (assetToSell) {
      onsellAsset(assetToSell.assetId);
      assetToSell = null;
    }
  }

  function cancelSell() {
    assetToSell = null;
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none"
  role="dialog"
  aria-modal="true"
  aria-labelledby="portfolio-title"
>
  <div
    class="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] dark:bg-[#20242e] text-black dark:text-white space-y-4 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between border-b-2 border-black pb-3 shrink-0">
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#86efac] text-black font-black shadow-[2px_2px_0px_0px_#000]"
        >
          <Briefcase size={20} class="stroke-[2.5]" />
        </div>
        <div>
          <h3 id="portfolio-title" class="text-base sm:text-lg font-black leading-tight">
            Portofolio & Manajemen Aset
          </h3>
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            Daftar kepemilikan bisnis, nilai likuidasi, dan omzet sewa
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={onclose}
        class="rounded-lg border-2 border-black bg-[#ff6b6b] p-1.5 text-black hover:bg-[#ff8787] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
        aria-label="Tutup Portofolio"
      >
        <X size={16} class="stroke-[3]" />
      </button>
    </div>

    <!-- Player Switcher Tabs (For Local Multiplayer convenience) -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
      {#each players as p (p.id)}
        {@const isSelected = p.id === viewedPlayer.id}
        {@const count = ownerships.filter((o) => o.ownerPlayerId === p.id).length}
        <button
          type="button"
          onclick={() => onselectPlayer(p.id)}
          class="flex items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1 text-xs font-black transition-all cursor-pointer {isSelected
            ? 'bg-black text-white shadow-[2px_2px_0px_0px_#888]'
            : 'bg-[#f6f5f0] text-black dark:bg-[#2b303c] dark:text-white hover:bg-neutral-200 shadow-[1px_1px_0px_0px_#000]'}"
        >
          <div
            class="h-2.5 w-2.5 rounded-full border border-black"
            style="background-color: {p.color};"
          ></div>
          <span>{p.name}</span>
          <span class="rounded bg-neutral-300 dark:bg-neutral-700 px-1 py-0.2 text-[9px] text-black dark:text-white">
            {count} aset
          </span>
          {#if p.id === activePlayerId}
            <span class="text-[8px] uppercase tracking-wider text-[#86efac]">(Aktif)</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Economic Summary Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
      <div
        class="rounded-xl border-2 border-black bg-[#e0f2fe] dark:bg-[#0c4a6e]/40 p-2 shadow-[2px_2px_0px_0px_#000]"
      >
        <span class="text-[9px] font-black uppercase text-neutral-600 dark:text-neutral-400 block">
          Kas Tunai
        </span>
        <div class="text-xs sm:text-sm font-black text-black dark:text-white truncate">
          {formatRupiah(viewedPlayer.balance)}
        </div>
      </div>

      <div
        class="rounded-xl border-2 border-black bg-[#fef08a] dark:bg-[#78350f]/40 p-2 shadow-[2px_2px_0px_0px_#000]"
      >
        <span class="text-[9px] font-black uppercase text-neutral-600 dark:text-neutral-400 block">
          Valuasi Aset ({playerOwnerships.length})
        </span>
        <div class="text-xs sm:text-sm font-black text-black dark:text-white truncate">
          {formatRupiah(playerValuation)}
        </div>
      </div>

      <div
        class="rounded-xl border-2 border-black bg-[#bbf7d0] dark:bg-[#064e3b]/40 p-2 shadow-[2px_2px_0px_0px_#000] col-span-2 sm:col-span-2"
      >
        <span class="text-[9px] font-black uppercase text-neutral-600 dark:text-neutral-400 block">
          Total Kekayaan Bersih (Net Worth)
        </span>
        <div class="text-xs sm:text-base font-black text-[#047857] dark:text-[#34d399] truncate">
          {formatRupiah(playerNetWorth)}
        </div>
      </div>
    </div>

    <!-- Asset Cards List -->
    <div class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
      {#if playerOwnerships.length === 0}
        <div
          class="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-2"
        >
          <Store size={32} class="text-neutral-400 stroke-[1.5]" />
          <h4 class="text-xs font-black text-neutral-700 dark:text-neutral-300">
            Belum Memiliki Aset Usaha
          </h4>
          <p class="text-[11px] font-medium text-neutral-500 max-w-sm">
            {viewedPlayer.name} belum mengakuisisi aset apapun. Singgahi petak komersial/properti di papan untuk membeli aset pertama Anda.
          </p>
        </div>
      {:else}
        {#each playerOwnerships as own (own.id)}
          {@const asset = getAssetById(own.assetId)}
          {#if asset}
            {@const resaleValue = calculateResalePrice(asset.cost, asset.resalePolicy.percentage)}
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border-2 border-black bg-[#f6f5f0] p-3 text-xs dark:bg-[#2b303c] shadow-[2px_2px_0px_0px_#000]"
            >
              <div class="flex items-center gap-2.5 overflow-hidden">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black text-black font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000]"
                  style="background-color: {asset.colorBadge};"
                >
                  #{asset.tileIndex}
                </div>

                <div class="overflow-hidden leading-tight">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 class="font-black text-black dark:text-white truncate text-xs sm:text-sm">
                      {asset.name}
                    </h4>
                    <Badge variant="neutral" class="text-[8px] font-black uppercase px-1 py-0">
                      {asset.category}
                    </Badge>
                  </div>
                  <div class="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Beli: {formatRupiah(own.purchasePrice)} &bull; Sewa: +{formatRupiah(asset.baseRent)} / kunjungan
                  </div>
                </div>
              </div>

              <!-- Price & Sell CTA -->
              <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-300 dark:border-neutral-700">
                <div class="text-left sm:text-right">
                  <span class="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 block">
                    Nilai Likuidasi ({asset.resalePolicy.percentage}%)
                  </span>
                  <span class="text-xs font-black text-black dark:text-white">
                    {formatRupiah(resaleValue)}
                  </span>
                </div>

                {#if isViewedPlayerActive}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => promptSell(asset.id, asset.name, own.purchasePrice, resaleValue)}
                    class="bg-[#ff6b6b] text-black hover:bg-[#ff8787] text-[11px] font-black py-1 px-2.5 shadow-[2px_2px_0px_0px_#000]"
                  >
                    <Trash2 size={12} class="stroke-[2.5]" /> Jual
                  </Button>
                {:else}
                  <span class="text-[9px] font-bold text-neutral-400 italic">
                    Hanya pemilik saat giliran
                  </span>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>

    <!-- Resale Confirmation Overlay Modal -->
    {#if assetToSell}
      <div
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs select-none"
      >
        <div
          class="w-full max-w-md rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] dark:bg-[#20242e] text-black dark:text-white space-y-4 animate-in fade-in zoom-in-95 duration-100"
        >
          <div class="flex items-center gap-2.5 text-[#dc2626]">
            <AlertTriangle size={24} class="stroke-[2.5]" />
            <h4 class="text-base font-black">Konfirmasi Penjualan Aset</h4>
          </div>

          <p class="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-medium">
            Apakah Anda yakin ingin melikuidasi aset <span class="font-black">"{assetToSell.name}"</span>?
          </p>

          <div class="rounded-xl border-2 border-black bg-[#fef08a] dark:bg-[#78350f]/50 p-3 text-xs space-y-1">
            <div class="flex justify-between font-bold">
              <span>Harga Perolehan Awal:</span>
              <span>{formatRupiah(assetToSell.purchasePrice)}</span>
            </div>
            <div class="flex justify-between font-black text-black dark:text-white text-sm border-t border-black pt-1">
              <span>Kas yang Diterima (80%):</span>
              <span class="text-[#047857] dark:text-[#34d399]">+{formatRupiah(assetToSell.resaleValue)}</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onclick={cancelSell} class="px-3 py-1 font-black text-xs">
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onclick={confirmSell}
              class="bg-[#ef4444] text-white hover:bg-[#dc2626] px-4 py-1 font-black text-xs shadow-[2px_2px_0px_0px_#000]"
            >
              Ya, Jual Aset Ini
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="flex items-center justify-between pt-2 border-t-2 border-black shrink-0 text-xs">
      <span class="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
        Kebijakan Likuidasi: 80% Nilai Akuisisi (Integer Rounding)
      </span>
      <Button variant="outline" size="sm" onclick={onclose} class="px-4 py-1 text-xs font-black">
        Tutup
      </Button>
    </div>
  </div>
</div>
