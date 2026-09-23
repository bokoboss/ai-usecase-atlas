import type { Filters, UseCase } from '../types'

const normalize = (value: unknown) => String(value ?? '').toLocaleLowerCase('th-TH').trim()

const fields: Array<[keyof UseCase, number]> = [
  ['title', 10], ['painPoint', 5], ['desiredResult', 5], ['inputs', 3], ['adoptionHook', 1],
  ['tags', 3], ['software', 3], ['primaryUsers', 2], ['discipline', 2], ['momentOfNeed', 2],
  ['integrationPattern', 2], ['categoryTh', 2], ['category', 1],
]

const synonymGroups = [
  ['ถนน','ทางหลวง','highway','road','roadway','openroads'],
  ['รถไฟ','ระบบราง','railway','rail','track','openrail'],
  ['จราจร','traffic','ขนส่ง','transport','transportation','vissim','sidra','synchro'],
  ['โครงสร้าง','structure','structural','สะพาน','bridge','etabs','sap2000'],
  ['ประมาณราคา','cost','boq','quantity','takeoff','ถอดปริมาณ','bluebeam'],
  ['เขียนแบบ','cad','drawing','drafting','autocad','microstation'],
  ['bim','revit','navisworks','dynamo','model'],
  ['gis','qgis','arcgis','แผนที่','spatial'],
  ['excel','spreadsheet','ตาราง','workbook'],
  ['รายงาน','report','word','เอกสาร','document'],
  ['ประชุม','meeting','minutes','agenda','action'],
  ['ข้อเสนอ','proposal','tor','bid','ประมูล'],
  ['ผู้บริหาร','md','management','executive','decision'],
  ['อัตโนมัติ','automation','script','python','vba','powershell','codex'],
  ['ตรวจ','qa','qc','review','audit','check','validation'],
  ['เลขา','ธุรการ','secretary','admin','administrator','ประสานงาน','coordinator'],
  ['แบบ','drawing','แบบก่อสร้าง','shop drawing','draft'],
  ['ปริมาณ','quantity','boq','takeoff','estimate','ประมาณราคา','cost estimate'],
  ['ระบายน้ำ','drainage','stormwater','culvert','ท่อระบายน้ำ'],
  ['ความปลอดภัย','safety','road safety','rsa','audit'],
  ['ที่จอดรถ','parking','curbside','loading','drop-off','pick-up'],
]

const thaiSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null

function queryTerms(query: string) {
  const q = normalize(query)
  if (!q) return []
  const base = thaiSegmenter
    ? [...thaiSegmenter.segment(q)].map((part) => part.segment.trim()).filter((part) => part.length > 1)
    : q.split(/\s+/).filter((part) => part.length > 1)
  const terms = new Set(base)
  for (const group of synonymGroups) {
    if (group.some((term) => q.includes(term))) group.forEach((term) => terms.add(term))
  }
  return [...terms]
}

function matchesFilter(value: string, filter: string) {
  return !filter || normalize(value).includes(normalize(filter))
}

export function searchUseCases(items: UseCase[], query: string, filters: Filters) {
  const terms = queryTerms(query)
  const filtered = items.filter((item) => {
    if (!matchesFilter(`${item.categoryCode} ${item.categoryTh} ${item.category}`, filters.category)) return false
    if (!matchesFilter(`${item.primaryUsers} ${item.discipline}`, filters.role)) return false
    if (!matchesFilter(item.software, filters.software)) return false
    if (!matchesFilter(item.surface, filters.surface)) return false
    if (filters.level && String(item.level) !== filters.level) return false
    return true
  })

  if (!terms.length) {
    return [...filtered].sort((a, b) => {
      const priority = { High: 3, P1: 3, Medium: 2, P2: 2, Low: 1, P3: 1 } as Record<string, number>
      const beginner = (item: UseCase) => item.level <= 2 ? 3 : item.level === 3 ? 2 : item.level === 4 ? 1 : 0
      return beginner(b) - beginner(a) || (priority[b.priority] ?? 0) - (priority[a.priority] ?? 0) || Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || a.id.localeCompare(b.id)
    })
  }

  return filtered
    .map((item) => {
      let score = 0
      for (const term of terms) {
        for (const [key, weight] of fields) {
          const text = normalize(item[key])
          if (!text) continue
          if (text === term) score += weight * 3
          else if (text.startsWith(term)) score += weight * 2
          else if (text.includes(term)) score += weight
        }
      }
      const title = normalize(item.title)
      const phrase = normalize(query)
      const software = normalize(item.software)
      const category = normalize(`${item.categoryTh} ${item.category}`)
      if (phrase && title.includes(phrase)) score += 24
      if (phrase && software.includes(phrase)) score += 12
      if (phrase && category.includes(phrase)) score += 8
      score += item.level <= 2 ? 1.5 : item.level === 3 ? 0.8 : 0
      if (item.isNew) score += 0.25
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .map(({ item }) => item)
}

export function uniqueValues(items: UseCase[], key: keyof UseCase) {
  const values = new Set<string>()
  for (const item of items) {
    const raw = String(item[key] ?? '')
    raw.split(/[;,/]|\s\+\s/).map((v) => v.trim()).filter((v) => v.length > 1).forEach((v) => values.add(v))
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'th'))
}