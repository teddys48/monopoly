<script lang="ts">
  import type { BoardTile } from '../../game/domain/board';
  import type { Player } from '../../game/domain/player';
  import BoardTileItem from './BoardTileItem.svelte';
  import TileDetailModal from './TileDetailModal.svelte';
  import PlayerLegend from './PlayerLegend.svelte';
  import GameCenterDashboard from '../dashboard/GameCenterDashboard.svelte';

  interface Props {
    board: BoardTile[];
    players: Player[];
    activePlayerIndex?: number;
    selectedTileIndex?: number | null;
    traversingIndex?: number | null;
    destinationIndex?: number | null;
    animatingPlayerId?: string | null;
    onselectTile: (index: number) => void;
    onrollDice: () => void;
    onendTurn?: () => void;
  }

  let {
    board,
    players,
    activePlayerIndex = 0,
    selectedTileIndex = null,
    traversingIndex = null,
    destinationIndex = null,
    animatingPlayerId = null,
    onselectTile,
    onrollDice,
    onendTurn
  }: Props = $props();

  function getPlayersOnTile(tileIndex: number): Player[] {
    return players.filter((p) => {
      if (p.id === animatingPlayerId && traversingIndex !== null && traversingIndex !== undefined) {
        return traversingIndex === tileIndex;
      }
      return p.position === tileIndex;
    });
  }

  const selectedTile = $derived(
    selectedTileIndex !== null && selectedTileIndex !== undefined && selectedTileIndex >= 0
      ? (board[selectedTileIndex] ?? null)
      : null
  );

  /**
   * 5x5 Grid tile placement coordinates (row: 1..5, col: 1..5)
   * Clockwise layout starting from Bottom-Left (index 0).
   */
  const tileGridPositions: Record<number, { row: number; col: number }> = {
    0: { row: 5, col: 1 }, // Bottom-Left (START)
    1: { row: 5, col: 2 },
    2: { row: 5, col: 3 },
    3: { row: 5, col: 4 },
    4: { row: 5, col: 5 }, // Bottom-Right
    5: { row: 4, col: 5 },
    6: { row: 3, col: 5 },
    7: { row: 2, col: 5 },
    8: { row: 1, col: 5 }, // Top-Right
    9: { row: 1, col: 4 },
    10: { row: 1, col: 3 },
    11: { row: 1, col: 2 }, // Top Row (Kantor Pajak Pratama)
    12: { row: 1, col: 1 }, // Top-Left
    13: { row: 2, col: 1 },
    14: { row: 3, col: 1 },
    15: { row: 4, col: 1 }
  };
</script>

<div class="space-y-6">
  <!-- Desktop / Tablet Board Grid (5x5 Perimeter, mathematically locked equal rows/cols) -->
  <div class="hidden md:block overflow-x-auto p-2">
    <div
      class="mx-auto grid gap-2.5 max-w-[960px] rounded-2xl border-4 border-black bg-[#f6f5f0] p-3.5 shadow-[8px_8px_0px_0px_#000] dark:bg-[#16181f]"
      style="height: 750px; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr));"
    >
      <!-- Render the 16 Perimeter Tiles -->
      {#each board as tile (tile.id)}
        {@const pos = tileGridPositions[tile.index]}
        <div
          style="grid-row: {pos.row}; grid-column: {pos.col};"
          class="h-full w-full min-h-0 min-w-0 overflow-hidden flex flex-col"
        >
          <BoardTileItem
            {tile}
            playersOnTile={getPlayersOnTile(tile.index)}
            isSelected={selectedTileIndex === tile.index}
            isTraversing={traversingIndex === tile.index}
            isDestination={destinationIndex === tile.index}
            onclick={() => onselectTile(tile.index)}
          />
        </div>
      {/each}

      <!-- Center Area (Row 2-4, Col 2-4) strictly contained -->
      <div
        class="rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between dark:bg-[#2b303c] h-full min-h-0 overflow-hidden"
        style="grid-row: 2 / 5; grid-column: 2 / 5;"
      >
        <GameCenterDashboard
          {players}
          {activePlayerIndex}
          {board}
          {selectedTile}
          {onrollDice}
          {onendTurn}
        />
      </div>
    </div>
  </div>

  <!-- Mobile Responsive Board Layout (< 768px) -->
  <div class="block md:hidden space-y-4">
    <!-- Center Dashboard on Mobile (Wrapped in container card) -->
    <div
      class="rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] dark:bg-[#2b303c]"
    >
      <GameCenterDashboard
        {players}
        {activePlayerIndex}
        {board}
        {selectedTile}
        {onrollDice}
        {onendTurn}
      />
    </div>

    <!-- Grid of All 16 Tiles for Mobile -->
    <div
      class="rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000] dark:bg-[#2b303c]"
    >
      <div class="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
        <h4 class="text-xs font-black uppercase tracking-wider text-black dark:text-white">
          Peta Petak Papan (16 Petak)
        </h4>
        <span class="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
          Ketuk untuk melihat detail
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2.5 auto-rows-fr">
        {#each board as tile (tile.id)}
          <div class="h-[105px] min-h-0 overflow-hidden">
            <BoardTileItem
              {tile}
              playersOnTile={getPlayersOnTile(tile.index)}
              isSelected={selectedTileIndex === tile.index}
              isTraversing={traversingIndex === tile.index}
              isDestination={destinationIndex === tile.index}
              onclick={() => onselectTile(tile.index)}
            />
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Player Legend Bar -->
  <PlayerLegend {players} {activePlayerIndex} {board} />

  <!-- Selected Tile Inspector Sheet/Modal -->
  {#if selectedTile}
    <TileDetailModal
      tile={selectedTile}
      playersOnTile={getPlayersOnTile(selectedTile.index)}
      onclose={() => onselectTile(-1)}
    />
  {/if}
</div>
