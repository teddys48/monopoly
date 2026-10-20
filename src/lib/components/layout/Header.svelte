<script lang="ts">
  import { theme } from '../../stores/theme.svelte';
  import { gameSession } from '../../stores/game.svelte';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';
  import { Sun, Moon, ArrowLeft, Gamepad2 } from 'lucide-svelte';
</script>

<header class="border-b-2 border-black bg-[#f6f5f0] sticky top-0 z-40 dark:bg-[#1e2129]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Brand / Title -->
    <div class="flex items-center gap-3">
      {#if gameSession.currentView !== 'MENU'}
        <button
          onclick={() => gameSession.navigateTo('MENU')}
          class="p-2 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 text-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer dark:bg-[#2b303c] dark:text-white"
          title="Kembali ke Menu Utama"
          aria-label="Kembali ke Menu Utama"
        >
          <ArrowLeft size={18} />
        </button>
      {/if}

      <div
        class="flex items-center gap-2.5 cursor-pointer"
        onclick={() => gameSession.navigateTo('MENU')}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && gameSession.navigateTo('MENU')}
      >
        <div
          class="w-10 h-10 rounded-lg border-2 border-black bg-[#10b981] flex items-center justify-center font-black text-black shadow-[3px_3px_0px_0px_#000]"
        >
          <Gamepad2 size={22} class="stroke-[2.5]" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-black text-lg tracking-tight text-black dark:text-white">
              WNI SIMULATOR
            </span>
            <Badge variant="success" class="text-[10px] py-0 px-1.5 uppercase font-black">
              Fase 1
            </Badge>
          </div>
          <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400 hidden sm:block">
            Simulasi Papan Ekonomi Kerakyatan
          </p>
        </div>
      </div>
    </div>

    <!-- Actions / Theme Toggle -->
    <div class="flex items-center gap-3">
      {#if gameSession.currentView === 'BOARD' && gameSession.gameState}
        <Badge variant="warning" class="hidden md:inline-flex text-xs font-black">
          Mode: {gameSession.gameState.config.mode === 'BOT' ? 'Lawan Bot' : 'Multiplayer Lokal'}
        </Badge>
      {/if}

      <Button
        variant="outline"
        size="sm"
        onclick={() => theme.toggle()}
        class="min-w-[42px] px-2.5 py-2"
        title="Ganti Tema (Terang / Gelap)"
        ariaLabel="Ganti Tema Terang atau Gelap"
      >
        {#if theme.mode === 'dark'}
          <Sun size={18} class="text-[#facc15] stroke-[2.5]" />
        {:else}
          <Moon size={18} class="text-black stroke-[2.5]" />
        {/if}
      </Button>
    </div>
  </div>
</header>
