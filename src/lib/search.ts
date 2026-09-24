import type { Filters, UseCase } from '../types'

const normalize = (value: unknown) => String(value ?? '').toLocaleLowerCase('th-TH').trim()

const fields: Array<[keyof UseCase, number]> = [
  ['title', 12], ['painPoint', 5], ['desiredResult', 5], ['inputs', 3], ['adoptionHook', 2],
  ['tags', 4], ['software', 4], ['primaryUsers', 2], ['discipline', 2], ['momentOfNeed', 3],
  ['integrationPattern', 2], ['categoryTh', 2], ['category', 1],
]

const stopWords = new Set(['ทำ', 'ช่วย', 'ให้', 'เอา', 'การ', 'งาน', 'อยู่', 'กับ', 'จาก', 'ของ', 'ที่', 'และ', 'หรือ', 'ถึง', 'เป็น', 'ใน', 'เขียน', 'ร่าง', 'บริษัท'])

const synonymGroups = [
  ['ถนน','ทางหลวง','highway','road','roadway','openroads'],
  ['รถไฟ','ระบบราง','railway','rail','track','openrail'],
  ['จราจร','traffic','ขนส่ง','transport','transportation'],
  ['vissim','microsimulation','simulation'],
  ['offset','signal offset','สัญญาณไฟ','สัญญาณ'],
  ['โครงสร้าง','structure','structural','สะพาน','bridge','etabs','sap2000'],
  ['ประมาณราคา','cost','boq','quantity','takeoff','ถอดปริมาณ','bluebeam'],
  ['เขียนแบบ','cad','drawing','drafting','autocad','microstation'],
  ['bim','revit','navisworks','dynamo'],
  ['gis','qgis','arcgis','แผนที่','spatial'],
  ['excel','spreadsheet','workbook'],
  ['รายงาน','report','word','เอกสาร','document'],
  ['ประชุม','meeting','minutes','mom','agenda','action'],
  ['จดหมาย','หนังสือ','correspondence','letter'],
  ['ข้อเสนอ','proposal','tor','bid','ประมูล'],
  ['ผู้บริหาร','md','management','executive','decision'],
  ['อัตโนมัติ','automation','script','python','vba','powershell','codex'],
  ['ตรวจ','qa','qc','review','audit','check','validation'],
  ['เลขา','ธุรการ','secretary','admin','administrator','ประสานงาน','coordinator'],
  ['ปริมาณ','quantity','boq','takeoff','estimate','ประมาณราคา','cost estimate'],
  ['ระบายน้ำ','drainage','stormwater','culvert','ท่อระบายน้ำ'],
  ['ความปลอดภัย','safety','road safety','rsa','audit'],
  ['ที่จอดรถ','parking','curbside','loading','drop-off','pick-up'],
  ['mm','man-month','man month','manpower','resource loading','บุคลากร','กำลังคน'],
]

const roleAliasGroups: Record<string, string[]> = {
  'ทุกคน': [],
  'Secretary / Admin': ['secretary','admin','administrator','เลขา','ธุรการ','ประสานงาน'],
  'Traffic Engineer': ['traffic','transport','transportation','จราจร','ขนส่ง'],
  'Highway Engineer': ['highway','road','roadway','ถนน','ทางหลวง'],
  'Railway Engineer': ['railway','rail','track','รถไฟ','ระบบราง'],
  'Structural / Civil Engineer': ['structural','structure','civil','โครงสร้าง','โยธา'],
  'CAD/BIM/GIS User': ['cad','bim','gis','drafting','เขียนแบบ'],
  'PM / Project Control': ['project control','project management','pm','บริหารโครงการ','ควบคุมโครงการ'],
  'Proposal Team': ['proposal','bid','tor','ข้อเสนอ','พัฒนาธุรกิจ'],
  'MD / BU Head': ['md','bu head','management','executive','ผู้บริหาร'],
  'Power User / Developer': ['developer','automation','coding','code','โค้ด','อัตโนมัติ','script','web'],
}

const phraseAliases: Array<[string, string[]]> = [
  ['สรุปประชุม', ['minutes','mom','meeting minutes','action']],
  ['เขียนจดหมาย', ['หนังสือ','correspondence','letter']],
  ['vissim offset', ['signal offset','offset']],
  ['signal offset', ['offset','สัญญาณไฟ']],
  ['man month', ['mm','man-month','resource loading']],
]

const thaiSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null

function queryTerms(query: string) {
  const q = normalize(query)
  if (!q) return []
  const base = thaiSegmenter
    ? [...thaiSegmenter.segment(q)].filter((part) => part.isWordLike !== false).map((part) => part.segment.trim())
    : q.split(/\s+/)
  return [...new Set(base.filter((part) => part.length > 1 && !stopWords.has(part)))]
}

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasTerm(text: string, term: string) {
  const value = normalize(term)
  if (/^[a-z0-9][a-z0-9+.#-]*$/i.test(value) && value.length <= 3) {
    return new RegExp('(^|[^a-z0-9])' + escapedRegExp(value) + '([^a-z0-9]|$)', 'i').test(text)
  }
  return text.includes(value)
}

function synonymGroup(term: string) {
  const value = normalize(term)
  return synonymGroups.find((group) => group.some((candidate) => normalize(candidate) === value))
}

function matchesFilter(value: string, filter: string) {
  return !filter || normalize(value).includes(normalize(filter))
}

export function matchesRole(value: string, filter: string) {
  if (!filter || filter === 'ทุกคน') return true
  const text = normalize(value)
  const aliases = roleAliasGroups[filter] ?? [filter]
  return aliases.some((alias) => text.includes(normalize(alias)))
}

export function searchUseCases(items: UseCase[], query: string, filters: Filters) {
  const terms = queryTerms(query)
  const phrase = normalize(query)
  const extraAliases = phraseAliases.filter(([match]) => phrase.includes(match)).flatMap(([, aliases]) => aliases)
  const filtered = items.filter((item) => {
    if (!matchesFilter(item.categoryCode + ' ' + item.categoryTh + ' ' + item.category, filters.category)) return false
    if (!matchesRole(item.primaryUsers + ' ' + item.discipline + ' ' + item.categoryTh + ' ' + item.category, filters.role)) return false
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
      const itemFields = fields.map(([key, weight]) => [normalize(item[key]), weight] as const)
      const hay = normalize(fields.map(([key]) => item[key]).join(' '))
      let score = 0
      let covered = 0

      for (const term of terms) {
        let semanticHit = false
        for (const [text, weight] of itemFields) {
          if (!text) continue
          if (text === term) { score += weight * 3; semanticHit = true }
          else if (text.startsWith(term)) { score += weight * 2; semanticHit = true }
          else if (hasTerm(text, term)) { score += weight; semanticHit = true }
        }

        const group = synonymGroup(term)
        if (group) {
          for (const alias of group) {
            if (normalize(alias) === normalize(term)) continue
            for (const [text, weight] of itemFields) if (text && hasTerm(text, alias)) score += weight * 0.28
            if (hasTerm(hay, alias)) semanticHit = true
          }
        }
        if (semanticHit) covered += 1
      }

      for (const alias of extraAliases) {
        for (const [text, weight] of itemFields) if (text && hasTerm(text, alias)) score += weight * 0.45
      }

      const coverage = terms.length ? covered / terms.length : 1
      const title = normalize(item.title)
      const software = normalize(item.software)
      const category = normalize(item.categoryTh + ' ' + item.category)

      if (phrase && title.includes(phrase)) score += 48
      if (phrase && software.includes(phrase)) score += 18
      if (phrase && category.includes(phrase)) score += 10
      if (phrase.includes('จดหมาย') && /หนังสือ|จดหมาย/.test(title)) score += 34
      if (phrase.includes('รายงานจราจร') && /จราจร|traffic/.test(category + ' ' + title)) score += 20

      if (terms.length > 1) {
        score *= 0.28 + 0.72 * coverage
        if (coverage === 1) score += 28
        else if (coverage < 0.5) score *= 0.35
      } else {
        score += coverage * 8
      }

      score += item.level <= 2 ? 1.5 : item.level === 3 ? 0.8 : 0
      if (item.isNew) score += 0.25
      return { item, score, coverage }
    })
    .filter(({ score }) => score > 1)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.item.id.localeCompare(b.item.id))
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
