import { useEffect, useMemo, useState } from 'react'
import { getRelatedUseCases, getRoleNames, getUseCase, loadAtlasData } from './lib/repository'
import { searchUseCases } from './lib/search'
import type { Filters, QuickIdea, UseCase } from './types'

const emptyFilters: Filters = { category: '', role: '', software: '', surface: '', level: '' }
const levelLabels: Record<number, string> = { 1: 'Ask', 2: 'Assist', 3: 'Produce', 4: 'Workflow', 5: 'Build & Automate' }

function splitValues(raw: string) {
  return raw.split(/[;,/]|\s\+\s/).map((v) => v.trim()).filter((v) => v.length > 1)
}

function topValues(items: UseCase[], field: keyof UseCase, limit = 18) {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const value of splitValues(String(item[field] ?? ''))) {
      if (value === '-') continue
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th')).slice(0, limit)
}

function SurfaceBadge({ value }: { value: string }) {
  const main = value.toLowerCase().includes('codex') ? 'Codex' : value.toLowerCase().includes('work') ? 'Work' : 'Chat'
  return <span className={`surface-badge surface-${main.toLowerCase()}`}>{main}</span>
}

function LevelBadge({ level }: { level: number }) {
  return <span className="level-badge">L{level} · {levelLabels[level] ?? 'Use'}</span>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.7-4.7m2.2-5.8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
}

function UseCaseCard({ item, onOpen }: { item: UseCase, onOpen: (item: UseCase) => void }) {
  return (
    <button className="usecase-card" onClick={() => onOpen(item)}>
      <div className="card-topline">
        <div className="badge-row"><span className="id-chip">{item.id}</span>{item.isNew && <span className="new-badge">NEW</span>}</div>
        <div className="badge-row"><SurfaceBadge value={item.surface} /><LevelBadge level={item.level} /></div>
      </div>
      <h3>{item.title}</h3>
      <p className="card-hook">{item.adoptionHook || item.desiredResult || item.painPoint}</p>
      <div className="card-meta"><span>{item.categoryTh}</span><span>{item.primaryUsers}</span></div>
      {item.software && item.software !== '-' && <div className="software-line">{item.software}</div>}
    </button>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string, value: string, options: Array<[string, number]>, onChange: (value: string) => void }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">ทั้งหมด</option>
        {options.map(([name, count]) => <option value={name} key={name}>{name} ({count})</option>)}
      </select>
    </label>
  )
}

function DetailPanel({ item, allUseCases, onClose, onOpen }: { item: UseCase, allUseCases: UseCase[], onClose: () => void, onOpen: (item: UseCase) => void }) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const related = useMemo(() => getRelatedUseCases(allUseCases, item, 6), [allUseCases, item])

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(item.promptSeed)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const copyShare = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('uc', item.id)
    await navigator.clipboard.writeText(url.toString())
    setShared(true)
    window.setTimeout(() => setShared(false), 1600)
  }

  return (
    <div className="detail-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <article className="detail-panel" aria-modal="true" role="dialog">
        <div className="detail-sticky">
          <div>
            <div className="detail-kicker"><span className="id-chip">{item.id}</span>{item.isNew && <span className="new-badge">NEW 2026</span>}<SurfaceBadge value={item.surface} /><LevelBadge level={item.level} /></div>
            <h2>{item.title}</h2>
          </div>
          <div className="detail-actions"><button className="share-button" onClick={copyShare}>{shared ? 'Link copied' : 'Share'}</button><button className="icon-button" onClick={onClose} aria-label="ปิด">×</button></div>
        </div>

        <section className="detail-intro">
          <div><small>PAIN POINT</small><p>{item.painPoint}</p></div>
          <div><small>ผลลัพธ์ที่ต้องการ</small><p>{item.desiredResult}</p></div>
        </section>

        <div className="detail-grid">
          <section className="detail-section"><h3>ใช้เมื่อ</h3><p>{item.momentOfNeed || 'เมื่อต้องการลดเวลางานและเพิ่มความสม่ำเสมอของผลลัพธ์'}</p></section>
          <section className="detail-section"><h3>เหมาะกับ</h3><p>{item.primaryUsers}{item.discipline ? ` · ${item.discipline}` : ''}</p></section>
          <section className="detail-section"><h3>เครื่องมือ</h3><p>{item.surface}{item.software && item.software !== '-' ? ` · ${item.software}` : ''}</p></section>
          <section className="detail-section"><h3>Input</h3><p>{item.inputs}</p></section>
        </div>

        <section className="workflow-box"><span>WORKFLOW</span><p>{item.integrationPattern || 'กำหนดโจทย์ → ให้บริบท/ไฟล์ → ให้ AI ทำงาน → ตรวจผล → ปรับ → ส่งมอบ'}</p></section>

        <section className="prompt-box">
          <div className="prompt-head"><div><span className="prompt-label">PROMPT STARTER</span><h3>เริ่มคุยกับ AI แบบนี้</h3></div><button onClick={copyPrompt}>{copied ? 'คัดลอกแล้ว' : 'Copy prompt'}</button></div>
          <pre>{item.promptSeed}</pre>
        </section>

        <section className="guardrail-box">
          <div className="guardrail-mark">✓</div><div><h3>Human / Engineering Check</h3><p>{item.guardrail}</p></div>
        </section>

        <div className="detail-grid bottom-grid">
          <section className="detail-section"><h3>Research basis</h3><p>{item.researchTier}{item.researchNote ? ` · ${item.researchNote}` : ''}</p></section>
          <section className="detail-section"><h3>Depth / Priority</h3><p>{item.depth} · {item.priority}</p></section>
        </div>

        {!!item.sources?.length && <section className="source-box"><small>OFFICIAL / PRIMARY SOURCES</small>{item.sources.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>Source {index + 1} ↗</a>)}</section>}

        <div className="tag-list">{splitValues(item.tags).slice(0, 12).map((tag) => <span key={tag}>#{tag.replace(/^#/, '')}</span>)}</div>

        {!!related.length && <section className="related-section"><div><small>RELATED USE CASES</small><h3>ทำต่อจากเรื่องนี้</h3></div><div className="related-grid">{related.map((relatedItem) => <button key={relatedItem.id} onClick={() => onOpen(relatedItem)}><span>{relatedItem.id}</span><b>{relatedItem.title}</b></button>)}</div></section>}
      </article>
    </div>
  )
}

