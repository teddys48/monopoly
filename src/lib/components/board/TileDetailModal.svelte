<script lang="ts">
  import type { BoardTile } from '../../game/domain/board';
  import type { Player } from '../../game/domain/player';
  import { formatRupiah } from '../../utils/currency';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import { X, Info } from 'lucide-svelte';

  interface Props {
    tile: BoardTile | null;
    playersOnTile?: Player[];
    onclose: () => void;
  }

  let { tile, playersOnTile = [], onclose }: Props = $props();
</script>

{#if tile}
  <div
    class="rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] dark:bg-[#2b303c]"
  >
    <!-- Modal Header -->
    <div class="flex items-start justify-between border-b-2 border-black pb-3">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black text-black font-black shadow-[2px_2px_0px_0px_#000]"
          style="background-color: {tile.colorBadge};"
        >
          #{tile.index}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-black text-black dark:text-white">
              {tile.name}
            </h3>
            <Badge variant="neutral" class="text-[10px]">
              {tile.type}
            </Badge>
          </div>
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            Sektor: {tile.group ?? 'Umum'} &bull; ID: {tile.id}
          </p>
        </div>
      </div>
      <button
        onclick={onclose}
        class="rounded-lg border-2 border-black bg-[#ff6b6b] p-1.5 text-black hover:bg-[#ff8787] shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
        aria-label="Tutup Detail"
      >
        <X size={16} class="stroke-[3]" />
      </button>
    </div>

    <!-- Description & Flavor Text -->
    <div class="py-4 space-y-3">
      <div
        class="rounded-lg border-2 border-black bg-[#f6f5f0] p-3 text-xs leading-relaxed text-black dark:bg-[#20242e] dark:text-white shadow-[2px_2px_0px_0px_#000]"
      >
        <div class="flex items-center gap-1.5 font-black text-black dark:text-white mb-1">
          <Info size={14} class="stroke-[3]" /> Profil Lokasi
        </div>
        {tile.description}
      </div>

      {#if tile.flavorText}
        <p
          class="text-xs italic font-bold text-neutral-700 dark:text-neutral-300 border-l-4 border-black pl-2.5"
        >
          "{tile.flavorText}"
        </p>
      {/if}

      <!-- Financial Metrics Grid (Strictly consistent 2-column layout for all tiles) -->
      <div class="grid grid-cols-2 gap-3 pt-2">
        {#if tile.baseCost || tile.baseRent}
          <div
            class="rounded-lg border-2 border-black bg-[#86efac] p-3 text-black shadow-[3px_3px_0px_0px_#000]"
          >
            <span class="text-[10px] font-black uppercase tracking-wider block">
              Estimasi Nilai Aset
            </span>
            <div class="text-base font-black truncate">
              {tile.baseCost ? formatRupiah(tile.baseCost) : '-'}
            </div>
            <span class="text-[9px] font-bold">Modal Akuisisi</span>
          </div>

          <div
            class="rounded-lg border-2 border-black bg-[#fde047] p-3 text-black shadow-[3px_3px_0px_0px_#000]"
          >
            <span class="text-[10px] font-black uppercase tracking-wider block">
              Hasil Sewa / Omzet
            </span>
            <div class="text-base font-black truncate">
              {tile.baseRent ? formatRupiah(tile.baseRent) : '-'}
            </div>
            <span class="text-[9px] font-bold">Pendapatan per Kunjungan</span>
          </div>
        {:else}
          <div
            class="rounded-lg border-2 border-black bg-[#e0f2fe] p-3 text-black shadow-[3px_3px_0px_0px_#000]"
          >
            <span class="text-[10px] font-black uppercase tracking-wider block">
              Kategori Petak
            </span>
            <div class="text-base font-black truncate">
              {tile.group ?? tile.type}
            </div>
            <span class="text-[9px] font-bold">Layanan Publik / Regulasi</span>
          </div>

          <div
            class="rounded-lg border-2 border-black bg-[#f1f5f9] p-3 text-black shadow-[3px_3px_0px_0px_#000]"
          >
            <span class="text-[10px] font-black uppercase tracking-wider block">
              Status Beban
            </span>
            <div class="text-base font-black truncate">Bebas Biaya Sewa</div>
            <span class="text-[9px] font-bold">Fasilitas Umum</span>
          </div>
        {/if}
      </div>

      <!-- Players on Tile -->
      {#if playersOnTile.length > 0}
        <div class="rounded-lg border-2 border-black p-3 bg-white dark:bg-[#20242e]">
          <span class="text-xs font-black text-black dark:text-white block mb-1.5">
            Pemain di Petak Ini:
          </span>
          <div class="flex flex-wrap gap-2">
            {#each playersOnTile as p (p.id)}
              <span
                class="inline-flex items-center gap-1.5 rounded-md border-2 border-black px-2.5 py-0.5 text-xs font-black text-white shadow-[2px_2px_0px_0px_#000]"
                style="background-color: {p.color};"
              >
                {p.name} ({p.controller === 'AI' ? 'Bot' : 'Pemain'})
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer Actions -->
    <div class="flex justify-end pt-3 border-t-2 border-black">
      <Button variant="outline" size="sm" onclick={onclose}>Tutup</Button>
    </div>
  </div>
{/if}
