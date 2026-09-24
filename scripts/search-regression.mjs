import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atlas-search-qa-'))

async function transpile(sourcePath, outputPath, rewrite = (value) => value) {
  const source = await fs.readFile(path.join(root, sourcePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  await fs.writeFile(path.join(tmpDir, outputPath), rewrite(compiled), 'utf8')
}

const cases = [
  ['สรุปประชุม', ['C03','C13']],
  ['เขียนหนังสือถึงหน่วยงาน', ['C11','C02']],
  ['เขียนจดหมายถึงบริษัท', ['C11','C02']],
  ['ตรวจรายงาน', ['B34','G20']],
  ['ทำ PowerPoint จากรายงาน', ['B05','B38','B22']],
  ['สรุปเอกสารให้ MD', ['O10','B04','O05']],
  ['ทำ Excel สรุป MM', ['O13']],
  ['เทียบ revision เอกสาร', ['B03','B33']],
  ['วิเคราะห์ traffic count', ['E17','E22']],
  ['ตรวจรายงานจราจร', ['E11','E12']],
  ['หา peak hour', ['E18','E01']],
  ['VISSIM offset', ['J05','J23']],
  ['VISSIM calibration', ['J07','J21','J22']],
  ['เปรียบเทียบ signal timing', ['J24','E57','E13']],
  ['วิเคราะห์ queue ทางแยก', ['E06','J15']],
  ['วิเคราะห์ travel time', ['E05','E25','J14']],
  ['ทำ TIA', ['E12','E37']],
  ['OpenRoads drainage', ['F38','F28']],
  ['ตรวจ sight distance', ['F17','F05','F42']],
  ['คำนวณ earthwork', ['F06','F24','F37']],
  ['ตรวจ cross section', ['F10','F35']],
  ['ทำ BOQ ถนน', ['F40','F31','F25']],
  ['road safety audit', ['F08','F29','E42']],
  ['OpenRail alignment', ['G02','G13']],
  ['rail interface matrix', ['G05','G09','G33']],
  ['ตรวจ station access', ['G10']],
  ['railway risk register', ['M04','M19']],
  ['ตรวจโครงสร้าง', ['H06','H24','H05','H01']],
  ['ตรวจ rebar quantity', ['H31','H16']],
  ['ETABS result check', ['H23','H24']],
  ['QGIS QA', ['I50','I47','I33']],
  ['AutoCAD layer check', ['I02','I38','I14']],
  ['Revit clash', ['I28','I44','I45']],
  ['Civil 3D label style', ['I05','I24']],
  ['ตรวจ BOQ', ['F25','H05']],
  ['ถอดปริมาณ Bluebeam', ['I52']],
  ['ทำ cost estimate', ['E39','M07','I52']],
  ['อ่าน TOR ทำ proposal', ['N09','N01','N05','N02']],
  ['ตรวจ proposal', ['N12','N02']],
  ['จับ CV กับ TOR', ['N04','N26']],
]

try {
  await transpile('src/lib/content.ts', 'content.mjs')
  await transpile('src/lib/search.ts', 'search.mjs', (compiled) =>
    compiled.replace(/from ['"]\.\/content['"]/g, "from './content.mjs'")
  )

  const { searchUseCases } = await import(pathToFileURL(path.join(tmpDir, 'search.mjs')).href)
  const useCases = JSON.parse(await fs.readFile(path.join(root, 'public/data/usecases.json'), 'utf8'))
  const filters = { category: '', role: '', software: '', surface: '', level: '' }
  const failures = []

  for (const [query, expected] of cases) {
    const top3 = searchUseCases(useCases, query, filters).slice(0, 3).map((item) => item.id)
    if (!expected.some((id) => top3.includes(id))) failures.push({ query, expected, top3 })
  }

  if (failures.length) {
    console.error('Search regression failures:')
    for (const failure of failures) console.error(JSON.stringify(failure))
    console.error(`Search regression: ${cases.length - failures.length}/${cases.length} passed`)
    process.exitCode = 1
  } else {
    console.log(`Search regression: ${cases.length}/${cases.length} passed`)
  }
} finally {
  await fs.rm(tmpDir, { recursive: true, force: true })
}