function GuidedFinder({ roles, software, onClose, onApply }: { roles: string[], software: string[], onClose: () => void, onApply: (query: string, role: string, software: string, level: string) => void }) {
  const [task, setTask] = useState('')
  const [role, setRole] = useState('')
  const [tool, setTool] = useState('')
  const [level, setLevel] = useState('')
  return <div className="finder-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose() }}>
    <section className="finder-panel">
      <div className="finder-head"><div><small>GUIDED FINDER</small><h2>ยังไม่รู้จะค้นคำว่าอะไร?</h2><p>ตอบ 3–4 ข้อ แล้ว Atlas จะเจาะ use case ให้แคบลง</p></div><button className="icon-button" onClick={onClose}>×</button></div>
      <label>ตอนนี้กำลังทำอะไร?<input value={task} onChange={(e) => setTask(e.target.value)} placeholder="เช่น ตรวจแบบ, ทำรายงาน, เตรียมประชุม, วิเคราะห์ข้อมูล" /></label>
      <label>บทบาท<select value={role} onChange={(e) => setRole(e.target.value)}><option value="">ไม่ระบุ / ทุกบทบาท</option>{roles.map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>โปรแกรม/เครื่องมือ<select value={tool} onChange={(e) => setTool(e.target.value)}><option value="">ไม่ระบุ</option>{software.map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>อยากเริ่มระดับไหน?<select value={level} onChange={(e) => setLevel(e.target.value)}><option value="">ทุกระดับ</option>{[1,2,3,4,5].map((v) => <option key={v} value={v}>L{v} · {levelLabels[v]}</option>)}</select></label>
      <button className="finder-submit" onClick={() => onApply(task, role, tool, level)}>ค้น Use Case ที่ตรงกับฉัน</button>
    </section>
  </div>
}

function App() {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [quickIdeas, setQuickIdeas] = useState<QuickIdea[]>([])
  const [roleStarts, setRoleStarts] = useState<Array<Record<string, string | number>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [selected, setSelected] = useState<UseCase | null>(null)
  const [activeTab, setActiveTab] = useState<'discover' | 'ideas'>('discover')
  const [finderOpen, setFinderOpen] = useState(false)
  const [ideaQuery, setIdeaQuery] = useState('')

  useEffect(() => {
    loadAtlasData()
      .then((data) => { setUseCases(data.useCases); setQuickIdeas(data.quickIdeas); setRoleStarts(data.roleStarts) })
      .catch((error) => setLoadError(error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!useCases.length) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('uc')
    if (id) setSelected(getUseCase(useCases, id) ?? null)
  }, [useCases])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selected) url.searchParams.set('uc', selected.id)
    else url.searchParams.delete('uc')
    window.history.replaceState({}, '', url)
  }, [selected])

  const results = useMemo(() => searchUseCases(useCases, query, filters), [query, filters])
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    useCases.forEach((u) => map.set(u.categoryTh, (map.get(u.categoryTh) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'th'))
  }, [])
  const softwarePairs = useMemo(() => topValues(useCases, 'software', 30), [useCases])
  const softwareNames = useMemo(() => softwarePairs.map(([name]) => name), [softwarePairs])
  const roleNames = useMemo(() => getRoleNames(roleStarts), [roleStarts])
  const roles = useMemo(() => roleNames.slice(0, 28).map((role) => [role, useCases.filter((u) => `${u.primaryUsers} ${u.discipline}`.includes(role)).length] as [string, number]), [roleNames])
  const surfaces: Array<[string, number]> = [
    ['Chat', useCases.filter((u) => u.surface.toLowerCase().includes('chat')).length],
    ['Work', useCases.filter((u) => u.surface.toLowerCase().includes('work')).length],
    ['Codex', useCases.filter((u) => u.surface.toLowerCase().includes('codex')).length],
  ]

  const visibleIdeas = useMemo(() => {
    const q = ideaQuery.toLocaleLowerCase('th-TH').trim()
    if (!q) return quickIdeas
    return quickIdeas.filter((idea) => `${idea.idea} ${idea.role} ${idea.software} ${idea.category} ${idea.moment}`.toLocaleLowerCase('th-TH').includes(q))
  }, [ideaQuery])

  const quickSearch = (value: string) => { setActiveTab('discover'); setQuery(value); setFilters(emptyFilters); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const applyFinder = (task: string, role: string, software: string, level: string) => {
    setActiveTab('discover')
    setQuery(task)
    setFilters({ ...emptyFilters, role, software, level })
    setFinderOpen(false)
    window.setTimeout(() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (loading) return <div className="loading-screen"><div className="brand-mark">AI</div><h1>Loading AI Use Case Atlas</h1><p>กำลังโหลด use cases และ quick ideas...</p></div>
  if (loadError) return <div className="loading-screen error"><h1>โหลดข้อมูลไม่สำเร็จ</h1><p>{loadError}</p><button onClick={() => window.location.reload()}>ลองใหม่</button></div>

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setActiveTab('discover'); setQuery(''); setFilters(emptyFilters) }}>
          <span className="brand-mark">AI</span><span><strong>Use Case Atlas</strong><small>ChatGPT for TR</small></span>
        </button>
        <nav>
          <button className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}>ค้นหา Use Case</button>
          <button className={activeTab === 'ideas' ? 'active' : ''} onClick={() => setActiveTab('ideas')}>{quickIdeas.length} Quick Ideas</button>
          <a href="https://github.com/bokoboss/ai-usecase-atlas" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      {activeTab === 'discover' ? <>
        <main className="hero-wrap">
          <div className="eyebrow">{useCases.length} USE CASES · TR BU AI ADOPTION LIBRARY</div>
          <h1>วันนี้คุณกำลังทำงานอะไรอยู่?</h1>
          <p className="hero-copy">บอกงานที่กำลังทำ ปัญหาที่เจอ หรือโปรแกรมที่ใช้ แล้วค้นดูว่า ChatGPT, Work หรือ Codex ช่วยตรงไหนได้บ้าง</p>
          <div className="search-box"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น ตรวจรายงานจราจร, ทำ Excel, OpenRoads, VISSIM, เตรียมประชุมให้ MD..." autoFocus /><span>{results.length}</span></div>
          <div className="quick-chips">
            {['งาน Office', 'Traffic', 'Highway / OpenRoads', 'Railway / OpenRail', 'Structure', 'Cost / BOQ', 'CAD / BIM / GIS', 'VISSIM', 'ทำเว็บ / โปรแกรม'].map((value) => <button key={value} onClick={() => quickSearch(value)}>{value}</button>)}
          </div>
          <button className="guided-button" onClick={() => setFinderOpen(true)}>ไม่รู้จะค้นอะไร? ใช้ Guided Finder →</button>
        </main>

        <section className="entry-grid content-width">
          <button className="entry-card role-card" onClick={() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' })}><span>01</span><div><small>เริ่มจากงาน</small><h2>ค้นจากสิ่งที่กำลังทำ</h2><p>พิมพ์ภาษาธรรมชาติ ไม่ต้องรู้ชื่อฟีเจอร์ AI ก่อน</p></div></button>
          <button className="entry-card" onClick={() => setFinderOpen(true)}><span>02</span><div><small>Guided Finder</small><h2>ให้ระบบช่วยเจาะ use case</h2><p>เลือกบทบาท โปรแกรม และระดับที่อยากลอง</p></div></button>
          <button className="entry-card" onClick={() => { setFilters({ ...emptyFilters, software: 'Excel' }); document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' }) }}><span>03</span><div><small>เริ่มจากเครื่องมือ</small><h2>Excel, CAD, BIM, VISSIM...</h2><p>ดูว่า AI ทำงานร่วมกับโปรแกรมเดิมได้อย่างไร</p></div></button>
        </section>

        <section className="coverage-strip content-width">
          <div><strong>{useCases.length}</strong><span>Use cases</span></div><div><strong>{quickIdeas.length}</strong><span>Quick ideas</span></div><div><strong>{categories.length}</strong><span>Work categories</span></div><div><strong>{useCases.filter((u) => u.isNew).length}</strong><span>New researched additions</span></div>
        </section>

        <section id="library" className="library content-width">
          <aside className="filters-panel">
            <div className="filters-title"><div><small>FILTER</small><h2>เจาะให้ตรงงาน</h2></div><button onClick={() => setFilters(emptyFilters)}>ล้างทั้งหมด</button></div>
            <FilterSelect label="หมวดงาน" value={filters.category} options={categories} onChange={(value) => setFilters((f) => ({ ...f, category: value }))} />
            <FilterSelect label="บทบาท" value={filters.role} options={roles} onChange={(value) => setFilters((f) => ({ ...f, role: value }))} />
            <FilterSelect label="Software / Tool" value={filters.software} options={softwarePairs} onChange={(value) => setFilters((f) => ({ ...f, software: value }))} />
            <FilterSelect label="ChatGPT Surface" value={filters.surface} options={surfaces} onChange={(value) => setFilters((f) => ({ ...f, surface: value }))} />
            <label className="filter-field"><span>ระดับ</span><select value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}><option value="">ทุกระดับ</option>{[1,2,3,4,5].map((level) => <option value={level} key={level}>L{level} · {levelLabels[level]}</option>)}</select></label>
            <div className="level-guide"><small>LEVEL GUIDE</small><p><b>L1</b> ถามตอบ · <b>L2</b> ให้ไฟล์ช่วยงาน · <b>L3</b> สร้าง deliverable · <b>L4</b> workflow · <b>L5</b> build/automate</p></div>
          </aside>

          <div className="results-panel">
            <div className="results-head"><div><small>USE CASE LIBRARY</small><h2>{query ? `ผลลัพธ์สำหรับ “${query}”` : 'Use cases ที่แนะนำ'}</h2></div><strong>{results.length} รายการ</strong></div>
            <div className="usecase-grid">{results.slice(0, 160).map((item) => <UseCaseCard item={item} onOpen={setSelected} key={item.id} />)}</div>
            {results.length > 160 && <div className="result-note">กำลังแสดง 160 รายการแรก — ใช้ Search หรือ Filter เพื่อเจาะให้แคบลง</div>}
            {!results.length && <div className="empty-state"><h3>ยังไม่พบ use case ที่ตรง</h3><p>ลองใช้คำสั้นลง เช่น “Excel”, “รายงาน”, “ประชุม”, “OpenRoads”, “Revit”, “VISSIM” หรือกดล้าง filter</p></div>}
          </div>
        </section>
      </> : <main className="ideas-page content-width">
        <div className="ideas-hero"><div className="eyebrow">{quickIdeas.length} QUICK IDEAS</div><h1>ยังนึกไม่ออกว่าจะใช้ AI ทำอะไร?</h1><p>ค้นหรือเลื่อนดูไอเดียสั้น ๆ แล้วกดไปยัง use case หลักเมื่อเจอสิ่งที่ใกล้กับงานของคุณ</p><div className="idea-search"><SearchIcon /><input value={ideaQuery} onChange={(e) => setIdeaQuery(e.target.value)} placeholder="ค้นไอเดีย เช่น งานเลขา, cost, QGIS, VISSIM, report..."/><span>{visibleIdeas.length}</span></div></div>
        <div className="ideas-grid">{visibleIdeas.map((idea) => <button className="idea-card" key={idea.id} onClick={() => { const item = getUseCase(useCases, idea.useCaseId); if (item) setSelected(item) }}><span>{idea.id}</span><h3>{idea.idea}</h3><p>{idea.role}</p><div><small>{idea.surface}</small><small>{idea.time}</small><small>{idea.useCaseId}</small></div></button>)}</div>
      </main>}

      <footer className="site-footer"><div><strong>AI Use Case Atlas</strong><span>TR BU · From “ไม่รู้จะใช้ AI ทำอะไร” → “ลองใช้กับงานจริงวันนี้”</span></div><span>{useCases.length} use cases · {quickIdeas.length} quick ideas</span></footer>
      {selected && <DetailPanel item={selected} allUseCases={useCases} onClose={() => setSelected(null)} onOpen={setSelected} />}
      {finderOpen && <GuidedFinder roles={roleNames.slice(0, 30)} software={softwareNames} onClose={() => setFinderOpen(false)} onApply={applyFinder} />}
    </div>
  )
}

export default App