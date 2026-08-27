<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Coins, Flame, Gem, Hammer, PackageOpen, ScrollText } from '@lucide/vue'
import { SILVER_SHOP_PRODUCTS } from '../data'
import { formatCompactIntegerNumber, getInventoryItemById, getSilverShopOffer, getSilverShopPurchaseRemaining } from '../domain/game'
import type { GameState, ShopReward, ShopRewardType } from '../domain/types'

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{ purchase: [productId: string] }>()

const rewardMeta: Record<ShopRewardType, { label: string; icon: Component; tone: string }> = {
  forge: { label: '铸材', icon: Hammer, tone: 'forge' },
  insight: { label: '心得', icon: ScrollText, tone: 'insight' },
  innerForce: { label: '内力', icon: Flame, tone: 'inner-force' },
  item: { label: '道具', icon: Gem, tone: 'item' },
}

const products = computed(() => SILVER_SHOP_PRODUCTS.flatMap((product) => {
  const offer = getSilverShopOffer(props.game.journey, product.id)
  if (!offer) return []
  return [{
    product,
    offer,
    remaining: getSilverShopPurchaseRemaining(props.game.shop, product.id),
  }]
}))

function getRewardMeta(type: ShopRewardType): { label: string; icon: Component; tone: string } {
  return rewardMeta[type]
}

function rewardLabel(reward: ShopReward): string {
  const name = reward.type === 'item' && reward.itemId ? getInventoryItemById(reward.itemId)?.name ?? rewardMeta.item.label : rewardMeta[reward.type].label
  return `+${formatCompactIntegerNumber(reward.amount)} ${name}`
}
</script>

<template>
  <div class="silver-shop-page">
    <section class="silver-shop-hero">
      <div>
        <span class="kicker">银两兑换</span>
        <h2>江湖商会</h2>
        <p>以闯荡所得的银两，换取每日所需的习武补给。</p>
      </div>
      <div class="silver-shop-balance" :title="`银两 ${game.player.silver.toLocaleString('zh-CN')}`">
        <span><Coins :size="18" /></span>
        <div><small>可用银两</small><strong>{{ formatCompactIntegerNumber(game.player.silver) }}</strong></div>
      </div>
    </section>

    <el-card class="panel silver-shop-catalog" shadow="never">
      <div class="section-head">
        <div><span class="kicker">常备货架</span><h2>养成补给</h2></div>
        <small class="silver-shop-refresh">每日零点更新</small>
      </div>
      <div class="silver-shop-grid">
        <article v-for="entry in products" :key="entry.product.id" class="silver-shop-item">
          <header>
            <span class="silver-shop-glyph"><PackageOpen :size="20" /></span>
            <div><h3>{{ entry.product.name }}</h3><small>今日剩余 {{ entry.remaining }}/{{ entry.product.dailyLimit }}</small></div>
          </header>
          <p>{{ entry.product.description }}</p>
          <ul class="silver-shop-rewards">
            <li v-for="reward in entry.offer.rewards" :key="`${reward.type}-${reward.itemId ?? ''}`" :class="getRewardMeta(reward.type).tone">
              <component :is="getRewardMeta(reward.type).icon" :size="14" />{{ rewardLabel(reward) }}
            </li>
          </ul>
          <footer>
            <span class="silver-shop-price"><Coins :size="15" />{{ formatCompactIntegerNumber(entry.offer.price) }}</span>
            <el-button type="primary" size="small" :disabled="entry.remaining < 1 || game.player.silver < entry.offer.price" @click="emit('purchase', entry.product.id)">
              {{ entry.remaining < 1 ? '今日售罄' : '购入' }}
            </el-button>
          </footer>
        </article>
      </div>
    </el-card>

    <p class="silver-shop-note">货价与补给数量会随主线进度调整。</p>
  </div>
</template>
