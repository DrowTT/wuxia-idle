<script setup lang="ts">
import Odometer from 'odometer'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ value: number; compact?: boolean; duration?: number }>(), { compact: false, duration: 340 })

const unitScale = computed(() => {
  if (!props.compact) return 1
  if (Math.abs(props.value) >= 100_000_000) return 100_000_000
  if (Math.abs(props.value) >= 100_000) return 10_000
  return 1
})
const unit = computed(() => unitScale.value === 100_000_000 ? '亿' : unitScale.value === 10_000 ? '万' : '')
const integerValue = computed(() => Math.max(0, Math.floor(props.value / unitScale.value)))
const accessibleValue = computed(() => Math.max(0, Math.floor(props.value)).toLocaleString('zh-CN'))
const element = ref<HTMLElement | null>(null)
let odometer: OdometerInstance | null = null

interface OdometerInstance {
  update: (value: number) => void
  stopWatchingMutations?: () => void
}

onMounted(() => {
  if (!element.value) return
  odometer = new Odometer({
    el: element.value,
    value: integerValue.value,
    format: '(,ddd)',
    theme: 'minimal',
    duration: props.duration,
    animation: 'slide',
  }) as OdometerInstance
})

watch(integerValue, (value) => {
  odometer?.update(value)
})

onBeforeUnmount(() => {
  odometer?.stopWatchingMutations?.()
  odometer = null
})
</script>

<template>
  <span class="rolling-number" :style="{ '--rolling-number-duration': `${duration}ms` }" :aria-label="accessibleValue">
    <span ref="element" aria-hidden="true" />
    <span v-if="unit" class="rolling-number-unit" aria-hidden="true">{{ unit }}</span>
  </span>
</template>
