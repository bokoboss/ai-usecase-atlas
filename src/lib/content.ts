import type { UseCase } from '../types'

export type NearDuplicateGroup = {
  key: string
  label: string
  ids: string[]
}

export const nearDuplicateGroups: NearDuplicateGroup[] = [
  { key: 'meeting-minutes', label: 'Minutes from transcript / notes', ids: ['C03', 'C13'] },
  { key: 'meeting-pack', label: 'Meeting pack preparation', ids: ['C04', 'C15'] },
  { key: 'meeting-action-tracker', label: 'Meeting action tracker', ids: ['C05', 'C14'] },
  { key: 'travel-time-variability', label: 'Travel time run and variability', ids: ['E05', 'E25'] },
  { key: 'powershell-file-management', label: 'PowerShell file management', ids: ['K03', 'K15'] },
  { key: 'powerpoint-from-report', label: 'PowerPoint from source report', ids: ['B23', 'B38'] },
  { key: 'sensitivity-analysis', label: 'Sensitivity analysis / table', ids: ['D22', 'D35'] },
  { key: 'geometric-design-review', label: 'Geometric design review', ids: ['F04', 'F14'] },
  { key: 'rail-interface-matrix', label: 'Rail interface matrix', ids: ['G05', 'G33'] },
  { key: 'civil3d-style-review', label: 'Civil 3D label / object style', ids: ['I05', 'I24'] },
  { key: 'data-dashboard-web', label: 'Web dashboard from Excel / CSV', ids: ['L02', 'L10'] },
  { key: 'interactive-map-dashboard', label: 'Interactive project map dashboard', ids: ['L05', 'L11'] },
  { key: 'risk-register', label: 'Risk register', ids: ['M04', 'M19'] },
  { key: 'stakeholder-communication', label: 'Stakeholder communication matrix / plan', ids: ['M09', 'M28'] },
  { key: 'tor-compliance-matrix', label: 'TOR compliance matrix', ids: ['N01', 'N09'] },
]

const groupById = new Map<string, NearDuplicateGroup>()
for (const group of nearDuplicateGroups) {
  for (const id of group.ids) groupById.set(id, group)
}

export function getNearDuplicateGroup(id: string) {
  return groupById.get(id)
}

export function nearDuplicateKey(id: string) {
  return groupById.get(id)?.key ?? 'single:' + id
}

export function areNearDuplicates(aId: string, bId: string) {
  const a = groupById.get(aId)
  const b = groupById.get(bId)
  return Boolean(a && b && a.key === b.key)
}

export function collapseNearDuplicateUseCases(items: UseCase[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = nearDuplicateKey(item.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getNearDuplicateVariants(items: UseCase[], item: UseCase) {
  const group = groupById.get(item.id)
  if (!group) return []
  const ids = new Set(group.ids.filter((id) => id !== item.id))
  return items.filter((candidate) => ids.has(candidate.id))
}
