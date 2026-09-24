import type { QuickIdea, UseCase } from '../types'
import { areNearDuplicates } from './content'

export type AtlasData = {
  useCases: UseCase[]
  quickIdeas: QuickIdea[]
  roleStarts: Array<Record<string, string | number>>
}

async function loadJson<T>(relativePath: string): Promise<T> {
  const url = new URL(relativePath, document.baseURI)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to load ' + relativePath + ': ' + response.status)
  return (await response.json()) as T
}

function cleanQuickIdeas(items: QuickIdea[]) {
  const prefix = 'ลองใช้ AI ช่วยขั้น QA/สรุปของงาน:'
  const direct = new Set(items.map((idea) => idea.useCaseId + '::' + idea.idea.trim()))
  return items.filter((idea) => {
    if (!idea.idea.startsWith(prefix)) return true
    const base = idea.idea.slice(prefix.length).trim()
    return !direct.has(idea.useCaseId + '::' + base)
  })
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [useCases, rawQuickIdeas, roleStarts] = await Promise.all([
    loadJson<UseCase[]>('data/usecases.json'),
    loadJson<QuickIdea[]>('data/ideas.json'),
    loadJson<Array<Record<string, string | number>>>('data/roleStarts.json'),
  ])
  return { useCases, quickIdeas: cleanQuickIdeas(rawQuickIdeas), roleStarts }
}

export function getUseCase(items: UseCase[], id: string) {
  return items.find((item) => item.id === id)
}

export function getRoleNames(roleStarts: Array<Record<string, string | number>>) {
  return [...new Set(roleStarts.map((row) => String(row.Role ?? '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th'))
}

function splitFacet(raw: string) {
  return new Set(raw.toLocaleLowerCase('th-TH').split(/[;,/+]|\s+\+\s+/).map((value) => value.trim()).filter((value) => value.length > 2 && value !== '-'))
}

function sharedCount(a: Set<string>, b: Set<string>) {
  let count = 0
  for (const value of a) if (b.has(value)) count += 1
  return count
}

function looseTokens(raw: string) {
  return new Set(
    raw.toLocaleLowerCase('th-TH')
      .split(/[\s,;:/()\[\]_-]+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 2),
  )
}

export function getRelatedUseCases(items: UseCase[], item: UseCase, limit = 6) {
  const itemSoftware = splitFacet(item.software)
  const itemTags = splitFacet(item.tags)
  const itemTokens = looseTokens(item.title + ' ' + item.tags + ' ' + item.software + ' ' + item.momentOfNeed)

  return items
    .filter((candidate) => candidate.id !== item.id && !areNearDuplicates(candidate.id, item.id))
    .map((candidate) => {
      let score = 0
      const delta = candidate.level - item.level

      if (candidate.categoryCode === item.categoryCode) score += 5
      if (candidate.discipline && item.discipline && candidate.discipline === item.discipline) score += 3
      if (candidate.primaryUsers && item.primaryUsers && candidate.primaryUsers === item.primaryUsers) score += 2
      if (candidate.momentOfNeed && item.momentOfNeed && candidate.momentOfNeed === item.momentOfNeed) score += 2

      score += Math.min(sharedCount(itemSoftware, splitFacet(candidate.software)) * 3, 6)
      score += Math.min(sharedCount(itemTags, splitFacet(candidate.tags)), 5)
      score += Math.min(sharedCount(itemTokens, looseTokens(candidate.title + ' ' + candidate.tags + ' ' + candidate.software + ' ' + candidate.momentOfNeed)) * 0.6, 4)

      if (delta === 1) score += 6
      else if (delta > 1) score += 4
      else if (delta === 0) score += 1.5
      else if (item.level >= 4 && delta === -1) score += 0.5

      if (candidate.surface === item.surface) score += 0.75
      return { candidate, score, delta }
    })
    .filter(({ score }) => score >= 6)
    .sort((a, b) => b.score - a.score || Math.abs(a.delta - 1) - Math.abs(b.delta - 1) || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
