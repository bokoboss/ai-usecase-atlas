import fs from 'node:fs/promises'

const items = JSON.parse(await fs.readFile('public/data/usecases.json', 'utf8'))
const targetCategories = new Set(['E','F','G','H','Q'])
const scoped = items.filter((item) => targetCategories.has(item.categoryCode))
const forbidden = [
  'ผลลัพธ์เฉพาะงานที่ trace กลับ source ได้ พร้อม exception/assumption register',
  'workflow ข้ามหลายเครื่องมือมักพังที่ handoff และ version mismatch มากกว่าที่ความสามารถของเครื่องมือแต่ละตัว',
  'ข้อมูลสำรวจ/แบบผัง/เกณฑ์โครงการที่ตรงกับช่วงเวลาและขอบเขตวิเคราะห์',
  'ไฟล์/ข้อมูลจริงจากทุกขั้น workflow source/version ของแต่ละระบบ owner/acceptance criteria และ fallback/rollback',
]
const fields = ['painPoint','desiredResult','inputs','integrationPattern','guardrail','promptSeed']
const failures = []

if (items.length !== 600) failures.push('Expected 600 use cases, got ' + items.length)
if (scoped.length !== 188) failures.push('Expected 188 Phase 5A cases, got ' + scoped.length)
if (new Set(items.map((item) => item.id)).size !== 600) failures.push('Use-case IDs are not unique')

for (const item of scoped) {
  for (const phrase of forbidden) {
    if (fields.some((field) => String(item[field] ?? '').includes(phrase))) failures.push(item.id + ': forbidden generic phrase remains')
  }
  const steps = String(item.integrationPattern ?? '').split(/→|->|›|\n/).map((value) => value.trim()).filter(Boolean)
  if (steps.length < 5) failures.push(item.id + ': workflow has fewer than 5 steps')
  if (!String(item.promptSeed ?? '').includes(item.title)) failures.push(item.id + ': prompt does not contain exact title')
  if (!String(item.promptSeed ?? '').includes(item.desiredResult)) failures.push(item.id + ': prompt output is not synchronized with desiredResult')
  if (!String(item.promptSeed ?? '').includes(item.guardrail)) failures.push(item.id + ': prompt guardrail is not synchronized')
  for (const field of ['painPoint','desiredResult','inputs','guardrail']) {
    if (String(item[field] ?? '').trim().length < 45) failures.push(item.id + ': ' + field + ' is too thin')
  }
  const sw = String(item.software ?? '').toLowerCase()
  if (item.categoryCode === 'F' && /civil 3d|openroads/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': missing highway tool source')
  if (item.categoryCode === 'G' && /openrail/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': missing OpenRail source')
  if (item.categoryCode === 'H' && /etabs|sap2000/.test(sw) && !(item.sources?.length)) failures.push(item.id + ': missing CSI source')
  if (item.categoryCode === 'Q' && !(item.sources ?? []).some((url) => url.includes('help.openai.com'))) failures.push(item.id + ': missing current OpenAI source')
}

function duplicateGroups(field) {
  const map = new Map()
  for (const item of scoped) {
    const key = String(item[field] ?? '').toLocaleLowerCase('th-TH').replace(/\s+/g,' ').trim()
    const arr = map.get(key) ?? []
    arr.push(item.id)
    map.set(key, arr)
  }
  return [...map.values()].filter((ids) => ids.length > 1).sort((a,b) => b.length-a.length)
}
const crossCategoryDupes = []
for (const field of ['painPoint','desiredResult','inputs','integrationPattern','guardrail']) {
  const valueToItems = new Map()
  for (const item of scoped) {
    const key = String(item[field] ?? '').toLocaleLowerCase('th-TH').replace(/\s+/g,' ').trim()
    const arr = valueToItems.get(key) ?? []
    arr.push(item)
    valueToItems.set(key, arr)
  }
  for (const arr of valueToItems.values()) {
    if (arr.length > 1 && new Set(arr.map((item) => item.categoryCode)).size > 1) {
      crossCategoryDupes.push(field + ': ' + arr.map((item) => item.id).join(','))
    }
  }
}
if (crossCategoryDupes.length) failures.push('Cross-category exact duplicates remain: ' + crossCategoryDupes.join(' | '))

const summary = Object.fromEntries(['painPoint','desiredResult','inputs','integrationPattern','guardrail'].map((field) => {
  const groups = duplicateGroups(field)
  return [field, { duplicateGroups: groups.length, maxGroup: groups[0]?.length ?? 1 }]
}))
console.log(JSON.stringify({ phase:'5A', scoped: scoped.length, summary }, null, 2))

if (failures.length) {
  console.error('Content quality failures:')
  for (const failure of failures) console.error('- ' + failure)
  process.exitCode = 1
} else {
  console.log('Content quality Phase 5A: PASS')
}
