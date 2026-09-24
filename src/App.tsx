import { useEffect, useMemo, useState } from 'react'
import { getRelatedUseCases, getRoleNames, getUseCase, loadAtlasData } from './lib/repository'
import { getNearDuplicateVariants } from './lib/content'
import { matchesRole, searchUseCases } from './lib/search'
import { getIdeaGuide, getIdeaPrompt } from './lib/ideaDetail'
import { buildAtlasUrl, parseAtlasRoute, type AtlasRouteState, type AtlasTab, type ToolkitView } from './lib/urlState'
import type { Filters, QuickIdea, UseCase } from './types'

const emptyFilters: Filters = { category: '', role: '', software: '', surface: '', level: '' }
const levelLabels: Record<number, string> = { 1: 'Ask', 2: 'Assist', 3: 'Produce', 4: 'Workflow', 5: 'Build & Automate' }
const quickWinIds = ['A05', 'C01', 'A06', 'A07', 'A08', 'B08', 'B27', 'D03', 'C20', 'D21']
const genericHookPattern = /(เอางานที่กำลังทำอยู่ให้ AI ช่วยบางขั้น|ลองทำเป็น workflow เล็กๆ|เริ่มจากงานจริงที่พบได้บ่อย)/i

type ThemeMode = 'dark' | 'light'

function getInitialTheme(): ThemeMode {
  if (typeof document !== 'undefined') {
    const active = document.documentElement.dataset.theme
    if (active === 'light' || active === 'dark') return active
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('ai-atlas:theme')
      if (stored === 'light' || stored === 'dark') return stored
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch { /* fall through to dark */ }
  }
  return 'dark'
}

function ThemeToggle({ theme, onToggle }: { theme: ThemeMode, onToggle: () => void }) {
  const nextLabel = theme === 'dark' ? 'Light' : 'Dark'
  const ariaLabel = theme === 'dark' ? 'เปลี่ยนเป็น Light mode' : 'เปลี่ยนเป็น Dark mode'
  return <button className="theme-toggle" onClick={onToggle} aria-label={ariaLabel} title={ariaLabel}><span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><b>{nextLabel}</b></button>
}

function displayOutcome(item: UseCase) {
  if (item.adoptionHook && !genericHookPattern.test(item.adoptionHook)) return item.adoptionHook
  return item.desiredResult || item.painPoint
}

function workflowSteps(item: UseCase) {
  const raw = (item.integrationPattern || '').trim()
  if (raw && !/^ai[- ]assisted$/i.test(raw) && raw.length > 18) {
    return raw.split(/→|->|›|\n/).map((step) => step.trim()).filter(Boolean)
  }
  const input = item.inputs && item.inputs !== '-' ? item.inputs : 'บริบท ข้อมูล หรือไฟล์ที่เกี่ยวข้อง'
  if (item.level <= 1) return [
    'บอกงานที่ต้องการและผู้รับผลลัพธ์ให้ชัด',
    `ให้บริบทหรือข้อจำกัดที่จำเป็น: ${input}`,
    'ให้ AI เสนอคำตอบ/ทางเลือกในรูปแบบที่ต้องการ',
    'ตรวจชื่อ ตัวเลข ข้อเท็จจริง และปรับก่อนนำไปใช้',
  ]
  if (item.level === 2) return [
    `เตรียมข้อมูลหรือไฟล์ต้นทาง: ${input}`,
    'ให้ AI ตรวจโครงสร้าง ความครบถ้วน และสิ่งผิดปกติก่อน',
    'ให้ AI วิเคราะห์หรือแปลงข้อมูลตามโจทย์ พร้อมอธิบายสิ่งที่ทำ',
    'ตรวจหน่วย สูตร สมมติฐาน และเทียบกับต้นฉบับก่อนใช้ผล',
  ]
  if (item.level === 3) return [
    'กำหนด deliverable รูปแบบ และเกณฑ์ที่ต้องรักษา',
    `ให้แหล่งข้อมูลต้นทาง: ${input}`,
    'ให้ AI สร้าง draft แล้วตรวจความครบถ้วนเทียบ source',
    'ปรับแก้และให้ผู้รับผิดชอบ approve ก่อนส่งมอบ',
  ]
  if (item.level === 4) return [
    'กำหนด workflow, input/output และจุดที่มนุษย์ต้องตัดสินใจ',
    'QA ข้อมูลต้นทางก่อนเริ่ม และเก็บ source เดิมไว้ตรวจย้อนกลับ',
    'ให้ AI ทำงานเป็นช่วง ๆ พร้อม intermediate output ที่ตรวจได้',
    'cross-check ผลกับ source/standard และแก้ gap ที่พบ',
    'สร้าง deliverable พร้อม action/assumption log ก่อนอนุมัติ',
  ]
  return [
    'สำรองไฟล์/สร้าง sandbox และเขียน requirement ก่อนแตะงานจริง',
    'ให้ Codex/AI ออกแบบวิธีทำ โครงสร้างข้อมูล และ test cases',
    'พัฒนาแบบ incremental และทดสอบกับข้อมูลตัวอย่างก่อน',
    'เทียบผลกับ manual baseline พร้อมตรวจ error/edge cases',
    'ค่อยนำไปใช้จริง พร้อม rollback และคู่มือผู้ใช้',
  ]
}

function useStoredIds(key: string) {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(window.localStorage.getItem(key) || '[]') }
    catch { return [] }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(ids)) } catch { /* localStorage may be unavailable */ }
  }, [ids, key])
  return [ids, setIds] as const
}

function toggleStoredId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [id, ...ids]
}

function splitValues(raw: string) {
  return raw.split(/[;,/]|\s\+\s/).map((v) => v.trim()).filter((v) => v.length > 1)
}

