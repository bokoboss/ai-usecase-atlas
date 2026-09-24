import type { Filters } from '../types'

export type AtlasTab = 'discover' | 'ideas' | 'toolkit'
export type ToolkitView = 'all' | 'saved' | 'tried' | 'recent'

export type AtlasRouteState = {
  tab: AtlasTab
  query: string
  filters: Filters
  browseAll: boolean
  ideaQuery: string
  ideaMoment: string
  ideaTime: string
  startRole: string
  toolkitView: ToolkitView
  useCaseId: string
  ideaId: string
}

const knownParams = ['tab','q','cat','role','tool','surface','level','all','iq','moment','time','start','view','uc','idea']

export function defaultAtlasRoute(): AtlasRouteState {
  return {
    tab: 'discover',
    query: '',
    filters: { category: '', role: '', software: '', surface: '', level: '' },
    browseAll: false,
    ideaQuery: '',
    ideaMoment: '',
    ideaTime: '',
    startRole: 'ทุกคน',
    toolkitView: 'all',
    useCaseId: '',
    ideaId: '',
  }
}

function validTab(value: string | null): AtlasTab {
  return value === 'ideas' || value === 'toolkit' ? value : 'discover'
}

function validToolkitView(value: string | null): ToolkitView {
  return value === 'saved' || value === 'tried' || value === 'recent' ? value : 'all'
}

function validLevel(value: string | null) {
  return value && /^[1-5]$/.test(value) ? value : ''
}

export function parseAtlasRoute(search: string): AtlasRouteState {
  const params = new URLSearchParams(search)
  const ideaId = params.get('idea') ?? ''
  const explicitTab = params.get('tab')
  return {
    tab: explicitTab ? validTab(explicitTab) : ideaId ? 'ideas' : 'discover',
    query: params.get('q') ?? '',
    filters: {
      category: params.get('cat') ?? '',
      role: params.get('role') ?? '',
      software: params.get('tool') ?? '',
      surface: params.get('surface') ?? '',
      level: validLevel(params.get('level')),
    },
    browseAll: params.get('all') === '1',
    ideaQuery: params.get('iq') ?? '',
    ideaMoment: params.get('moment') ?? '',
    ideaTime: params.get('time') ?? '',
    startRole: params.get('start') || 'ทุกคน',
    toolkitView: validToolkitView(params.get('view')),
    useCaseId: params.get('uc') ?? '',
    ideaId,
  }
}

export function buildAtlasUrl(baseUrl: string, state: AtlasRouteState) {
  const url = new URL(baseUrl)
  for (const key of knownParams) url.searchParams.delete(key)

  if (state.tab !== 'discover') url.searchParams.set('tab', state.tab)
  if (state.query) url.searchParams.set('q', state.query)
  if (state.filters.category) url.searchParams.set('cat', state.filters.category)
  if (state.filters.role) url.searchParams.set('role', state.filters.role)
  if (state.filters.software) url.searchParams.set('tool', state.filters.software)
  if (state.filters.surface) url.searchParams.set('surface', state.filters.surface)
  if (state.filters.level) url.searchParams.set('level', state.filters.level)
  if (state.browseAll) url.searchParams.set('all', '1')
  if (state.ideaQuery) url.searchParams.set('iq', state.ideaQuery)
  if (state.ideaMoment) url.searchParams.set('moment', state.ideaMoment)
  if (state.ideaTime) url.searchParams.set('time', state.ideaTime)
  if (state.startRole && state.startRole !== 'ทุกคน') url.searchParams.set('start', state.startRole)
  if (state.toolkitView !== 'all') url.searchParams.set('view', state.toolkitView)
  if (state.useCaseId) url.searchParams.set('uc', state.useCaseId)
  if (state.ideaId) url.searchParams.set('idea', state.ideaId)

  return url.toString()
}
