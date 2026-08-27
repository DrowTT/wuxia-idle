import rawContent from './silver-shop.json'
import { deepFreeze } from './freeze'
import { getInventoryItemById } from './items'
import type { SilverShopProduct } from '../domain/types'

interface SilverShopContent { products: readonly SilverShopProduct[] }

function validateSilverShopProducts(value: unknown): readonly SilverShopProduct[] {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as Partial<SilverShopContent>).products)) throw new Error('商会配置无效：缺少 products 列表。')
  const products = (value as SilverShopContent).products
  const ids = new Set<string>()
  products.forEach((product) => {
    if (!product.id?.trim() || ids.has(product.id)) throw new Error(`商会配置无效：商品 ID 重复或为空（${product.id ?? ''}）。`)
    ids.add(product.id)
    if (!product.name?.trim() || !product.description?.trim() || !product.lore?.trim()) throw new Error(`商会配置无效：${product.id}缺少展示信息。`)
    if (!Number.isInteger(product.dailyLimit) || product.dailyLimit <= 0 || !Number.isFinite(product.basePrice) || product.basePrice <= 0) throw new Error(`商会配置无效：${product.id}的价格或限购次数不合法。`)
    if (!Number.isInteger(product.growthEveryChapters) || product.growthEveryChapters <= 0 || !Number.isFinite(product.priceGrowthRate) || product.priceGrowthRate < 0 || !Number.isFinite(product.rewardGrowthRate) || product.rewardGrowthRate < 0) throw new Error(`商会配置无效：${product.id}的成长参数不合法。`)
    if (!product.rewards.length) throw new Error(`商会配置无效：${product.id}没有奖励。`)
    product.rewards.forEach((reward) => {
      if (!Number.isFinite(reward.amount) || reward.amount <= 0) throw new Error(`商会配置无效：${product.id}包含非正奖励。`)
      if (reward.type === 'item' && (!reward.itemId || !getInventoryItemById(reward.itemId))) throw new Error(`商会配置无效：${product.id}引用了不存在的道具 ${reward.itemId ?? ''}。`)
      if (reward.type !== 'item' && reward.itemId !== undefined) throw new Error(`商会配置无效：${product.id}的资源奖励不应携带道具 ID。`)
    })
  })
  return products
}

export const SILVER_SHOP_PRODUCTS: readonly SilverShopProduct[] = deepFreeze(validateSilverShopProducts(rawContent))

const SILVER_SHOP_PRODUCTS_BY_ID = new Map(SILVER_SHOP_PRODUCTS.map((product) => [product.id, product] as const))

export function getSilverShopProduct(id: string): SilverShopProduct | undefined {
  return SILVER_SHOP_PRODUCTS_BY_ID.get(id)
}
