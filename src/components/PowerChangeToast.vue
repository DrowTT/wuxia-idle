<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import RollingNumber from './RollingNumber.vue'

const props = defineProps<{ from: number; to: number }>()

const displayedPower = ref(props.from)
let animationFrame: number | undefined

onMounted(async () => {
  await nextTick()
  animationFrame = window.requestAnimationFrame(() => {
    displayedPower.value = props.to
  })
})

onBeforeUnmount(() => {
  if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <div class="power-change-toast" :class="to >= from ? 'is-increase' : 'is-decrease'" role="status" aria-live="polite">
    <span class="power-change-delta">{{ to > from ? '+' : '' }}{{ (to - from).toLocaleString('zh-CN') }}</span>
    <RollingNumber class="power-change-total" :value="displayedPower" :duration="1020" />
    <span class="sr-only">战力{{ to >= from ? '增加' : '减少' }}{{ Math.abs(to - from).toLocaleString('zh-CN') }}，当前{{ to.toLocaleString('zh-CN') }}</span>
  </div>
</template>