const starterRoleKeywords: Record<string, string[]> = {
  'Secretary / Admin': ['เลขา', 'ธุรการ', 'admin', 'secretary', 'เอกสาร'],
  'Traffic Engineer': ['จราจร', 'traffic', 'transport', 'vissim', 'sidra', 'synchro'],
  'Highway Engineer': ['ทาง', 'ถนน', 'highway', 'road', 'openroads', 'civil 3d'],
  'Railway Engineer': ['ราง', 'รถไฟ', 'rail', 'openrail', 'track'],
  'Structural / Civil Engineer': ['โครงสร้าง', 'structural', 'civil', 'etabs', 'sap2000'],
  'CAD/BIM/GIS User': ['cad', 'bim', 'gis', 'autocad', 'revit', 'qgis', 'civil 3d'],
  'PM / Project Control': ['บริหารโครงการ', 'project', 'schedule', 'risk', 'wbs', 'control'],
  'Proposal Team': ['proposal', 'tor', 'ข้อเสนอ', 'bid', 'compliance'],
  'MD / BU Head': ['ผู้บริหาร', 'management', 'executive', 'decision', 'commercial'],
  'Power User / Developer': ['โค้ด', 'automation', 'script', 'developer', 'web', 'python'],
}

function pickRoleStartItems(roleStarts: Array<Record<string, string | number>>, useCases: UseCase[], role: string) {
  if (role === 'ทุกคน') {
    return quickWinIds.slice(0, 4).map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item))
  }
  const keywords = starterRoleKeywords[role] ?? []
  return roleStarts
    .filter((row) => String(row.Role) === role)
    .map((row, index) => {
      const item = getUseCase(useCases, String(row['Recommended ID'] ?? ''))
      if (!item) return null
      const hay = `${item.categoryTh} ${item.category} ${item.primaryUsers} ${item.discipline} ${item.title} ${item.software}`.toLocaleLowerCase('th-TH')
      const specific = matchesRole(hay, role) ? 32 : keywords.reduce((score, keyword) => score + (hay.includes(keyword.toLocaleLowerCase('th-TH')) ? 5 : 0), 0)
      const beginner = item.level <= 2 ? 24 : item.level === 3 ? 14 : item.level === 4 ? 5 : 0
      return { item, score: specific + beginner - index * 0.05 }
    })
    .filter((entry): entry is { item: UseCase, score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score || a.item.level - b.item.level || a.item.id.localeCompare(b.item.id))
    .slice(0, 4)
    .map(({ item }) => item)
}

function ideaMomentBucket(value: string) {
  const text = value.toLocaleLowerCase('th-TH')
  if (/ประชุม/.test(text)) return 'ประชุม'
  if (/ตรวจ|qa|review|audit/.test(text)) return 'ตรวจงาน / QA'
  if (/วิเคราะห์|ออกแบบ|analysis|design/.test(text)) return 'วิเคราะห์ / ออกแบบ'
  if (/รายงาน|สื่อสาร|เอกสาร|presentation/.test(text)) return 'รายงาน / สื่อสาร'
  if (/ข้อเสนอ|proposal|tor|bid/.test(text)) return 'ข้อเสนอ / TOR'
  if (/บริหาร|ติดตาม|ประสาน|project/.test(text)) return 'บริหาร / ติดตาม'
  if (/พัฒนา|automation|สร้างเครื่องมือ|ลดงานซ้ำ/.test(text)) return 'พัฒนา / Automate'
  if (/ตัดสินใจ|ผู้บริหาร|decision/.test(text)) return 'ตัดสินใจ / ผู้บริหาร'
  return 'งานประจำวัน / อื่น ๆ'
}

function ideaTimeBucket(value: string) {
  const text = value.toLocaleLowerCase('th-TH')
  if (/workflow|โปรเจกต์|project/.test(text)) return 'Workflow / Project'
  const numbers = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]))
  const upper = numbers.length ? Math.max(...numbers) : 0
  if (upper && upper <= 10) return '≤10 นาที'
  if (upper && upper <= 30) return '10–30 นาที'
  if (upper && upper <= 90) return '30–90 นาที'
  return upper ? '>90 นาที' : 'ไม่ระบุ'
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
  const lower = value.toLowerCase()
  const labels = [lower.includes('chat') ? 'Chat' : '', lower.includes('work') ? 'Work' : '', lower.includes('codex') ? 'Codex' : ''].filter(Boolean)
  const visible = labels.length ? labels : ['Chat']
  return <span className="surface-group">{visible.map((label) => <span key={label} className={`surface-badge surface-${label.toLowerCase()}`}>{label}</span>)}</span>
}

function LevelBadge({ level }: { level: number }) {
  return <span className="level-badge">L{level} · {levelLabels[level] ?? 'Use'}</span>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.7-4.7m2.2-5.8a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
}

