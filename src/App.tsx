import { useMemo, useState } from 'react'
import { useCases } from './data/usecases'
import type { UseCase } from './types'

const levelName: Record<number,string> = {1:'Ask',2:'Assist',3:'Produce',4:'Workflow',5:'Build & Automate'}
const norm = (v: string) => v.toLocaleLowerCase('th-TH')
const matches = (item: UseCase, query: string) => {
  if (!query.trim()) return true
  const q = norm(query.trim())
  return norm([item.title,item.painPoint,item.desiredResult,item.users,item.software,item.category,item.tags,item.moment].join(' ')).includes(q)
}

function Badge({children}:{children:React.ReactNode}) { return <span className="badge">{children}</span> }

function Card({item,onOpen}:{item:UseCase,onOpen:(u:UseCase)=>void}) {
  return <button className="card" onClick={()=>onOpen(item)}>
    <div className="cardTop"><Badge>{item.id}</Badge><div><Badge>{item.surface}</Badge><Badge>L{item.level}</Badge></div></div>
    <h3>{item.title}</h3>
    <p>{item.desiredResult}</p>
    <div className="meta">{item.category} · {item.users}</div>
    {item.software && <div className="software">{item.software}</div>}
  </button>
}

function Drawer({item,onClose}:{item:UseCase,onClose:()=>void}) {
  const [copied,setCopied]=useState(false)
  const copy=async()=>{await navigator.clipboard.writeText(item.prompt);setCopied(true);setTimeout(()=>setCopied(false),1200)}
  return <div className="backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <article className="drawer">
      <header><div><div className="badges"><Badge>{item.id}</Badge><Badge>{item.surface}</Badge><Badge>L{item.level} · {levelName[item.level]}</Badge></div><h2>{item.title}</h2></div><button className="close" onClick={onClose}>×</button></header>
      <div className="pair"><section><small>PAIN POINT</small><p>{item.painPoint}</p></section><section><small>ผลลัพธ์ที่ต้องการ</small><p>{item.desiredResult}</p></section></div>
      <div className="detailGrid">
        <section><h4>เหมาะกับ</h4><p>{item.users}</p></section>
        <section><h4>ใช้เมื่อ</h4><p>{item.moment}</p></section>
        <section><h4>เครื่องมือ</h4><p>{item.surface}{item.software ? ' · '+item.software : ''}</p></section>
        <section><h4>ระดับ</h4><p>L{item.level} · {levelName[item.level]}</p></section>
      </div>
      <section className="prompt"><div><span>PROMPT STARTER</span><button onClick={copy}>{copied?'คัดลอกแล้ว':'Copy prompt'}</button></div><pre>{item.prompt}</pre></section>
      <section className="check"><b>Human / Engineering Check</b><p>{item.guardrail}</p></section>
      <div className="tags">{item.tags.split(',').map(t=><span key={t}>#{t.trim()}</span>)}</div>
    </article>
  </div>
}

export default function App(){
  const [q,setQ]=useState('')
  const [role,setRole]=useState('')
  const [software,setSoftware]=useState('')
  const [level,setLevel]=useState('')
  const [selected,setSelected]=useState<UseCase|null>(null)

  const roles=[...new Set(useCases.flatMap(u=>u.users.split('/').map(x=>x.trim())))].filter(Boolean)
  const softwareOptions=[...new Set(useCases.flatMap(u=>u.software.split('/').map(x=>x.trim())))].filter(Boolean)

  const results=useMemo(()=>useCases.filter(u=>
    matches(u,q) &&
    (!role || norm(u.users).includes(norm(role))) &&
    (!software || norm(u.software).includes(norm(software))) &&
    (!level || String(u.level)===level)
  ),[q,role,software,level])

  return <div className="app">
    <nav className="nav"><div className="brand"><span>AI</span><div><b>Use Case Atlas</b><small>ChatGPT for TR</small></div></div><a href="https://github.com/bokoboss/ai-usecase-atlas">GitHub</a></nav>
    <main>
      <section className="hero">
        <div className="eyebrow">TR BU AI ADOPTION LIBRARY</div>
        <h1>วันนี้คุณกำลังทำงานอะไรอยู่?</h1>
        <p>เริ่มจากงาน ไม่ต้องเริ่มจากการจำว่า Chat, Work หรือ Codex ต่างกันอย่างไร</p>
        <div className="search"><span>⌕</span><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="เช่น ตรวจรายงานจราจร, ทำ Excel, VISSIM, เตรียมข้อมูลให้ MD..." /><b>{results.length}</b></div>
        <div className="chips">{['Excel','VISSIM','Civil 3D','รายงาน','TOR','เว็บ'].map(x=><button onClick={()=>setQ(x)} key={x}>{x}</button>)}</div>
      </section>

      <section className="entry">
        <div><span>01</span><h3>เริ่มจากงาน</h3><p>พิมพ์สิ่งที่กำลังทำด้วยภาษาปกติ</p></div>
        <div><span>02</span><h3>เริ่มจากบทบาท</h3><p>PM, Engineer, Secretary, Senior, MD</p></div>
        <div><span>03</span><h3>เริ่มจากโปรแกรม</h3><p>Excel, AutoCAD, Civil 3D, Revit, VISSIM</p></div>
      </section>

      <section className="library">
        <aside>
          <div className="filterHead"><div><small>FILTER</small><h2>เจาะให้ตรงงาน</h2></div><button onClick={()=>{setRole('');setSoftware('');setLevel('')}}>ล้าง</button></div>
          <label>บทบาท<select value={role} onChange={e=>setRole(e.target.value)}><option value="">ทั้งหมด</option>{roles.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Software / Tool<select value={software} onChange={e=>setSoftware(e.target.value)}><option value="">ทั้งหมด</option>{softwareOptions.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>ระดับ<select value={level} onChange={e=>setLevel(e.target.value)}><option value="">ทั้งหมด</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>L{x} · {levelName[x]}</option>)}</select></label>
          <div className="guide"><b>LEVEL GUIDE</b><p>L1 ถามตอบ · L2 ให้ไฟล์ช่วยงาน · L3 สร้าง deliverable · L4 workflow · L5 build/automate</p></div>
        </aside>
        <div className="results"><div className="resultHead"><div><small>USE CASE LIBRARY</small><h2>{q ? 'ผลลัพธ์สำหรับ “'+q+'”' : 'Use cases ที่แนะนำ'}</h2></div><b>{results.length} รายการ</b></div>
          <div className="grid">{results.map(u=><Card item={u} onOpen={setSelected} key={u.id}/>)}</div>
          {!results.length&&<div className="empty">ยังไม่พบรายการ ลองใช้คำสั้นลงหรือกดล้าง filter</div>}
        </div>
      </section>
    </main>
    <footer><div><b>AI Use Case Atlas</b><span>จาก “ไม่รู้จะใช้ AI ทำอะไร” → “ลองใช้กับงานจริงวันนี้”</span></div><span>MVP architecture · full 450-case import next</span></footer>
    {selected&&<Drawer item={selected} onClose={()=>setSelected(null)}/>}
  </div>
}
