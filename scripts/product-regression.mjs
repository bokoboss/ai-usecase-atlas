import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atlas-product-qa-'))

async function transpile(sourcePath, outputPath) {
  const source = await fs.readFile(path.join(root, sourcePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  await fs.writeFile(path.join(tmpDir, outputPath), compiled, 'utf8')
}

function cleanIdeas(items) {
  const prefix = 'ลองใช้ AI ช่วยขั้น QA/สรุปของงาน:'
  const direct = new Set(items.map((idea) => idea.useCaseId + '::' + idea.idea.trim()))
  return items.filter((idea) => {
    if (!idea.idea.startsWith(prefix)) return true
    return !direct.has(idea.useCaseId + '::' + idea.idea.slice(prefix.length).trim())
  })
}

try {
  await transpile('src/lib/ideaDetail.ts', 'ideaDetail.mjs')
  await transpile('src/lib/urlState.ts', 'urlState.mjs')
  const ideaModule = await import(pathToFileURL(path.join(tmpDir, 'ideaDetail.mjs')).href)
  const routeModule = await import(pathToFileURL(path.join(tmpDir, 'urlState.mjs')).href)

  const rawIdeas = JSON.parse(await fs.readFile(path.join(root, 'public/data/ideas.json'), 'utf8'))
  const useCases = JSON.parse(await fs.readFile(path.join(root, 'public/data/usecases.json'), 'utf8'))
  const useCaseIds = new Set(useCases.map((item) => item.id))
  const ideas = cleanIdeas(rawIdeas)
  const standalone = ideas.filter((idea) => idea.useCaseId === 'Idea Only')
  const linked = ideas.filter((idea) => idea.useCaseId !== 'Idea Only')

  assert.equal(ideas.length, 650, 'UI should expose 650 deduplicated Quick Ideas')
  assert.equal(standalone.length, 50, 'Expected 50 standalone Quick Ideas')
  assert.equal(Object.keys(ideaModule.standaloneGuides).length, 50, 'Every standalone Quick Idea needs an explicit guide')
  for (const idea of standalone) {
    assert.ok(ideaModule.standaloneGuides[idea.id], 'Missing standalone guide: ' + idea.id)
    const guide = ideaModule.getIdeaGuide(idea, null)
    const prompt = ideaModule.getIdeaPrompt(idea, null)
    assert.ok(guide.inputHint && guide.outputHint && guide.guardrail, 'Incomplete guide: ' + idea.id)
    assert.ok(prompt.includes(idea.idea), 'Prompt must contain idea context: ' + idea.id)
    assert.ok(!prompt.includes('นำตัวอย่างงานจริงมาให้ ChatGPT แล้วขอให้ช่วย'), 'Generic legacy prompt leaked: ' + idea.id)
  }
  for (const idea of linked) assert.ok(useCaseIds.has(idea.useCaseId), 'Broken linked Use Case: ' + idea.id + ' -> ' + idea.useCaseId)

  const fullState = {
    tab: 'ideas',
    query: 'VISSIM offset',
    filters: { category: 'วิศวกรรมจราจรและขนส่ง', role: 'Traffic Engineer', software: 'VISSIM', surface: 'Work', level: '4' },
    browseAll: true,
    ideaQuery: 'traffic',
    ideaMoment: 'วิเคราะห์ / ออกแบบ',
    ideaTime: '10–30 นาที',
    startRole: 'Traffic Engineer',
    toolkitView: 'saved',
    useCaseId: 'J05',
    ideaId: 'QI-451',
  }
  const url = routeModule.buildAtlasUrl('https://example.com/ai-usecase-atlas/?utm_source=qa', fullState)
  const parsed = routeModule.parseAtlasRoute(new URL(url).search)
  assert.deepEqual(parsed, fullState, 'URL state should round-trip without loss')
  assert.equal(new URL(url).searchParams.get('utm_source'), 'qa', 'Unknown query params should be preserved')

  const defaults = routeModule.defaultAtlasRoute()
  const cleanUrl = routeModule.buildAtlasUrl('https://example.com/ai-usecase-atlas/?q=old&tab=ideas&uc=A01&utm_source=qa', defaults)
  const cleanParams = new URL(cleanUrl).searchParams
  assert.equal(cleanParams.get('q'), null)
  assert.equal(cleanParams.get('tab'), null)
  assert.equal(cleanParams.get('uc'), null)
  assert.equal(cleanParams.get('utm_source'), 'qa')

  console.log('Product regression: 650 Quick Ideas valid; 50 standalone guides explicit; URL state round-trip passed')
} finally {
  await fs.rm(tmpDir, { recursive: true, force: true })
}
