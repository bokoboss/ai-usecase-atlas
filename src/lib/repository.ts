import type { QuickIdea, UseCase } from '../types'

export type AtlasData = {
  useCases: UseCase[]
  quickIdeas: QuickIdea[]
  roleStarts: Array<Record<string, string | number>>
}

async function loadGzipJson<T>(relativePath: string): Promise<T> {
  const url = new URL(relativePath, document.baseURI)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${relativePath}: ${response.status}`)
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support gzip decompression streams.')
  const stream = response.body?.pipeThrough(new DecompressionStream('gzip'))
  if (!stream) throw new Error(`No response body for ${relativePath}`)
  const text = await new Response(stream).text()
  return JSON.parse(text) as T
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [useCases, quickIdeas, roleStarts] = await Promise.all([
    loadGzipJson<UseCase[]>('data/usecases.json.gz'),
    loadGzipJson<QuickIdea[]>('data/ideas.json.gz'),
    loadGzipJson<Array<Record<string, string | number>>>('data/roleStarts.json.gz'),
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