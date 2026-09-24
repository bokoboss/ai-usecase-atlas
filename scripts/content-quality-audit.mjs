import fs from 'node:fs/promises'

const items = JSON.parse(await fs.readFile('public/data/usecases.json', 'utf8'))
const failures = []
const detailFields = ['painPoint','desiredResult','inputs','integrationPattern','guardrail']
const allTextFields = [...detailFields,'promptSeed','adoptionHook']
const norm = (value) => String(value ?? '').toLocaleLowerCase('th-TH').replace(/\s+/g,' ').trim()

const forbidden = [
  'ผลลัพธ์เฉพาะงานที่ trace กลับ source ได้ พร้อม exception/assumption register',
  'workflow ข้ามหลายเครื่องมือมักพังที่ handoff และ version mismatch มากกว่าที่ความสามารถของเครื่องมือแต่ละตัว',
  'ข้อมูลสำรวจ/แบบผัง/เกณฑ์โครงการที่ตรงกับช่วงเวลาและขอบเขตวิเคราะห์',
  'ไฟล์/ข้อมูลจริงจากทุกขั้น workflow source/version ของแต่ละระบบ owner/acceptance criteria และ fallback/rollback',
  'reproducible run manifest + raw result tables + aggregated kpi + failed-run log',
  'result reconciliation + governing cases + exception/outlier table',
  'cross-tool workflow ที่มี input/output contract, audit trail, qa checkpoints, exceptions และ final deliverable',
]

if (items.length !== 600) failures.push('Expected 600 use cases, got ' + items.length)
if (new Set(items.map((item) => item.id)).size !== 600) failures.push('Use-case IDs are not unique')
if (new Set(items.map((item) => item.title)).size !== 600) failures.push('Use-case titles are not unique')
if (new Set(items.map((item) => item.promptSeed)).size !== 600) failures.push('Prompt starters are not unique')
if (new Set(items.map((item) => item.adoptionHook)).size !== 600) failures.push('Adoption hooks are not unique')

for (const item of items) {
  for (const field of ['title', ...detailFields, 'promptSeed', 'adoptionHook']) {
    if (!String(item[field] ?? '').trim()) failures.push(item.id + ': empty ' + field)
  }
  for (const field of ['painPoint','desiredResult','inputs','guardrail']) {
    if (String(item[field] ?? '').trim().length < 45) failures.push(item.id + ': ' + field + ' is too thin')
  }
  const steps = String(item.integrationPattern ?? '').split(/→|->|›|\n/).map((value) => value.trim()).filter(Boolean)
  if (steps.length < 5) failures.push(item.id + ': workflow has fewer than 5 steps')

  const prompt = String(item.promptSeed ?? '')
  if (!prompt.includes(item.title)) failures.push(item.id + ': prompt missing exact title')
  if (!prompt.includes(item.desiredResult)) failures.push(item.id + ': prompt output not synchronized with desiredResult')
  if (!prompt.includes(item.guardrail)) failures.push(item.id + ': prompt human-check not synchronized with guardrail')

  for (const phrase of forbidden) {
    if (allTextFields.some((field) => norm(item[field]).includes(norm(phrase)))) failures.push(item.id + ': forbidden generic family phrase remains')
  }
  if (/งาน “.+” ต้องเชื่อมข้อมูล\/เกณฑ์หลายจุดและตรวจย้อนกลับได้/i.test(String(item.painPoint ?? ''))) {
    failures.push(item.id + ': legacy title-substitution pain point remains')
  }

  const sw = norm(item.software)
  if (['I','J','K','L'].includes(item.categoryCode) && !(item.sources?.length)) failures.push(item.id + ': software/coding use case missing vendor/primary source')
  if (item.categoryCode === 'F' && /civil 3d|openroads/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': highway software workflow missing vendor source')
  if (item.categoryCode === 'G' && /openrail/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': OpenRail workflow missing vendor source')
  if (item.categoryCode === 'H' && /etabs|sap2000/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': CSI workflow missing vendor source')
  if (item.categoryCode === 'Q' && !(item.sources ?? []).some((url) => url.includes('help.openai.com'))) failures.push(item.id + ': cross-tool workflow missing current OpenAI source')
}

function duplicateGroups(field) {
  const map = new Map()
  for (const item of items) {
    const key = norm(item[field])
    const arr = map.get(key) ?? []
    arr.push(item.id)
    map.set(key, arr)
  }
  return [...map.values()].filter((ids) => ids.length > 1).sort((a,b) => b.length-a.length)
}

const summary = {}
for (const field of detailFields) {
  const groups = duplicateGroups(field)
  const maxGroup = groups[0]?.length ?? 1
  summary[field] = { unique: new Set(items.map((item) => norm(item[field]))).size, duplicateGroups: groups.length, maxGroup }
  const limit = field === 'desiredResult' || field === 'integrationPattern' || field === 'guardrail' ? 2 : 4
  if (maxGroup > limit) failures.push(field + ': exact duplicate family too large (' + maxGroup + ', limit ' + limit + ')')
}

const fingerprints = new Map()
for (const item of items) {
  const key = detailFields.map((field) => norm(item[field])).join(' || ')
  const arr = fingerprints.get(key) ?? []
  arr.push(item.id)
  fingerprints.set(key, arr)
}
const duplicateFingerprints = [...fingerprints.values()].filter((ids) => ids.length > 1)
if (duplicateFingerprints.length) failures.push('Fully duplicated detail records remain: ' + duplicateFingerprints.map((ids) => ids.join(',')).join(' | '))

const nearDuplicateWatch = [
  ['B23','B38'], ['E05','E25'], ['E40','E51'], ['F04','F14'], ['H02','H24'],
  ['E29','E50'], ['G02','G13'], ['I05','I24'], ['J08','J31'], ['K05','K19'],
  ['L02','L10'], ['M09','M28'], ['O06','O13'],
  ['C05','C14'], ['E01','E17'], ['P04','P14'], ['P14','P20'], ['N04','N17'], ['N08','N24'], ['F05','F17']
]
const byId = new Map(items.map((item) => [item.id, item]))
for (const [aId,bId] of nearDuplicateWatch) {
  const a = byId.get(aId), b = byId.get(bId)
  if (!a || !b) { failures.push('Near-duplicate watch item missing: ' + aId + '/' + bId); continue }
  if (norm(a.desiredResult) === norm(b.desiredResult)) failures.push(aId + '/' + bId + ': watched pair has identical desiredResult')
  if (norm(a.integrationPattern) === norm(b.integrationPattern)) failures.push(aId + '/' + bId + ': watched pair has identical workflow')
}

const sourceStats = Object.fromEntries(
  [...new Set(items.map((item) => item.categoryCode))].sort().map((code) => {
    const group = items.filter((item) => item.categoryCode === code)
    return [code, { total: group.length, withSources: group.filter((item) => item.sources?.length).length }]
  })
)

console.log(JSON.stringify({
  phase: '5-final',
  total: items.length,
  detailQuality: summary,
  sourceStats,
  nearDuplicateWatch: nearDuplicateWatch.length,
}, null, 2))

if (failures.length) {
  console.error('Content quality failures:')
  for (const failure of failures) console.error('- ' + failure)
  process.exitCode = 1
} else {
  console.log('Content quality Phase 5 full-corpus gate: PASS')
}
