<script lang="ts">
  import { gameSession } from '../stores/game.svelte';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import Badge from './ui/Badge.svelte';
  import {
    Bot,
    Users,
    Globe,
    Play,
    Eye,
    Landmark,
    TrendingUp,
    ShieldCheck,
    Coins
  } from 'lucide-svelte';
</script>

<div class="max-w-5xl mx-auto space-y-10 py-6">
  <!-- Hero Section -->
  <div
    class="rounded-2xl border-4 border-black bg-white p-6 sm:p-10 shadow-[6px_6px_0px_0px_#000] dark:bg-[#2b303c]"
  >
    <div class="flex flex-col lg:flex-row items-center gap-8 justify-between">
      <div class="space-y-4 max-w-2xl text-center lg:text-left">
        <div
          class="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#facc15] px-3.5 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]"
        >
          <Coins size={14} class="stroke-[2.5]" /> Simulasi Papan Ekonomi Indonesia
        </div>

        <h1
          class="text-4xl sm:text-5xl font-black tracking-tight text-black dark:text-white leading-[1.1]"
        >
          WNI SIMULATOR
        </h1>

        <p class="text-base text-neutral-700 dark:text-neutral-200 font-bold leading-relaxed">
          Kendalikan arus kas, akuisisi kawasan kos dan sentra UMKM, navigasi pajak, serta hadapi
          dinamika peristiwa ekonomi nyata Indonesia dalam format permainan papan yang kompetitif.
        </p>

        <!-- CTA Action Buttons -->
        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
          <Button variant="primary" size="lg" onclick={() => gameSession.openSetup('BOT')}>
            <Play size={18} class="fill-current" /> Mulai Bermain Sekarang
          </Button>

          <Button
            variant="outline"
            size="lg"
            onclick={() => {
              // Quick launch with default 2-player BOT config to preview board immediately
              gameSession.dispatch({
                type: 'START_GAME',
                payload: {
                  mode: 'BOT',
                  playerCount: 2,
                  startingBalance: 10_000_000,
                  players: [
                    { name: 'Pemain 1', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
                    { name: 'Pak Budi (Bot)', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
                  ]
                }
              });
            }}
          >
            <Eye size={18} /> Pratinjau Papan Langsung
          </Button>
        </div>
      </div>

      <!-- Hero Visual Badge Card -->
      <div
        class="w-full lg:w-72 shrink-0 rounded-xl border-2 border-black bg-[#dcfce7] p-5 shadow-[4px_4px_0px_0px_#000] dark:bg-[#064e3b]/50"
      >
        <h3
          class="text-xs font-black uppercase tracking-wider text-black dark:text-emerald-300 mb-3"
        >
          Prinsip Permainan
        </h3>
        <ul class="space-y-3 text-xs font-black text-black dark:text-neutral-100">
          <li class="flex items-center gap-2.5">
            <div
              class="h-6 w-6 rounded border-2 border-black bg-[#10b981] flex items-center justify-center text-black"
            >
              <Landmark size={14} class="stroke-[2.5]" />
            </div>
            <span>Ekonomi Asli Indonesia</span>
          </li>
          <li class="flex items-center gap-2.5">
            <div
              class="h-6 w-6 rounded border-2 border-black bg-[#facc15] flex items-center justify-center text-black"
            >
              <TrendingUp size={14} class="stroke-[2.5]" />
            </div>
            <span>Arus Kas & Nilai Aset Nyata</span>
          </li>
          <li class="flex items-center gap-2.5">
            <div
              class="h-6 w-6 rounded border-2 border-black bg-[#38bdf8] flex items-center justify-center text-black"
            >
              <ShieldCheck size={14} class="stroke-[2.5]" />
            </div>
            <span>Aturan Mandiri Tanpa Kloning</span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Game Mode Selection Section -->
  <div>
    <div class="mb-5">
      <h2 class="text-2xl font-black text-black dark:text-white">Pilih Mode Permainan</h2>
      <p class="text-xs font-bold text-neutral-600 dark:text-neutral-400">
        Mulai petualangan ekonomi dengan lawan bot atau bermain bersama teman di satu perangkat.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Mode 1: Lawan Bot AI -->
      <Card
        class="flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] transition-transform"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[#c084fc] text-black shadow-[3px_3px_0px_0px_#000]"
            >
              <Bot size={26} class="stroke-[2.5]" />
            </div>
            <Badge variant="success">Tersedia</Badge>
          </div>

          <div>
            <h3 class="text-xl font-black text-black dark:text-white">Lawan Bot AI</h3>
            <p
              class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-1.5 leading-relaxed"
            >
              Main sendiri melawan 1 hingga 3 lawan bot AI terprogram. Latih strategi akuisisi dan
              kelola risiko.
            </p>
          </div>
        </div>

        <div class="pt-5 border-t-2 border-black dark:border-neutral-700 mt-4">
          <Button
            variant="primary"
            size="md"
            class="w-full"
            onclick={() => gameSession.openSetup('BOT')}
          >
            Pilih Mode Bot
          </Button>
        </div>
      </Card>

      <!-- Mode 2: Multiplayer Lokal -->
      <Card
        class="flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] transition-transform"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[#38bdf8] text-black shadow-[3px_3px_0px_0px_#000]"
            >
              <Users size={26} class="stroke-[2.5]" />
            </div>
            <Badge variant="success">Tersedia</Badge>
          </div>

          <div>
            <h3 class="text-xl font-black text-black dark:text-white">Multiplayer Lokal</h3>
            <p
              class="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-1.5 leading-relaxed"
            >
              2 hingga 4 pemain bergantian giliran dalam satu laptop atau perangkat bersama secara
              santai.
            </p>
          </div>
        </div>

        <div class="pt-5 border-t-2 border-black dark:border-neutral-700 mt-4">
          <Button
            variant="secondary"
            size="md"
            class="w-full"
            onclick={() => gameSession.openSetup('LOCAL_MULTIPLAYER')}
          >
            Pilih Mode Lokal
          </Button>
        </div>
      </Card>

      <!-- Mode 3: Multiplayer Online (Disabled / Segera Hadir) -->
      <Card class="flex flex-col justify-between opacity-70 bg-neutral-100 dark:bg-[#20232c]">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-neutral-400 bg-neutral-200 text-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            >
              <Globe size={26} />
            </div>
            <Badge variant="warning">Segera Hadir</Badge>
          </div>

          <div>
            <h3 class="text-xl font-black text-neutral-700 dark:text-neutral-300">
              Multiplayer Online
            </h3>
            <p
              class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed"
            >
              Bermain daring bersama teman lintas kota dengan matchmaking real-time. Disiapkan untuk
              fase rilis mendatang.
            </p>
          </div>
        </div>

        <div class="pt-5 border-t-2 border-neutral-300 dark:border-neutral-700 mt-4">
          <Button variant="outline" size="md" disabled={true} class="w-full">
            Segera Hadir (Fase Nanti)
          </Button>
        </div>
      </Card>
    </div>
  </div>
</div>
