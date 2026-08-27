<script setup lang="ts">
import { computed, ref } from 'vue'
import { Flame, Mountain, Shield, Sparkles, Wind, Swords } from '@lucide/vue'
import { IDOL_CONFIGS } from '../data'
import { formatCompactIntegerNumber, getTempleIdolEffect, getTempleOfferingCost, getTempleRank } from '../domain/game'
import type { GameState, IdolId } from '../domain/types'

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{ offer: [idolId: IdolId] }>()
const selectedId = ref<IdolId>('mountain')
const selectedIdol = computed(() => IDOL_CONFIGS.find((idol) => idol.id === selectedId.value) ?? IDOL_CONFIGS[0]!)
const selectedRank = computed(() => getTempleRank(props.game.temple, selectedId.value))
const selectedEffect = computed(() => getTempleIdolEffect(props.game.temple, selectedId.value))
const selectedCost = computed(() => getTempleOfferingCost(props.game.temple, selectedId.value))
const atMax = computed(() => selectedRank.value >= selectedIdol.value.maxRank)
const canOffer = computed(() => !atMax.value && props.game.player.incense >= selectedCost.value)

function idolIcon(id: IdolId) {
  return id === 'mountain' ? Mountain : id === 'breaker' ? Swords : id === 'aegis' ? Shield : id === 'gale' ? Wind : Sparkles
}
function effectText(idol: typeof selectedIdol.value, effect: number): string {
  return idol.stat === 'innerForceRate' ? `+${effect} / 秒` : `+${effect}%`
}
</script>

<template>
  <div class="temple-page">
    <section class="temple-hero">
      <div><span class="kicker">武道根基 · 香火供奉</span><h2>武庙</h2><p>将秘境中带回的香火供奉给神像，提升境界基础面板。供奉效果独立于装备、丹药和宝石的固定数值。</p></div>
      <div class="temple-incense"><Flame :size="20" /><small>当前香火</small><strong>{{ formatCompactIntegerNumber(game.player.incense) }}</strong></div>
    </section>
    <div class="temple-layout">
      <el-card class="panel temple-idol-list" shadow="never">
        <div class="section-head"><div><span class="kicker">五方神像</span><h2>选择供奉对象</h2></div></div>
        <button v-for="idol in IDOL_CONFIGS" :key="idol.id" class="temple-idol-row" :class="[idol.iconTone, { active: selectedId === idol.id }]" type="button" @click="selectedId = idol.id">
          <span class="temple-idol-icon"><component :is="idolIcon(idol.id)" :size="19" /></span>
          <span class="temple-idol-copy"><b>{{ idol.name }}</b><small>{{ idol.effectLabel }} · {{ getTempleRank(game.temple, idol.id) }}/{{ idol.maxRank }}级</small></span>
          <span class="temple-idol-value">{{ effectText(idol, getTempleIdolEffect(game.temple, idol.id)) }}</span>
        </button>
      </el-card>

      <el-card class="panel temple-detail" shadow="never">
        <div class="temple-detail-top"><span class="temple-detail-icon" :class="selectedIdol.iconTone"><component :is="idolIcon(selectedIdol.id)" :size="25" /></span><div><span class="kicker">当前供奉</span><h2>{{ selectedIdol.name }}</h2><p>{{ selectedIdol.description }}</p></div></div>
        <div class="temple-rank-readout"><div><small>当前等级</small><strong>{{ selectedRank }}<em>/ {{ selectedIdol.maxRank }}</em></strong></div><div><small>已生效</small><b>{{ effectText(selectedIdol, selectedEffect) }}</b></div></div>
        <div class="temple-rank-track"><i :style="{ width: `${selectedRank / selectedIdol.maxRank * 100}%` }" /></div>
        <div class="temple-next-effect" v-if="!atMax"><small>下一次供奉</small><b>{{ effectText(selectedIdol, selectedEffect + selectedIdol.ratePerRank) }}</b><span>消耗 {{ selectedCost }} 香火</span></div>
        <div class="temple-max-note" v-else><Sparkles :size="15" />神像已至圆满，后续将开放更高阶供奉。</div>
        <el-button class="temple-offer-button" type="primary" :disabled="!canOffer" @click="emit('offer', selectedId)"><Flame :size="16" />{{ atMax ? '已达圆满' : `供奉 · ${selectedCost} 香火` }}</el-button>
        <p class="temple-footnote">基础面板增益会与装备、功法的百分比效果相乘；固定属性仍按原值加算。</p>
      </el-card>
    </div>
  </div>
</template>
