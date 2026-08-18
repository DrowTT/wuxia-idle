<script setup lang="ts">
import { Coins, Gem, Hammer, Sparkles, Swords, Trophy } from '@lucide/vue'
import { formatCompactNumber } from '../domain/game'
import type { GameState } from '../domain/types'

defineProps<{ game: GameState; playerPower: number }>()
</script>

<template>
  <header class="game-header">
    <div class="header-profile" aria-label="人物信息">
      <span class="header-avatar" aria-hidden="true">{{ game.player.name.slice(0, 1) }}</span>
      <b class="header-player-name">{{ game.player.name }}</b>
      <span class="header-power" :title="`总战力 ${playerPower.toLocaleString('zh-CN')}`"><Swords :size="14" /><strong>{{ playerPower.toLocaleString('zh-CN') }}</strong></span>
    </div>
    <slot />
    <div class="header-resources" aria-label="当前资源">
      <span class="gold" :title="`银两 ${game.player.silver.toLocaleString('zh-CN')}`">
        <Coins :size="14" aria-hidden="true" />
        <small>银两</small>
        <b>{{ formatCompactNumber(game.player.silver) }}</b>
      </span>
      <span class="premium" :title="`琅玉 ${game.player.langyu.toLocaleString('zh-CN')}`">
        <Gem :size="14" aria-hidden="true" />
        <small>琅玉</small>
        <b>{{ formatCompactNumber(game.player.langyu) }}</b>
      </span>
      <span class="blue" :title="`铸材 ${game.player.forge.toLocaleString('zh-CN')}`">
        <Hammer :size="14" aria-hidden="true" />
        <small>铸材</small>
        <b>{{ formatCompactNumber(game.player.forge) }}</b>
      </span>
      <span class="jade" :title="`功法心得 ${game.player.insight.toLocaleString('zh-CN')}`">
        <Sparkles :size="14" aria-hidden="true" />
        <small>心得</small>
        <b>{{ formatCompactNumber(game.player.insight) }}</b>
      </span>
      <span class="vermilion" :title="`江湖声名 ${game.player.fame.toLocaleString('zh-CN')}`">
        <Trophy :size="14" aria-hidden="true" />
        <small>声名</small>
        <b>{{ formatCompactNumber(game.player.fame) }}</b>
      </span>
    </div>
  </header>
</template>