function UseCaseCard({ item, onOpen, saved = false, tried = false, onToggleSaved, onToggleTried }: { item: UseCase, onOpen: (item: UseCase) => void, saved?: boolean, tried?: boolean, onToggleSaved?: () => void, onToggleTried?: () => void }) {
  return (
    <article className="usecase-card">
      <button className="usecase-card-main" onClick={() => onOpen(item)}>
        <div className="card-topline">
          <div className="badge-row"><span className="id-chip">{item.id}</span>{item.isNew && <span className="new-badge">NEW</span>}</div>
          <div className="badge-row"><SurfaceBadge value={item.surface} /><LevelBadge level={item.level} /></div>
        </div>
        <h3>{item.title}</h3>
        <div className="card-outcome"><small>ได้อะไร</small><p>{displayOutcome(item)}</p></div>
        <div className="card-meta"><span>{item.categoryTh}</span><span>{item.primaryUsers}</span></div>
        {item.software && item.software !== '-' && <div className="software-line">{item.software}</div>}
      </button>
      {(onToggleSaved || onToggleTried) && <div className="card-quick-actions">
        {onToggleSaved && <button className={saved ? 'active' : ''} onClick={onToggleSaved} aria-label={saved ? `นำ ${item.title} ออกจากรายการเก็บไว้` : `เก็บ ${item.title}`}>{saved ? '★ เก็บแล้ว' : '☆ เก็บไว้'}</button>}
        {onToggleTried && <button className={tried ? 'active' : ''} onClick={onToggleTried} aria-label={tried ? `ยกเลิกสถานะลองแล้วของ ${item.title}` : `ทำเครื่องหมายว่าลอง ${item.title} แล้ว`}>{tried ? '✓ ลองแล้ว' : 'ลองแล้ว?'}</button>}
      </div>}
    </article>
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

function DetailPanel({ item, allUseCases, onClose, onOpen, saved, tried, onToggleSaved, onToggleTried }: { item: UseCase, allUseCases: UseCase[], onClose: () => void, onOpen: (item: UseCase) => void, saved: boolean, tried: boolean, onToggleSaved: () => void, onToggleTried: () => void }) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const related = useMemo(() => getRelatedUseCases(allUseCases, item, 6), [allUseCases, item])
  const variants = useMemo(() => getNearDuplicateVariants(allUseCases, item), [allUseCases, item])

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
          <div className="detail-actions"><button className="share-button primary-action" onClick={copyPrompt}>{copied ? '✓ Prompt copied' : 'Copy prompt'}</button><button className={saved ? 'share-button active-tool' : 'share-button'} onClick={onToggleSaved}>{saved ? '★ เก็บแล้ว' : '☆ เก็บไว้'}</button><button className={tried ? 'share-button active-tool' : 'share-button'} onClick={onToggleTried}>{tried ? '✓ ลองแล้ว' : 'ลองแล้ว?'}</button><button className="share-button" onClick={copyShare}>{shared ? 'Link copied' : 'Share'}</button><button className="icon-button" onClick={onClose} aria-label="ปิด">×</button></div>
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

        <section className="workflow-box"><span>WORKFLOW</span><ol>{workflowSteps(item).map((step, index) => <li key={index}>{step}</li>)}</ol></section>

        <section className="guardrail-box">
          <div className="guardrail-mark">✓</div><div><h3>ก่อนนำผลไปใช้: Human / Engineering Check</h3><p>{item.guardrail}</p></div>
        </section>

        <section className="prompt-box">
          <div className="prompt-head"><div><span className="prompt-label">PROMPT STARTER</span><h3>เริ่มคุยกับ AI แบบนี้</h3></div><button onClick={copyPrompt}>{copied ? 'คัดลอกแล้ว' : 'Copy prompt'}</button></div>
          <pre>{item.promptSeed}</pre>
        </section>

        <details className="technical-notes"><summary>Technical / research notes</summary><div className="detail-grid bottom-grid"><section className="detail-section"><h3>Research basis</h3><p>{item.researchTier}{item.researchNote ? ` · ${item.researchNote}` : ''}</p></section><section className="detail-section"><h3>Depth / Priority</h3><p>{item.depth} · {item.priority}</p></section></div></details>

        {!!item.sources?.length && <section className="source-box"><small>OFFICIAL / PRIMARY SOURCES</small>{item.sources.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>Source {index + 1} ↗</a>)}</section>}

        <div className="tag-list">{splitValues(item.tags).slice(0, 12).map((tag) => <span key={tag}>#{tag.replace(/^#/, '')}</span>)}</div>

        {!!variants.length && <section className="variant-section"><div><small>SIMILAR VARIANTS</small><h3>Use case ที่ใกล้เคียงมาก</h3><p>Atlas รวมรายการที่ซ้ำเชิงงานออกจากผลค้นหาหลัก แต่ยังเปิดดู variant เหล่านี้ได้เมื่อบริบทต่างกัน</p></div><div className="variant-grid">{variants.map((variant) => <button key={variant.id} onClick={() => onOpen(variant)}><span>{variant.id} · L{variant.level}</span><b>{variant.title}</b></button>)}</div></section>}
        {!!related.length && <section className="related-section"><div><small>NEXT USE CASES</small><h3>งานที่ควรทำต่อจากเรื่องนี้</h3></div><div className="related-grid">{related.map((relatedItem) => <button key={relatedItem.id} onClick={() => onOpen(relatedItem)}><span>{relatedItem.id} · L{relatedItem.level}</span><b>{relatedItem.title}</b></button>)}</div></section>}
      </article>
    </div>
  )
}

function IdeaDetailPanel({ idea, linkedUseCase, onClose, onOpenUseCase }: { idea: QuickIdea, linkedUseCase?: UseCase | null, onClose: () => void, onOpenUseCase: (item: UseCase) => void }) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const guide = useMemo(() => getIdeaGuide(idea, linkedUseCase), [idea, linkedUseCase])
  const prompt = useMemo(() => getIdeaPrompt(idea, linkedUseCase), [idea, linkedUseCase])

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const copyShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShared(true)
    window.setTimeout(() => setShared(false), 1600)
  }

  return (
    <div className="detail-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <article className="detail-panel idea-detail-panel" aria-modal="true" role="dialog">
        <div className="detail-sticky">
          <div>
            <div className="detail-kicker"><span className="id-chip">{idea.id}</span><SurfaceBadge value={idea.surface} /><span className="idea-time-badge">{ideaTimeBucket(idea.time)}</span></div>
            <h2>{idea.idea}</h2>
          </div>
          <div className="detail-actions"><button className="share-button primary-action" onClick={copyPrompt}>{copied ? '✓ Prompt copied' : 'Copy prompt'}</button><button className="share-button" onClick={copyShare}>{shared ? 'Link copied' : 'Share'}</button><button className="icon-button" onClick={onClose} aria-label="ปิด">×</button></div>
        </div>

        <section className="idea-detail-lead">
          <small>QUICK IDEA</small>
          <p>แนวทางเริ่มต้นแบบสั้นสำหรับงานจริง กดดูรายละเอียดก่อน แล้วค่อยคัดลอก Prompt เมื่อเข้าใจ input/output และจุดที่ต้องตรวจแล้ว</p>
        </section>

        <div className="idea-fact-grid">
          <section><small>ใช้เมื่อ</small><strong>{idea.moment}</strong></section>
          <section><small>เหมาะกับ</small><strong>{idea.role}</strong></section>
          <section><small>เครื่องมือ</small><strong>{idea.software && idea.software !== 'ตามงาน' ? idea.software : idea.surface}</strong></section>
          <section><small>เวลาเริ่มต้น</small><strong>{idea.time}</strong></section>
        </div>

        <div className="idea-guide-grid">
          <section><small>เตรียมอะไร</small><p>{guide.inputHint}</p></section>
          <section><small>ควรได้อะไร</small><p>{guide.outputHint}</p></section>
        </div>

        <section className="workflow-box"><span>HOW TO TRY</span><ol>{guide.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></section>

        <section className="guardrail-box">
          <div className="guardrail-mark">✓</div><div><h3>ก่อนนำผลไปใช้</h3><p>{guide.guardrail}</p></div>
        </section>

        <section className="prompt-box">
          <div className="prompt-head"><div><span className="prompt-label">PROMPT STARTER</span><h3>{linkedUseCase ? 'Prompt จาก Use Case ที่เชื่อมโยง' : 'Prompt ที่ออกแบบสำหรับไอเดียนี้'}</h3></div><button onClick={copyPrompt}>{copied ? 'คัดลอกแล้ว' : 'Copy prompt'}</button></div>
          <pre>{prompt}</pre>
        </section>

        {linkedUseCase && <section className="idea-linked-case"><div><small>FULL USE CASE · {linkedUseCase.id}</small><h3>{linkedUseCase.title}</h3><p>{displayOutcome(linkedUseCase)}</p></div><button onClick={() => onOpenUseCase(linkedUseCase)}>เปิดรายละเอียด Use Case →</button></section>}
      </article>
    </div>
  )
}

