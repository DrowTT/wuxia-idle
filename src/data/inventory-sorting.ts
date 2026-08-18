import { EQUIPMENT_CATEGORIES } from './equipment'
import { GRADE_ORDER } from './lottery'
import type { Equipment, MartialArt } from '../domain/types'

const gradeRank = new Map(GRADE_ORDER.map((tone, index) => [tone, index]))
const equipmentCategoryRank = new Map(EQUIPMENT_CATEGORIES.map((category, index) => [category, index]))

function compareGrade(left: { gradeTone: Equipment['gradeTone'] }, right: { gradeTone: Equipment['gradeTone'] }): number {
  // Higher quality is shown first so valuable items are visible without scrolling.
  return (gradeRank.get(right.gradeTone) ?? -1) - (gradeRank.get(left.gradeTone) ?? -1)
}

export function compareEquipmentInventory(left: Equipment, right: Equipment): number {
  const gradeDifference = compareGrade(left, right)
  if (gradeDifference) return gradeDifference

  const categoryDifference = (equipmentCategoryRank.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER)
    - (equipmentCategoryRank.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER)
  if (categoryDifference) return categoryDifference

  return left.id.localeCompare(right.id)
}

export function compareMartialArtInventory(left: MartialArt, right: MartialArt): number {
  const gradeDifference = compareGrade(left, right)
  if (gradeDifference) return gradeDifference

  const kindDifference = (left.kind === 'inner' ? 0 : 1) - (right.kind === 'inner' ? 0 : 1)
  if (kindDifference) return kindDifference

  const categoryDifference = left.category.localeCompare(right.category, 'zh-CN')
  if (categoryDifference) return categoryDifference

  return left.id.localeCompare(right.id)
}
