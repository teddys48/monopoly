<script lang="ts">
  import { gameSession } from '../stores/game.svelte';
  import type { GameMode, PlayerDraft, GameConfig } from '../game/domain/game-config';
  import { GAME_CONSTANTS, PLAYER_COLORS, DEFAULT_BOT_NAMES } from '../game/rules/constants';
  import { validateGameConfig } from '../game/rules/validation';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import Input from './ui/Input.svelte';
  import Badge from './ui/Badge.svelte';
  import { Users, Bot, User, Play, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-svelte';

  function createInitialPlayers(initialMode: GameMode): PlayerDraft[] {
    return [
      {
        name: 'Pemain 1',
        controller: 'HUMAN',
        color: PLAYER_COLORS[0].hex,
        tokenIcon: 'User'
      },
      {
        name: DEFAULT_BOT_NAMES[0],
        controller: initialMode === 'BOT' ? 'AI' : 'HUMAN',
        color: PLAYER_COLORS[1].hex,
        tokenIcon: initialMode === 'BOT' ? 'Bot' : 'User'
      },
      {
        name: DEFAULT_BOT_NAMES[1],
        controller: initialMode === 'BOT' ? 'AI' : 'HUMAN',
        color: PLAYER_COLORS[2].hex,
        tokenIcon: initialMode === 'BOT' ? 'Bot' : 'User'
      },
      {
        name: DEFAULT_BOT_NAMES[2],
        controller: initialMode === 'BOT' ? 'AI' : 'HUMAN',
        color: PLAYER_COLORS[3].hex,
        tokenIcon: initialMode === 'BOT' ? 'Bot' : 'User'
      }
    ];
  }

  let mode = $state<GameMode>(gameSession.selectedMode);
  let playerCount = $state<number>(2);
  let startingBalance = $state<number>(GAME_CONSTANTS.DEFAULT_STARTING_BALANCE);
  let players = $state<PlayerDraft[]>(createInitialPlayers(gameSession.selectedMode));

  // Adjust controller defaults when mode changes
  function onModeChange(newMode: GameMode) {
    mode = newMode;
    players.forEach((p, idx) => {
      if (newMode === 'BOT') {
        p.controller = idx === 0 ? 'HUMAN' : 'AI';
        if (idx > 0 && !p.name.includes('(Bot)')) {
          p.name = DEFAULT_BOT_NAMES[idx - 1];
        }
      } else {
        p.controller = 'HUMAN';
        if (p.name.includes('(Bot)')) {
          p.name = `Pemain ${idx + 1}`;
        }
      }
    });
  }

  // Active players subset based on playerCount
  const activePlayers = $derived(players.slice(0, playerCount));

  const currentConfig = $derived<GameConfig>({
    mode,
    playerCount,
    startingBalance,
    players: activePlayers
  });

  const validationResult = $derived(validateGameConfig(currentConfig));

  function handleStartGame() {
    if (validationResult.isValid) {
      gameSession.dispatch({
        type: 'START_GAME',
        payload: validationResult.data
      });
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 py-4">
  <!-- Top Navigation & Header -->
  <div class="flex items-center justify-between">
    <Button variant="outline" size="sm" onclick={() => gameSession.navigateTo('MENU')}>
      <ArrowLeft size={16} /> Kembali ke Menu
    </Button>
    <Badge variant="neutral" class="text-xs uppercase font-black">Konfigurasi Sesi Baru</Badge>
  </div>

  <Card>
    <h2 class="text-2xl font-black text-black dark:text-white mb-1">Pengaturan Permainan</h2>
    <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-6">
      Tentukan mode, jumlah peserta, identitas pemain, serta modal awal perputaran ekonomi.
    </p>

    <!-- Mode Selector -->
    <div class="space-y-4 mb-6 pb-6 border-b-2 border-black dark:border-neutral-700">
      <span class="text-xs font-black uppercase tracking-wider text-black dark:text-white block">
        Mode Permainan
      </span>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onclick={() => onModeChange('BOT')}
          class="flex items-center gap-3 p-3.5 rounded-lg border-2 text-left cursor-pointer transition-all {mode ===
          'BOT'
            ? 'border-black bg-[#86efac] text-black shadow-[3px_3px_0px_0px_#000]'
            : 'border-black bg-white dark:bg-[#20242e] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#272c38]'}"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#c084fc] text-black shadow-[2px_2px_0px_0px_#000]"
          >
            <Bot size={20} class="stroke-[2.5]" />
          </div>
          <div>
            <div
              class="text-sm font-black {mode === 'BOT'
                ? 'text-black'
                : 'text-black dark:text-white'}"
            >
              Lawan Bot AI
            </div>
            <div
              class="text-[11px] font-bold {mode === 'BOT'
                ? 'text-neutral-700'
                : 'text-neutral-700 dark:text-neutral-300'}"
            >
              1 Pemain Manusia vs Lawan Bot Komputer
            </div>
          </div>
        </button>

        <button
          type="button"
          onclick={() => onModeChange('LOCAL_MULTIPLAYER')}
          class="flex items-center gap-3 p-3.5 rounded-lg border-2 text-left cursor-pointer transition-all {mode ===
          'LOCAL_MULTIPLAYER'
            ? 'border-black bg-[#86efac] text-black shadow-[3px_3px_0px_0px_#000]'
            : 'border-black bg-white dark:bg-[#20242e] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#272c38]'}"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#38bdf8] text-black shadow-[2px_2px_0px_0px_#000]"
          >
            <Users size={20} class="stroke-[2.5]" />
          </div>
          <div>
            <div
              class="text-sm font-black {mode === 'LOCAL_MULTIPLAYER'
                ? 'text-black'
                : 'text-black dark:text-white'}"
            >
              Multiplayer Lokal
            </div>
            <div
              class="text-[11px] font-bold {mode === 'LOCAL_MULTIPLAYER'
                ? 'text-neutral-700'
                : 'text-neutral-700 dark:text-neutral-300'}"
            >
              Main bergantian bersama teman di satu perangkat
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Player Count & Starting Balance Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-black dark:border-neutral-700"
    >
      <div>
        <span
          class="text-xs font-black uppercase tracking-wider text-black dark:text-white block mb-2"
        >
          Jumlah Pemain
        </span>
        <div class="flex items-center gap-2">
          {#each [2, 3, 4] as count (count)}
            <button
              type="button"
              onclick={() => (playerCount = count)}
              class="flex-1 py-2 px-3 rounded-lg border-2 font-black text-sm cursor-pointer transition-all {playerCount ===
              count
                ? 'border-black bg-[#10b981] text-black shadow-[3px_3px_0px_0px_#000]'
                : 'border-black bg-white text-black hover:bg-neutral-100 dark:bg-[#20242e] dark:text-white'}"
            >
              {count} Pemain
            </button>
          {/each}
        </div>
      </div>

      <div>
        <Input
          id="starting-balance"
          label="Modal Awal Tiap Pemain (Rupiah)"
          type="number"
          min={1_000_000}
          value={startingBalance}
          oninput={(e) => (startingBalance = Number(e.currentTarget.value) || 0)}
          helperText="Rekomendasi standar: Rp 10.000.000"
        />
      </div>
    </div>

    <!-- Player Configuration Cards -->
    <div class="space-y-4 mb-6">
      <h3 class="text-xs font-black uppercase tracking-wider text-black dark:text-white">
        Daftar Pemain Terdaftar ({playerCount} Orang)
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each activePlayers as player, idx (idx)}
          {@const isColorDuplicated =
            activePlayers.filter((p) => p.color === player.color).length > 1}
          <div
            class="rounded-lg border-2 border-black bg-[#f6f5f0] p-4 dark:bg-[#20242e] shadow-[3px_3px_0px_0px_#000]"
          >
            <div
              class="flex items-center justify-between mb-3 border-b-2 border-black dark:border-neutral-700 pb-2"
            >
              <span class="text-xs font-black text-black dark:text-white">
                Pemain #{idx + 1}
              </span>

              <!-- Controller Toggle -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  onclick={() => (player.controller = 'HUMAN')}
                  class="px-2 py-0.5 rounded text-[10px] font-black border-2 transition-all cursor-pointer {player.controller ===
                  'HUMAN'
                    ? 'bg-[#38bdf8] text-black border-black shadow-[1px_1px_0px_0px_#000]'
                    : 'bg-white text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300'}"
                >
                  <User size={10} class="inline stroke-[3]" /> Manusia
                </button>
                <button
                  type="button"
                  onclick={() => (player.controller = 'AI')}
                  class="px-2 py-0.5 rounded text-[10px] font-black border-2 transition-all cursor-pointer {player.controller ===
                  'AI'
                    ? 'bg-[#c084fc] text-black border-black shadow-[1px_1px_0px_0px_#000]'
                    : 'bg-white text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300'}"
                >
                  <Bot size={10} class="inline stroke-[3]" /> Bot AI
                </button>
              </div>
            </div>

            <!-- Name Input -->
            <Input
              id="player-name-{idx}"
              label="Nama Lengkap"
              value={player.name}
              oninput={(e) => (player.name = e.currentTarget.value)}
              placeholder="Masukkan nama pemain..."
              class="mb-3"
            />

            <!-- Color Palette Choice -->
            <div>
              <span
                class="text-[10px] font-black uppercase tracking-wider text-black dark:text-white block mb-1.5"
              >
                Warna Pion
              </span>
              <div class="flex items-center gap-2">
                {#each PLAYER_COLORS as c (c.id)}
                  <button
                    type="button"
                    onclick={() => (player.color = c.hex)}
                    class="h-7 w-7 rounded-full border-2 border-black transition-transform cursor-pointer {player.color ===
                    c.hex
                      ? 'scale-125 ring-2 ring-offset-2 ring-black shadow-[2px_2px_0px_0px_#000]'
                      : 'opacity-70 hover:opacity-100'}"
                    style="background-color: {c.hex};"
                    title={c.name}
                  ></button>
                {/each}
              </div>
              {#if isColorDuplicated}
                <p class="mt-2 text-[10px] font-black text-[#DC2626] dark:text-[#FCA5A5]">
                  Warna ini juga dipakai pemain lain. Pilih warna berbeda agar sesi bisa dimulai.
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Real-time Validation Errors Panel -->
    {#if !validationResult.isValid}
      <div
        class="rounded-lg border-2 border-black bg-[#fca5a5] p-4 text-black shadow-[3px_3px_0px_0px_#000] mb-6"
      >
        <div class="flex items-center gap-2 font-black text-xs mb-2">
          <AlertCircle size={16} class="stroke-[3]" /> Konfigurasi Belum Lengkap / Tidak Sesuai:
        </div>
        <ul class="list-disc list-inside text-xs font-bold space-y-1">
          {#each validationResult.errors as err (err)}
            <li>{err}</li>
          {/each}
        </ul>
      </div>
    {:else}
      <div
        class="rounded-lg border-2 border-black bg-[#86efac] p-3 text-black flex items-center gap-2 text-xs font-black shadow-[3px_3px_0px_0px_#000] mb-6"
      >
        <CheckCircle2 size={16} class="stroke-[3]" /> Konfigurasi valid dan siap dimulai!
      </div>
    {/if}

    <!-- Submit Action -->
    <div class="flex justify-end gap-3 pt-4 border-t-2 border-black dark:border-neutral-700">
      <Button variant="outline" size="md" onclick={() => gameSession.navigateTo('MENU')}>
        Batal
      </Button>

      <Button
        variant="primary"
        size="lg"
        disabled={!validationResult.isValid}
        onclick={handleStartGame}
      >
        <Play size={18} class="fill-current" /> Mulai Sesi Permainan
      </Button>
    </div>
  </Card>
</div>
