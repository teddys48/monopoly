<script lang="ts">
  import { gameSession } from './lib/stores/game.svelte';
  import Header from './lib/components/layout/Header.svelte';
  import Footer from './lib/components/layout/Footer.svelte';
  import MainMenu from './lib/components/MainMenu.svelte';
  import GameSetup from './lib/components/GameSetup.svelte';
  import BoardView from './lib/components/board/BoardView.svelte';

  function handleRollDice() {
    gameSession.dispatch({ type: 'ROLL_DICE' });
  }

  function handleEndTurn() {
    gameSession.dispatch({ type: 'END_TURN' });
  }

  function handleSelectTile(index: number) {
    gameSession.dispatch({
      type: 'SELECT_TILE',
      payload: { tileIndex: index }
    });
  }
</script>

<div
  class="min-h-[100dvh] flex flex-col bg-[#f6f5f0] text-black transition-colors duration-150 dark:bg-[#1e2129] dark:text-white"
>
  <Header />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if gameSession.currentView === 'MENU'}
      <MainMenu />
    {:else if gameSession.currentView === 'SETUP'}
      <GameSetup />
    {:else if gameSession.currentView === 'BOARD'}
      {#if gameSession.gameState}
        <BoardView
          board={gameSession.gameState.board}
          players={gameSession.gameState.players}
          activePlayerIndex={gameSession.gameState.activePlayerIndex}
          selectedTileIndex={gameSession.selectedTileIndex}
          traversingIndex={gameSession.traversingIndex}
          destinationIndex={gameSession.destinationIndex}
          animatingPlayerId={gameSession.animatingPlayerId}
          onselectTile={handleSelectTile}
          onrollDice={handleRollDice}
          onendTurn={handleEndTurn}
        />
      {:else}
        <!-- Fallback preview if no active state yet -->
        <BoardView
          board={gameSession.board}
          players={[
            {
              id: 'p1-preview',
              name: 'Pemain 1',
              controller: 'HUMAN',
              color: '#EF4444',
              tokenIcon: 'User',
              balance: 10_000_000,
              position: 0,
              netWorth: 10_000_000,
              isActive: true
            },
            {
              id: 'p2-preview',
              name: 'Pak Budi (Bot)',
              controller: 'AI',
              color: '#10B981',
              tokenIcon: 'Bot',
              balance: 10_000_000,
              position: 0,
              netWorth: 10_000_000,
              isActive: true
            }
          ]}
          activePlayerIndex={0}
          selectedTileIndex={gameSession.selectedTileIndex}
          onselectTile={handleSelectTile}
          onrollDice={handleRollDice}
          onendTurn={handleEndTurn}
        />
      {/if}
    {/if}
  </main>

  <Footer />
</div>
