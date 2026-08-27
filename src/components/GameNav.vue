<script setup lang="ts">
import type { ViewId } from '../domain/types'

interface NavItem {
  id: ViewId
  label: string
}

const items: readonly NavItem[] = [
  { id: 'practice', label: '修炼' },
  { id: 'journey', label: '闯荡' },
  { id: 'dungeon', label: '秘境' },
  { id: 'temple', label: '武庙' },
  { id: 'bag', label: '背包' },
  { id: 'lottery', label: '抽奖' },
  { id: 'market', label: '商会' },
]

const props = defineProps<{ active: ViewId; cultivationReady: boolean }>()
const emit = defineEmits<{ change: [view: ViewId] }>()

function selectView(view: string): void {
  emit('change', view as ViewId)
}
</script>

<template>
  <nav class="game-nav" aria-label="主导航">
    <el-menu class="nav-links" mode="horizontal" :default-active="props.active" :ellipsis="false" @select="selectView">
      <el-menu-item v-for="item in items" :key="item.id" :index="item.id">
        {{ item.label }}
        <el-badge v-if="item.id === 'practice' && props.cultivationReady" is-dot class="cultivation-badge"><span class="cultivation-badge-anchor" aria-hidden="true" /></el-badge>
      </el-menu-item>
    </el-menu>
  </nav>
</template>
