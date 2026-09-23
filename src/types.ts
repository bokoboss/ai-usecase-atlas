export type UseCase = {
  id: string
  categoryCode: string
  categoryTh: string
  category: string
  title: string
  painPoint: string
  desiredResult: string
  primaryUsers: string
  discipline: string
  level: number
  levelName: string
  surface: string
  software: string
  integrationPattern: string
  inputs: string
  promptSeed: string
  guardrail: string
  researchFlag: string
  priority: string
  tags: string
  depth: string
  momentOfNeed: string
  adoptionHook: string
  researchTier: string
  researchNote: string
  sources?: string[]
  isNew?: boolean
}

export type QuickIdea = {
  id: string
  idea: string
  useCaseId: string
  category: string
  role: string
  moment: string
  starter: string
  surface: string
  software: string
  time: string
}

export type Filters = {
  category: string
  role: string
  software: string
  surface: string
  level: string
}