function MiniCaseCard({ item, onOpen, label }: { item: UseCase, onOpen: (item: UseCase) => void, label?: string }) {
  return <button className="mini-case" onClick={() => onOpen(item)}><div><span>{label || `L${item.level} · ${levelLabels[item.level]}`}</span><SurfaceBadge value={item.surface} /></div><h3>{item.title}</h3><p>{displayOutcome(item)}</p></button>
}

function ToolkitSection({ title, subtitle, items, onOpen, savedIds, triedIds, onToggleSaved, onToggleTried }: { title: string, subtitle: string, items: UseCase[], onOpen: (item: UseCase) => void, savedIds: string[], triedIds: string[], onToggleSaved: (id: string) => void, onToggleTried: (id: string) => void }) {
  return <section className="toolkit-section"><div className="section-heading"><div><small>MY AI TOOLKIT</small><h2>{title}</h2><p>{subtitle}</p></div><strong>{items.length}</strong></div>{items.length ? <div className="usecase-grid">{items.map((item) => <UseCaseCard key={item.id} item={item} onOpen={onOpen} saved={savedIds.includes(item.id)} tried={triedIds.includes(item.id)} onToggleSaved={() => onToggleSaved(item.id)} onToggleTried={() => onToggleTried(item.id)} />)}</div> : <div className="empty-state compact"><p>ยังไม่มีรายการในส่วนนี้ ลองเปิด use case แล้วกดเก็บไว้หรือทำเครื่องหมายว่า “ลองแล้ว”</p></div>}</section>
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
  const [initialRoute] = useState(() => parseAtlasRoute(typeof window !== 'undefined' ? window.location.search : ''))
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [quickIdeas, setQuickIdeas] = useState<QuickIdea[]>([])
  const [roleStarts, setRoleStarts] = useState<Array<Record<string, string | number>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState(initialRoute.query)
  const [filters, setFilters] = useState<Filters>(initialRoute.filters)
  const [selected, setSelected] = useState<UseCase | null>(null)
  const [activeTab, setActiveTab] = useState<AtlasTab>(initialRoute.tab)
  const [finderOpen, setFinderOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [toolkitView, setToolkitView] = useState<ToolkitView>(initialRoute.toolkitView)
  const [selectedIdea, setSelectedIdea] = useState<QuickIdea | null>(null)
  const [browseAll, setBrowseAll] = useState(initialRoute.browseAll)
  const [ideaQuery, setIdeaQuery] = useState(initialRoute.ideaQuery)
  const [ideaMoment, setIdeaMoment] = useState(initialRoute.ideaMoment)
  const [ideaTime, setIdeaTime] = useState(initialRoute.ideaTime)
  const [startRole, setStartRole] = useState(initialRoute.startRole)
  const [savedIds, setSavedIds] = useStoredIds('ai-atlas:saved')
  const [triedIds, setTriedIds] = useStoredIds('ai-atlas:tried')
  const [recentIds, setRecentIds] = useStoredIds('ai-atlas:recent')
  const [viewLinkCopied, setViewLinkCopied] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try { window.localStorage.setItem('ai-atlas:theme', theme) } catch { /* localStorage may be unavailable */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#07111f')
  }, [theme])

  useEffect(() => {
    loadAtlasData()
      .then((data) => { setUseCases(data.useCases); setQuickIdeas(data.quickIdeas); setRoleStarts(data.roleStarts) })
      .catch((error) => setLoadError(error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false))
  }, [])

  const results = useMemo(() => searchUseCases(useCases, query, filters), [useCases, query, filters])
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    useCases.forEach((u) => map.set(u.categoryTh, (map.get(u.categoryTh) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'th'))
  }, [useCases])
  const softwarePairs = useMemo(() => topValues(useCases, 'software', 30), [useCases])
  const softwareNames = useMemo(() => softwarePairs.map(([name]) => name), [softwarePairs])
  const roleNames = useMemo(() => getRoleNames(roleStarts), [roleStarts])
  const roles = useMemo(() => roleNames.slice(0, 28).map((role) => [role, useCases.filter((u) => matchesRole(`${u.primaryUsers} ${u.discipline} ${u.categoryTh} ${u.category}`, role)).length] as [string, number]), [roleNames, useCases])
  const surfaces: Array<[string, number]> = [
    ['Chat', useCases.filter((u) => u.surface.toLowerCase().includes('chat')).length],
    ['Work', useCases.filter((u) => u.surface.toLowerCase().includes('work')).length],
    ['Codex', useCases.filter((u) => u.surface.toLowerCase().includes('codex')).length],
  ]

  const ideaMoments = useMemo(() => {
    const counts = new Map<string, number>()
    quickIdeas.forEach((idea) => { const bucket = ideaMomentBucket(idea.moment); counts.set(bucket, (counts.get(bucket) ?? 0) + 1) })
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [quickIdeas])
  const ideaTimes = useMemo(() => {
    const counts = new Map<string, number>()
    quickIdeas.forEach((idea) => { const bucket = ideaTimeBucket(idea.time); counts.set(bucket, (counts.get(bucket) ?? 0) + 1) })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [quickIdeas])
  const visibleIdeas = useMemo(() => {
    const q = ideaQuery.toLocaleLowerCase('th-TH').trim()
    return quickIdeas.filter((idea) => {
      if (ideaMoment && ideaMomentBucket(idea.moment) !== ideaMoment) return false
      if (ideaTime && ideaTimeBucket(idea.time) !== ideaTime) return false
      return !q || `${idea.idea} ${idea.role} ${idea.software} ${idea.category} ${idea.moment}`.toLocaleLowerCase('th-TH').includes(q)
    })
  }, [quickIdeas, ideaQuery, ideaMoment, ideaTime])

  const roleStartItems = useMemo(() => pickRoleStartItems(roleStarts, useCases, startRole), [roleStarts, useCases, startRole])
  const quickWins = useMemo(() => quickWinIds.map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item)), [useCases])
  const savedItems = useMemo(() => savedIds.map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item)), [savedIds, useCases])
  const triedItems = useMemo(() => triedIds.map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item)), [triedIds, useCases])
  const recentItems = useMemo(() => recentIds.map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item)), [recentIds, useCases])
  const hasActiveFilters = Object.values(filters).some(Boolean)
  const searchMode = Boolean(query.trim() || hasActiveFilters)
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const resultLimit = searchMode || browseAll ? 160 : 24
  const toolkitItems = useMemo(() => {
    const ids = toolkitView === 'saved' ? savedIds : toolkitView === 'tried' ? triedIds : toolkitView === 'recent' ? recentIds : [...new Set([...recentIds, ...savedIds, ...triedIds])]
    return ids.map((id) => getUseCase(useCases, id)).filter((item): item is UseCase => Boolean(item))
  }, [toolkitView, savedIds, triedIds, recentIds, useCases])


  const routeSnapshot = (overrides: Partial<AtlasRouteState> = {}): AtlasRouteState => {
    const base: AtlasRouteState = {
      tab: activeTab,
      query,
      filters,
      browseAll,
      ideaQuery,
      ideaMoment,
      ideaTime,
      startRole,
      toolkitView,
      useCaseId: selected?.id ?? '',
      ideaId: selectedIdea?.id ?? '',
    }
    return { ...base, ...overrides, filters: overrides.filters ?? base.filters }
  }

  const writeRoute = (overrides: Partial<AtlasRouteState>, mode: 'push' | 'replace' = 'replace', historyState: Record<string, unknown> = {}) => {
    const nextUrl = buildAtlasUrl(window.location.href, routeSnapshot(overrides))
    if (nextUrl === window.location.href) return
    if (mode === 'push') window.history.pushState(historyState, '', nextUrl)
    else window.history.replaceState(historyState, '', nextUrl)
  }

  useEffect(() => {
    if (!useCases.length || !quickIdeas.length) return
    const applyLocation = () => {
      const route = parseAtlasRoute(window.location.search)
      setActiveTab(route.tab)
      setQuery(route.query)
      setFilters(route.filters)
      setBrowseAll(route.browseAll)
      setIdeaQuery(route.ideaQuery)
      setIdeaMoment(route.ideaMoment)
      setIdeaTime(route.ideaTime)
      setStartRole(route.startRole)
      setToolkitView(route.toolkitView)
      setSelected(route.useCaseId ? getUseCase(useCases, route.useCaseId) ?? null : null)
      setSelectedIdea(route.ideaId ? quickIdeas.find((idea) => idea.id === route.ideaId) ?? null : null)
    }
    applyLocation()
    window.addEventListener('popstate', applyLocation)
    return () => window.removeEventListener('popstate', applyLocation)
  }, [useCases, quickIdeas])

  useEffect(() => {
    if (loading) return
    const nextUrl = buildAtlasUrl(window.location.href, routeSnapshot())
    if (nextUrl !== window.location.href) window.history.replaceState(window.history.state, '', nextUrl)
  }, [loading, activeTab, query, filters, browseAll, ideaQuery, ideaMoment, ideaTime, startRole, toolkitView, selected?.id, selectedIdea?.id])


  const openUseCase = (item: UseCase) => {
    writeRoute({ useCaseId: item.id, ideaId: '' }, selected || selectedIdea ? 'replace' : 'push', { atlasOverlay: true })
    setSelectedIdea(null)
    setSelected(item)
    setRecentIds((ids) => [item.id, ...ids.filter((id) => id !== item.id)].slice(0, 12))
  }
  const toggleSaved = (id: string) => setSavedIds((ids) => toggleStoredId(ids, id))
  const toggleTried = (id: string) => setTriedIds((ids) => toggleStoredId(ids, id))
  const openIdea = (idea: QuickIdea) => {
    writeRoute({ ideaId: idea.id, useCaseId: '', tab: 'ideas' }, selected || selectedIdea ? 'replace' : 'push', { atlasOverlay: true })
    setActiveTab('ideas')
    setSelected(null)
    setSelectedIdea(idea)
  }
  const closeOverlay = () => {
    if (window.history.state?.atlasOverlay) window.history.back()
    else { setSelected(null); setSelectedIdea(null) }
  }
  const changeTab = (tab: AtlasTab) => {
    writeRoute({ tab, useCaseId: '', ideaId: '' }, 'push', { atlasNav: true })
    setSelected(null)
    setSelectedIdea(null)
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const resetHome = () => {
    writeRoute({ tab: 'discover', query: '', filters: emptyFilters, browseAll: false, ideaId: '', useCaseId: '' }, 'push', { atlasNav: true })
    setActiveTab('discover')
    setQuery('')
    setFilters(emptyFilters)
    setBrowseAll(false)
    setSelected(null)
    setSelectedIdea(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const quickSearch = (value: string) => {
    writeRoute({ tab: 'discover', query: value, filters: emptyFilters, browseAll: false, useCaseId: '', ideaId: '' }, 'push', { atlasNav: true })
    setActiveTab('discover')
    setQuery(value)
    setFilters(emptyFilters)
    setBrowseAll(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const applyFinder = (task: string, role: string, software: string, level: string) => {
    const nextFilters = { ...emptyFilters, role, software, level }
    writeRoute({ tab: 'discover', query: task, filters: nextFilters, browseAll: false, useCaseId: '', ideaId: '' }, 'push', { atlasNav: true })
    setActiveTab('discover')
    setQuery(task)
    setFilters(nextFilters)
    setBrowseAll(false)
    setFinderOpen(false)
    window.setTimeout(() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }
  const copyCurrentView = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setViewLinkCopied(true)
    window.setTimeout(() => setViewLinkCopied(false), 1600)
  }

  const overlayOpen = Boolean(selected || selectedIdea || finderOpen || mobileFiltersOpen)
  useEffect(() => {
    if (!overlayOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (mobileFiltersOpen) setMobileFiltersOpen(false)
      else if (finderOpen) setFinderOpen(false)
      else if (selected || selectedIdea) closeOverlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [overlayOpen, mobileFiltersOpen, finderOpen, selected?.id, selectedIdea?.id])

  if (loading) return <div className="loading-screen"><div className="brand-mark">AI</div><h1>Loading AI Use Case Atlas</h1><p>กำลังโหลด use cases และ quick ideas...</p></div>
  if (loadError) return <div className="loading-screen error"><h1>โหลดข้อมูลไม่สำเร็จ</h1><p>{loadError}</p><button onClick={() => window.location.reload()}>ลองใหม่</button></div>

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetHome}>
          <span className="brand-mark">AI</span><span><strong>Use Case Atlas</strong><small>ChatGPT for TR</small></span>
        </button>
        <div className="topbar-actions">
          <nav className="desktop-nav">
            <button className={activeTab === 'discover' ? 'active' : ''} onClick={() => changeTab('discover')}>ค้นหา Use Case</button>
            <button className={activeTab === 'ideas' ? 'active' : ''} onClick={() => changeTab('ideas')}>{quickIdeas.length} Quick Ideas</button>
            <button className={activeTab === 'toolkit' ? 'active' : ''} onClick={() => changeTab('toolkit')}>My Toolkit{savedIds.length ? ` · ${savedIds.length}` : ''}</button>
            <a href="https://github.com/bokoboss/ai-usecase-atlas" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Primary">
        <button className={activeTab === 'discover' ? 'active' : ''} onClick={() => changeTab('discover')}>ค้นหา</button>
        <button className={activeTab === 'ideas' ? 'active' : ''} onClick={() => changeTab('ideas')}>Ideas</button>
        <button className={activeTab === 'toolkit' ? 'active' : ''} onClick={() => changeTab('toolkit')}>Toolkit{savedIds.length ? ` · ${savedIds.length}` : ''}</button>
      </nav>

      {activeTab === 'discover' ? <>
        <main className={searchMode ? 'hero-wrap search-active' : 'hero-wrap'}>
          <div className="eyebrow">{useCases.length} USE CASES · TR BU AI ADOPTION LIBRARY</div>
          <h1>วันนี้คุณกำลังทำงานอะไรอยู่?</h1>
          <p className="hero-copy">บอกงานที่กำลังทำ ปัญหาที่เจอ หรือโปรแกรมที่ใช้ แล้วค้นดูว่า ChatGPT, Work หรือ Codex ช่วยตรงไหนได้บ้าง</p>
          <div className="search-box"><SearchIcon /><input value={query} onChange={(event) => { setQuery(event.target.value); setBrowseAll(false) }} placeholder="เช่น ตรวจรายงานจราจร, ทำ Excel, OpenRoads, VISSIM, เตรียมประชุมให้ MD..." autoFocus />{searchMode && <button className="search-clear" onClick={() => { setQuery(''); setFilters(emptyFilters); setBrowseAll(false) }}>ล้าง</button>}<span>{results.length}</span></div>
          <div className="quick-chips">
            {['งาน Office', 'Traffic', 'Highway / OpenRoads', 'Railway / OpenRail', 'Structure', 'Cost / BOQ', 'CAD / BIM / GIS', 'VISSIM', 'ทำเว็บ / โปรแกรม'].map((value) => <button key={value} onClick={() => quickSearch(value)}>{value}</button>)}
          </div>
          <button className="guided-button" onClick={() => setFinderOpen(true)}>ไม่รู้จะค้นอะไร? ใช้ Guided Finder →</button>
        </main>

        <section className={searchMode ? "start-here content-width search-hidden" : "start-here content-width"}><div className="section-heading"><div><small>01 · START HERE BY ROLE</small><h2>เริ่มจากงานที่ใกล้ตัวคุณที่สุด</h2><p>เลือกบทบาทก่อน Atlas จะจัด 4 จุดเริ่มที่เหมาะกับงานจริงของคุณ โดยไล่จากงานที่ลองได้ง่ายไปสู่งานที่ต่อยอดได้</p></div></div><div className="role-chips">{roleNames.map((role) => <button key={role} className={startRole === role ? 'active' : ''} onClick={() => setStartRole(role)}>{role}</button>)}</div><div className="mini-case-grid">{roleStartItems.map((item, index) => <MiniCaseCard key={item.id} item={item} onOpen={openUseCase} label={`STEP ${index + 1}`} />)}</div></section>

        <section className={searchMode ? "quick-win-section content-width search-hidden" : "quick-win-section content-width"}><div className="section-heading"><div><small>02 · 5-MINUTE QUICK WINS</small><h2>อยากลองทันที เลือกงานเล็กก่อน</h2><p>4 งานที่ใช้เวลาเริ่มต้นน้อย เหมาะสำหรับเห็นประโยชน์จาก AI ก่อนขยับไป workflow ที่ซับซ้อน</p></div><button className="section-action" onClick={() => changeTab('ideas')}>ดู Quick Ideas →</button></div><div className="quick-win-grid">{quickWins.slice(0, 4).map((item) => <MiniCaseCard key={item.id} item={item} onOpen={openUseCase} label="5 นาที" />)}</div></section>

        <section className={searchMode ? "coverage-strip content-width search-hidden" : "coverage-strip content-width"}>
          <div><strong>{useCases.length}</strong><span>Use cases</span></div><div><strong>{quickIdeas.length}</strong><span>Quick ideas</span></div><div><strong>{categories.length}</strong><span>Work categories</span></div><div><button onClick={() => setFinderOpen(true)}>Guided Finder →</button><span>ถ้ายังไม่รู้จะค้นอะไร</span></div>
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
            <button className="mobile-filter-button" onClick={() => setMobileFiltersOpen(true)}>ตัวกรอง{activeFilterCount ? ` · ${activeFilterCount}` : ''}</button>
            <div className="results-head"><div><small>{searchMode ? 'SEARCH RESULTS' : '03 · EXPLORE THE LIBRARY'}</small><h2>{query ? `ผลลัพธ์สำหรับ “${query}”` : browseAll ? 'คลัง Use Case' : 'สำรวจเพิ่มเติมจากคลัง'}</h2></div><div className="results-head-actions"><strong>{results.length} รายการ</strong><button onClick={copyCurrentView}>{viewLinkCopied ? 'คัดลอกลิงก์แล้ว' : 'แชร์หน้านี้'}</button></div></div>
            <p className="results-subnote">{searchMode ? 'ผลลัพธ์เรียงตามความตรงกับคำค้น และรวมรายการที่ซ้ำเชิงงานมากไว้เป็น variant ในหน้ารายละเอียด' : browseAll ? 'กำลังแสดงคลังแบบกว้างขึ้น ใช้ Search หรือ Filter เมื่อต้องการเจาะงานเฉพาะ' : 'เริ่มจาก 24 รายการแนะนำก่อน เพื่อไม่ให้หน้าแรกกลายเป็นรายการยาวเกินไป'}</p>
            <div className="usecase-grid">{results.slice(0, resultLimit).map((item) => <UseCaseCard item={item} onOpen={openUseCase} saved={savedIds.includes(item.id)} tried={triedIds.includes(item.id)} onToggleSaved={() => toggleSaved(item.id)} onToggleTried={() => toggleTried(item.id)} key={item.id} />)}</div>
            {!searchMode && !browseAll && results.length > resultLimit && <div className="browse-more"><div><strong>ต้องการสำรวจทั้งคลัง?</strong><span>เปิดรายการเพิ่ม หรือใช้ Search / Filter เพื่อเจาะงานที่ต้องการ</span></div><button onClick={() => setBrowseAll(true)}>ดู use case เพิ่ม →</button></div>}
            {(searchMode || browseAll) && results.length > resultLimit && <div className="result-note">กำลังแสดง {resultLimit} รายการแรก — ใช้ Search หรือ Filter เพื่อเจาะให้แคบลง</div>}
            {!results.length && <div className="empty-state"><h3>ยังไม่พบ use case ที่ตรง</h3><p>ลองใช้คำสั้นลง เช่น “Excel”, “รายงาน”, “ประชุม”, “OpenRoads”, “Revit”, “VISSIM” หรือกดล้าง filter</p></div>}
          </div>
        </section>
      </> : activeTab === 'ideas' ? <main className="ideas-page content-width">
        <div className="ideas-hero"><div className="eyebrow">{quickIdeas.length} QUICK IDEAS</div><h1>ยังนึกไม่ออกว่าจะใช้ AI ทำอะไร?</h1><p>เริ่มจาก “ช่วงเวลาที่กำลังทำงาน” หรือเวลาที่มี แล้วค่อยเจาะไอเดียที่ตรงกับงานแทนการเลื่อนดูรายการทั้งหมด</p><div className="idea-search"><SearchIcon /><input value={ideaQuery} onChange={(e) => setIdeaQuery(e.target.value)} placeholder="ค้นไอเดีย เช่น งานเลขา, cost, QGIS, VISSIM, report..."/><span>{visibleIdeas.length}</span></div><div className="idea-filter-block"><small>กำลังทำอะไรอยู่?</small><div className="idea-filter-chips"><button className={!ideaMoment ? 'active' : ''} onClick={() => setIdeaMoment('')}>ทั้งหมด</button>{ideaMoments.map(([name, count]) => <button key={name} className={ideaMoment === name ? 'active' : ''} onClick={() => setIdeaMoment(name)}>{name} · {count}</button>)}</div></div><div className="idea-filter-block"><small>มีเวลาประมาณเท่าไร?</small><div className="idea-filter-chips"><button className={!ideaTime ? 'active' : ''} onClick={() => setIdeaTime('')}>ทุกช่วง</button>{ideaTimes.map(([name, count]) => <button key={name} className={ideaTime === name ? 'active' : ''} onClick={() => setIdeaTime(name)}>{name} · {count}</button>)}</div></div></div>
        <div className="ideas-grid">{visibleIdeas.slice(0, 120).map((idea) => <button className={idea.useCaseId === 'Idea Only' ? 'idea-card idea-only' : 'idea-card'} key={idea.id} onClick={() => openIdea(idea)}><span>{idea.id}</span><h3>{idea.idea}</h3><p>{idea.role}</p><div><small>{idea.surface}</small><small>{ideaTimeBucket(idea.time)}</small><small>{idea.useCaseId === 'Idea Only' ? 'QUICK GUIDE →' : `USE CASE ${idea.useCaseId} →`}</small></div></button>)}</div>{visibleIdeas.length > 120 && <div className="result-note">แสดง 120 ไอเดียแรก — เลือกช่วงงาน/เวลา หรือค้นคำเพิ่มเพื่อเจาะให้แคบลง</div>}
      </main> : <main className="toolkit-page content-width"><div className="toolkit-hero"><div className="eyebrow">MY AI TOOLKIT</div><h1>Use cases ที่เป็นของคุณ</h1><p>รายการเดียว ไม่ซ้ำการ์ด — ใช้สถานะ Saved / Tried / Recent เพื่อกลับมาทำงานต่อได้เร็ว</p><div className="toolkit-filter-chips"><button className={toolkitView === 'all' ? 'active' : ''} onClick={() => setToolkitView('all')}>ทั้งหมด</button><button className={toolkitView === 'saved' ? 'active' : ''} onClick={() => setToolkitView('saved')}>★ เก็บไว้ · {savedItems.length}</button><button className={toolkitView === 'tried' ? 'active' : ''} onClick={() => setToolkitView('tried')}>✓ ลองแล้ว · {triedItems.length}</button><button className={toolkitView === 'recent' ? 'active' : ''} onClick={() => setToolkitView('recent')}>ล่าสุด · {recentItems.length}</button></div><p className="toolkit-storage-note">สถานะ Toolkit เก็บใน browser/device นี้เท่านั้น</p></div><ToolkitSection title={toolkitView === 'all' ? 'รายการของคุณ' : toolkitView === 'saved' ? '★ เก็บไว้' : toolkitView === 'tried' ? '✓ ลองแล้ว' : 'ล่าสุด'} subtitle={toolkitView === 'all' ? 'รวมรายการโดยไม่แสดง use case เดียวกันซ้ำหลายส่วน' : 'กรองตามสถานะที่เลือก'} items={toolkitItems} onOpen={openUseCase} savedIds={savedIds} triedIds={triedIds} onToggleSaved={toggleSaved} onToggleTried={toggleTried} /></main>}

      <footer className="site-footer"><div><strong>AI Use Case Atlas</strong><span>TR BU · From “ไม่รู้จะใช้ AI ทำอะไร” → “ลองใช้กับงานจริงวันนี้”</span></div><span>{useCases.length} use cases · {quickIdeas.length} quick ideas</span></footer>
      {selected && <DetailPanel item={selected} allUseCases={useCases} onClose={closeOverlay} onOpen={openUseCase} saved={savedIds.includes(selected.id)} tried={triedIds.includes(selected.id)} onToggleSaved={() => toggleSaved(selected.id)} onToggleTried={() => toggleTried(selected.id)} />}
      {selectedIdea && <IdeaDetailPanel idea={selectedIdea} linkedUseCase={selectedIdea.useCaseId !== 'Idea Only' ? getUseCase(useCases, selectedIdea.useCaseId) : null} onClose={closeOverlay} onOpenUseCase={openUseCase} />}
      {finderOpen && <GuidedFinder roles={roleNames.slice(0, 30)} software={softwareNames} onClose={() => setFinderOpen(false)} onApply={applyFinder} />}
      {mobileFiltersOpen && <div className="mobile-filter-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setMobileFiltersOpen(false) }}><section className="mobile-filter-sheet"><div className="mobile-filter-head"><div><small>FILTER</small><h2>เจาะให้ตรงงาน</h2></div><button className="icon-button" onClick={() => setMobileFiltersOpen(false)}>×</button></div><FilterSelect label="หมวดงาน" value={filters.category} options={categories} onChange={(value) => setFilters((f) => ({ ...f, category: value }))} /><FilterSelect label="บทบาท" value={filters.role} options={roles} onChange={(value) => setFilters((f) => ({ ...f, role: value }))} /><FilterSelect label="Software / Tool" value={filters.software} options={softwarePairs} onChange={(value) => setFilters((f) => ({ ...f, software: value }))} /><FilterSelect label="ChatGPT Surface" value={filters.surface} options={surfaces} onChange={(value) => setFilters((f) => ({ ...f, surface: value }))} /><label className="filter-field"><span>ระดับ</span><select value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}><option value="">ทุกระดับ</option>{[1,2,3,4,5].map((level) => <option value={level} key={level}>L{level} · {levelLabels[level]}</option>)}</select></label><div className="mobile-filter-actions"><button onClick={() => setFilters(emptyFilters)}>ล้างทั้งหมด</button><button className="primary" onClick={() => setMobileFiltersOpen(false)}>ดู {results.length} รายการ</button></div></section></div>}
    </div>
  )
}

export default App