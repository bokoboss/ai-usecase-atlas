import type { QuickIdea, UseCase } from '../types'

export type AtlasData = {
  useCases: UseCase[]
  quickIdeas: QuickIdea[]
  roleStarts: Array<Record<string, string | number>>
}

async function loadJson<T>(relativePath: string): Promise<T> {
  const url = new URL(relativePath, document.baseURI)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${relativePath}: ${response.status}`)
  return (await response.json()) as T
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [useCases, quickIdeas, roleStarts] = await Promise.all([
    loadJson<UseCase[]>('data/usecases.json'),
    loadJson<QuickIdea[]>('data/ideas.json'),
    loadJson<Array<Record<string, string | number>>>('data/roleStarts.json'),
  ])
  return { useCases, quickIdeas, roleStarts }
}

export function getUseCase(items: UseCase[], id: string) {
  return items.find((item) => item.id === id)
}

export function getRoleNames(roleStarts: Array<Record<string, string | number>>) {
  return [...new Set(roleStarts.map((row) => String(row.Role ?? '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th'))
}

export function getRelatedUseCases(items: UseCase[], item: UseCase, limit = 6) {
  const tokens = new Set(
    `${item.categoryTh};${item.discipline};${item.software};${item.tags}`
      .toLocaleLowerCase('th-TH')
      .split(/[;,/]|\s\+\s/)
      .map((v) => v.trim())
      .filter((v) => v.length > 2),
  )
  return items
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => {
      const hay = `${candidate.categoryTh};${candidate.discipline};${candidate.software};${candidate.tags}`.toLocaleLowerCase('th-TH')
      let score = candidate.categoryCode === item.categoryCode ? 4 : 0
      if (candidate.level === item.level) score += 1
      for (const token of tokens) if (hay.includes(token)) score += 1
      return { candidate, score }
    })
    .filter(({ score }) => score > 2)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}