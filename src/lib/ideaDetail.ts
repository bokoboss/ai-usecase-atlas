import type { QuickIdea, UseCase } from '../types'

export type IdeaGuide = {
  inputHint: string
  outputHint: string
  guardrail: string
  steps: string[]
}

type StandaloneGuide = [inputHint: string, outputHint: string, guardrail: string]

const standaloneGuides: Record<string, StandaloneGuide> = {
  'QI-451': ['ภาพ whiteboard ที่เห็นข้อความชัดที่สุด พร้อมวันประชุม/บริบทถ้ามี', 'Action List ตาราง: Action | Owner | Due date | Decision/Issue | หมายเหตุ', 'ข้อความ ชื่อ หรือวันที่ที่อ่านไม่ชัดต้องระบุว่า “อ่านไม่ชัด/ต้องยืนยัน” ห้ามเดา'],
  'QI-452': ['รูปตารางจากหน้างาน โดยถ่ายตรงและให้เห็นหัวตาราง/หน่วยครบ', 'ตารางแถว-คอลัมน์พร้อมวาง Excel และรายการ cell ที่อ่านไม่ชัด', 'รักษาหน่วย จุดทศนิยม และลำดับแถวเดิม ถ้าอ่านไม่ได้ให้ทำเครื่องหมายแทนการเดา'],
  'QI-453': ['เนื้อหาอีเมลหรือ bullet หลัก พร้อมผู้รับและระดับความเป็นทางการ', 'หัวข้ออีเมล 5 ตัวเลือก เรียงจากตรงประเด็นที่สุด พร้อมระบุโทน', 'อย่าใส่ deadline/เลขอ้างอิง/คำเร่งด่วนที่ไม่มีในเนื้อหา'],
  'QI-454': ['รายละเอียดนัดประชุม ผู้ส่ง ผู้รับ และข้อมูลที่ต้องยืนยัน', 'ข้อความตอบรับประชุมแบบสุภาพ 2–3 ระดับความเป็นทางการ', 'ห้ามยืนยันเวลา สถานที่ หรือผู้เข้าร่วมที่ยังไม่ทราบ'],
  'QI-455': ['รายงานฉบับเต็มและวัตถุประสงค์การประชุมของ MD', '5 bullet สำหรับผู้บริหาร: สถานะ | ประเด็นสำคัญ | ผลกระทบ | การตัดสินใจที่ต้องการ | next step', 'ทุก bullet ต้อง trace กลับเนื้อหาในรายงานได้ และแยก fact ออกจากข้อเสนอ'],
  'QI-456': ['รายงานฉบับเต็มหรือ section ที่ต้องตรวจ พร้อมรายการคำย่อถ้ามี', 'ตารางคำย่อ: รูปเต็ม | รูปย่อ | จุดที่ใช้ไม่สม่ำเสมอ | คำแนะนำแก้ไข', 'ไม่เปลี่ยนคำศัพท์เทคนิคเองโดยไม่มีหลักฐานจากเอกสารหรือ glossary โครงการ'],
  'QI-457': ['deliverable list/TOR/submission requirement และรายการไฟล์ที่มีอยู่', 'Submission checklist: Required | File found | Version | Owner | Missing/Issue', 'แยก “ไม่พบไฟล์” ออกจาก “ไม่มีข้อกำหนด” และอย่าอนุมานว่าไฟล์ครบเพียงจากชื่อ'],
  'QI-458': ['รูป/กราฟ พร้อม paragraph หรือ section ที่รูปนั้นอ้างอิง', 'ชื่อรูปและ caption 3 แบบ: technical, concise, report-ready', 'caption ต้องอธิบายสิ่งที่รูปแสดงจริง ไม่เติมข้อสรุปเกินข้อมูล'],
  'QI-459': ['comment ลูกค้าพร้อม source/page/discipline ถ้ามี', 'Checklist การแก้ไข: Comment | Required action | Owner | Evidence to close | Status', 'อย่าตีความ comment ที่กำกวมเป็นข้อกำหนดใหม่ ให้ flag เพื่อ clarification'],
  'QI-460': ['ข้อความ LINE/อีเมล/Minutes พร้อมวันที่และชื่อผู้พูดเท่าที่มี', 'Master Action List ที่ deduplicate แล้ว: Action | Owner | Due | Source | Status', 'รายการที่คล้ายกันแต่ยังไม่แน่ใจว่าเรื่องเดียวกันให้ mark “possible duplicate” ไม่รวมอัตโนมัติ'],
  'QI-461': ['scope/TOR/site information และวัตถุประสงค์ของ site visit', 'คำถาม site visit แบ่งตามหัวข้อ พร้อมเหตุผลว่าคำตอบจะใช้ตัดสินใจอะไร', 'เน้นคำถามที่ตรวจสอบได้ในพื้นที่และแยกสิ่งที่ต้องขอเอกสารภายหลัง'],
  'QI-462': ['site photos หลายรูปพร้อมลำดับ/ตำแหน่ง/เวลา ถ้ามี', 'Photo observation log: Photo | Observation | Possible issue | Follow-up needed', 'อธิบายเฉพาะสิ่งที่มองเห็น และใช้คำว่า “อาจ” เมื่อเป็นการตีความ ห้ามสรุปสาเหตุจากรูปอย่างเดียว'],
  'QI-463': ['scope, TOR, proposal หรือ kickoff notes', 'Data Request List: ข้อมูล | เหตุผลที่ต้องใช้ | Format | Owner | Due | Dependency', 'แยกข้อมูลจำเป็นต่อ critical path ออกจากข้อมูลที่เพียงช่วยเพิ่มความละเอียด'],
  'QI-464': ['ตาราง manpower ที่มีชื่อคน เดือน และ MM ต่อโครงการ/งาน', 'Exception table ของคนที่รวม MM > 1.0 ต่อเดือน พร้อมยอดรวมและแหล่งแถว', 'คำนวณรวมตาม person-month จริง ตรวจชื่อซ้ำ/สะกดต่างก่อนสรุป'],
  'QI-465': ['BOQ และชุดแบบ/รายการแบบที่จะตรวจ', 'Drawing QA checklist ที่ map BOQ item → drawing evidence → issue', 'BOQ ไม่ใช่หลักฐานว่าแบบมีครบ ต้องตรวจ drawing/source จริงก่อนปิด checklist'],
  'QI-466': ['calculation note และ design basis/criteria ที่เกี่ยวข้อง', 'Assumption register: Assumption | Value | Source | Sensitivity | Needs confirmation', 'แยกค่าที่เอกสารระบุจริงออกจากค่าที่อนุมาน และ flag assumption ที่กระทบผลมาก'],
  'QI-467': ['เอกสารหลักของโครงการ ตัวอย่างรายงาน/TOR/แบบ และคำศัพท์ที่ทีมใช้', 'Glossary ไทย–อังกฤษ พร้อม preferred term, abbreviation และตัวอย่างบริบท', 'อย่าแปลชื่อมาตรฐาน หน่วยงาน หรือศัพท์เฉพาะโดยเดา ให้คงต้นฉบับเมื่อไม่แน่ใจ'],
  'QI-468': ['ข้อเท็จจริง timeline, cause, affected activities, correspondence และ contract clause ถ้ามี', 'ร่างเหตุผลขอขยายเวลาที่เรียง chronology → cause → impact → request', 'ห้ามสร้าง entitlement หรืออ้าง clause ที่ไม่มีหลักฐาน และแยก fact จาก argument'],
  'QI-469': ['TOR/addendum และประเด็นที่ทีมไม่ชัดเจน', 'Clarification questions ตาราง: TOR clause | Ambiguity | Question | Why it matters | Risk if unanswered', 'คำถามต้องเป็นกลาง ไม่ชี้นำ และอ้าง clause/page ให้ตรวจย้อนกลับได้'],
  'QI-470': ['CV ของผู้สมัครและ TOR requirement ของตำแหน่ง', 'Comparison table: Requirement | Candidate A/B/... | Evidence | Gap | Verification needed', 'นับเฉพาะประสบการณ์ที่มีหลักฐานใน CV และห้ามเติมปี/บทบาทจากการคาดเดา'],
  'QI-471': ['กราฟแต่ละหน้าและประเด็นที่ presentation ต้องสื่อ', 'Slide headline แบบ message-led 2–3 ตัวเลือกต่อกราฟ', 'headline ต้องสอดคล้องกับข้อมูลในกราฟและไม่กล่าว causal claim ถ้ากราฟรองรับแค่ correlation'],
  'QI-472': ['ตารางข้อมูล ตัวแปร หน่วย และคำถามที่ต้องการตอบ', 'แนะนำกราฟ 2–3 แบบ พร้อมเหตุผล แกนที่ควรใช้ และสิ่งที่ไม่ควรทำ', 'เลือกกราฟจากชนิดข้อมูลและคำถาม ไม่ใช่จากความสวยงาม และเตือนกรณี scale ทำให้เข้าใจผิด'],
  'QI-473': ['ช่วงวันที่ ปฏิทินวันหยุด และ definition ของ working day', 'สูตร Excel พร้อมตัวอย่างและ test cases สำหรับวันทำงาน/วันหยุด', 'ระบุ locale/date format ให้ชัดและทดสอบ weekend, holiday ซ้อน weekend และวันขอบช่วง'],
  'QI-474': ['file naming convention และรายการไฟล์ที่จะส่ง', 'ตาราง PASS/FAIL รายไฟล์ พร้อม rule ที่ผิดและชื่อที่แนะนำ', 'อย่า rename ไฟล์จริงอัตโนมัติจนกว่าจะยืนยัน rule และ backup'],
  'QI-475': ['drawing register requirement และรายการ drawing/file ที่มีจริง', 'Missing drawing list พร้อม discipline, expected number/title และ evidence', 'แยก missing จริงจาก drawing ที่เปลี่ยนเลข/รวม sheet และต้องตรวจ revision ล่าสุด'],
  'QI-476': ['ชื่อไฟล์หลาย version พร้อม modified date ถ้ามี', 'Revision history: file family | revision | date | sequence anomaly | duplicate', 'อย่าใช้ modified date เป็น revision date โดยอัตโนมัติถ้า naming convention ให้ข้อมูลต่างกัน'],
  'QI-477': ['ตัวอย่าง log/file names และ pattern ที่ต้องหา/ไม่ต้องหา', 'Regex 1–3 แบบ พร้อมคำอธิบาย capture group และ test strings', 'ต้อง escape ตัวอักษรพิเศษและทดสอบ false positive/false negative ก่อนใช้ batch'],
  'QI-478': ['ตัวอย่าง stationing เช่น 12+345.67 และรูปแบบที่พบทั้งหมด', 'กฎแปลง stationing ↔ numeric พร้อมสูตร/โค้ดและ test cases', 'กำหนดหน่วยและรูปแบบ stationing ชัดเจนก่อนแปลง และรักษาค่าทศนิยม'],
  'QI-479': ['รายการปัญหา/observation ที่พบและ workflow การติดตามของทีม', 'Issue log template พร้อม field, status, priority, owner, due, evidence to close', 'field ต้องพอสำหรับ traceability แต่ไม่เพิ่มภาระกรอกที่ไม่ใช้ตัดสินใจ'],
  'QI-480': ['มาตรฐาน 2 ฉบับและหัวข้อ/ข้อกำหนดที่ต้องการเทียบ', 'Comparison matrix เฉพาะหัวข้อ: clause | Standard A | Standard B | difference | implication', 'อ้าง clause/page ของแต่ละมาตรฐานและห้ามสรุปว่าอันใด “เข้มกว่า” ถ้าเกณฑ์เทียบต่างกัน'],
  'QI-481': ['กราฟ/ตารางและคำอธิบายภาษาไทยที่ถูกต้องเชิงเทคนิค', 'คำอธิบายกราฟภาษาอังกฤษแบบ report-ready 2 ระดับ: concise และ detailed', 'รักษาค่าตัวเลข หน่วย ชื่อ scenario และไม่เติม causal interpretation ที่ข้อมูลไม่ได้พิสูจน์'],
  'QI-482': ['executive summary และผลวิเคราะห์/ตาราง/ข้อสรุปหลักของรายงาน', 'Consistency check: statement | supporting evidence | mismatch | proposed correction', 'ทุกข้อความเชิงตัวเลข/ข้อสรุปใน executive summary ต้อง trace ไปผลวิเคราะห์จริง'],
  'QI-483': ['รายการงานค้าง ไฟล์ ตำแหน่งจัดเก็บ contact และ deadline', 'Handover checklist แบ่ง Today / This week / Watch / Reference', 'ไม่ใส่ password หรือ secret ลง checklist และแยกสิ่งที่ต้องส่งมอบจากสิ่งที่เป็นข้อมูลประกอบ'],
  'QI-484': ['scope, team structure, folder/link, key standards, workflow และ current status', 'Onboarding note 1–2 หน้า: context | people | files | workflow | first-week tasks | pitfalls', 'ลิงก์และชื่อเจ้าของข้อมูลต้องตรวจว่ายังใช้งานได้ก่อนส่งสมาชิกใหม่'],
  'QI-485': ['ขั้นตอน routine ปัจจุบัน ตัวอย่าง input/output และ pain point', 'SOP 1 หน้า: Trigger | Input | Steps | Decision | Output | QA | Owner', 'อย่าตัดขั้นตอนควบคุมคุณภาพออกเพียงเพราะดูซ้ำ และระบุ exception path'],
  'QI-486': ['SOP/workflow ปัจจุบัน พร้อม volume, frequency และจุดที่ใช้ judgement', 'รายการ automation candidates จัดอันดับ effort/benefit/risk พร้อม stop rule', 'อย่า automate ขั้นตอนที่ต้องใช้วิจารณญาณ/approval โดยไม่กำหนด human checkpoint'],
  'QI-487': ['requirements ของโปรแกรม, user roles และ critical workflows', 'Acceptance test cases: scenario | steps | expected result | pass/fail | evidence', 'ครอบคลุม happy path, invalid input, permission, export และ failure/recovery'],
  'QI-488': ['schema/dashboard metric definitions และช่วงค่าที่สมจริง', 'mock dataset ที่ครอบคลุม normal, missing, zero, duplicate, outlier และ boundary cases', 'mock data ต้องติดป้ายว่า synthetic และห้ามทำให้ดูเหมือนข้อมูลลูกค้าจริง'],
  'QI-489': ['สูตร/calculator rules, allowed range และตัวอย่าง known answers', 'edge-case test matrix: input | expected | reason | severity', 'รวม zero, negative, boundary, unit mismatch, blank, very large/small และ rounding'],
  'QI-490': ['สูตรโปรแกรม input/output ตัวอย่าง และวิธี hand calculation ที่ยอมรับ', 'reconciliation table ระหว่าง software result กับ hand calculation พร้อม tolerance', 'ตรวจหน่วย สูตร intermediate และ tolerance ก่อนสรุปว่าโปรแกรมถูก/ผิด'],
  'QI-491': ['field list, data type, allowed range, dependency และ business rules', 'data validation rules พร้อม error message และตัวอย่าง valid/invalid', 'validation ต้องไม่ reject กรณีถูกต้องที่อยู่นอก sample เดิม และต้องกำหนด handling ของ blank/null'],
  'QI-492': ['ชื่อ field, สิ่งที่ผู้ใช้มักสับสน และตัวอย่างค่าที่ถูกต้อง', 'tooltip/helper text สั้น ชัด และตัวอย่าง placeholder สำหรับแต่ละ field', 'อย่าใส่ instruction สำคัญไว้ใน tooltip อย่างเดียว และหลีกเลี่ยงศัพท์เทคนิคที่ผู้ใช้ไม่จำเป็นต้องรู้'],
  'QI-493': ['ชุดคำถามซ้ำและคำตอบที่ทีมยืนยันแล้ว', 'FAQ จัดกลุ่มหัวข้อ พร้อมคำตอบสั้นและ link/source สำหรับรายละเอียด', 'คำตอบที่ขึ้นกับโครงการ/วันที่ต้องระบุ scope และ owner ที่ควรติดต่อ'],
  'QI-494': ['เหตุการณ์ milestone: plan, actual, issue, decision, outcome', 'Lessons learned: What happened | Why | Keep | Change | Action for next milestone', 'หลีกเลี่ยง blame บุคคล ใช้ evidence และแยก observation จาก root cause ที่ยังไม่ยืนยัน'],
  'QI-495': ['บริบท milestone/team และประเด็นที่อยากเรียนรู้', 'คำถาม retrospective แบ่ง Start / Stop / Continue / Risk / Experiment', 'คำถามควรเปิดพื้นที่ให้ตอบได้อย่างปลอดภัยและเน้น process มากกว่าบุคคล'],
  'QI-496': ['comment ลูกค้าพร้อม source/page และ discipline list ของโครงการ', 'ตาราง comment ที่จัด discipline + confidence + owner suggestion', 'comment ที่ข้ามหลาย discipline ให้ติดหลาย tag หรือ flag coordination แทนการบังคับเลือกหนึ่งหมวด'],
  'QI-497': ['action tracker ที่มี owner, due, status และ effort/priority ถ้ามี', 'work queue รายคน: overdue | due soon | blocked | next actions', 'อย่าสรุป workload จากจำนวน action อย่างเดียวถ้า effort ต่างกันมาก ให้แสดงข้อจำกัด'],
  'QI-498': ['deadline, impact, dependency, effort และงานค้างของสัปดาห์', 'Weekly priorities 3 ระดับ: Must / Should / Could พร้อมเหตุผลและ first action', 'deadline ไม่ควรเป็นเกณฑ์เดียว ต้องคำนึง impact, dependency และ commitment'],
  'QI-499': ['action/issue tracker ล่าสุด', 'รายการ open item ที่ owner ว่างหรือ owner ไม่ชัด พร้อม source row', 'แยก owner ว่างจาก owner ที่ชื่อสะกดต่าง และห้าม assign คนให้เอง'],
  'QI-500': ['คำอธิบายปัญหา ข้อจำกัด เป้าหมาย และเกณฑ์ตัดสินใจ', '3 ทางเลือกที่แตกต่างจริง พร้อม pros, cons, risk, assumption และข้อมูลที่ต้องหาเพิ่ม', 'อย่าฟันธงว่าทางเลือกใดดีที่สุดถ้าเกณฑ์/น้ำหนักยังไม่ชัด และแสดง trade-off ตรงไปตรงมา'],
}

const genericStandalone: StandaloneGuide = [
  'ตัวอย่างงานจริง ข้อมูลต้นทาง และข้อจำกัดที่เกี่ยวข้อง',
  'ผลลัพธ์ที่พร้อมนำไปตรวจ/ปรับต่อ โดยระบุ assumption และจุดที่ยังต้องยืนยัน',
  'ห้ามเดาข้อมูลที่ไม่มีใน source และต้องแยกข้อเท็จจริงออกจากข้อเสนอแนะ',
]

function standaloneGuide(idea: QuickIdea): IdeaGuide {
  const [inputHint, outputHint, guardrail] = standaloneGuides[idea.id] ?? genericStandalone
  return {
    inputHint,
    outputHint,
    guardrail,
    steps: [
      'ให้บริบท เป้าหมาย และข้อมูลต้นทางที่เกี่ยวข้องกับงานนี้',
      'ให้ AI สกัด/จัดโครงข้อมูลก่อน แล้วระบุสิ่งที่ขาดหรือไม่ชัดเจน',
      `ให้ AI ทำงานหลักตามโจทย์: ${idea.idea}`,
      'ตรวจผลกับ source จริง แก้ exception แล้วค่อยนำไปใช้หรือส่งต่อ',
    ],
  }
}

function linkedGuide(idea: QuickIdea, item: UseCase): IdeaGuide {
  const raw = (item.integrationPattern || '').trim()
  const steps = raw && raw.length > 18 && !/^ai[- ]assisted$/i.test(raw)
    ? raw.split(/→|->|›|\n/).map((step) => step.trim()).filter(Boolean)
    : [
        `เตรียม input: ${item.inputs || 'ข้อมูล/ไฟล์ที่เกี่ยวข้อง'}`,
        `ให้ AI ช่วยตาม Quick Idea: ${idea.idea}`,
        'ตรวจความครบถ้วน ตัวเลข หน่วย และสมมติฐานเทียบ source',
        'ปรับผลให้อยู่ในรูปแบบ deliverable ที่ทีมใช้งานจริง',
      ]
  return {
    inputHint: item.inputs || 'ข้อมูล/ไฟล์ที่เกี่ยวข้อง',
    outputHint: item.desiredResult || item.adoptionHook || 'ผลลัพธ์ที่พร้อมตรวจและนำไปใช้ต่อ',
    guardrail: item.guardrail || 'ตรวจผลกับ source และให้ผู้รับผิดชอบยืนยันก่อนใช้งานจริง',
    steps,
  }
}

export function getIdeaGuide(idea: QuickIdea, linkedUseCase?: UseCase | null): IdeaGuide {
  return linkedUseCase ? linkedGuide(idea, linkedUseCase) : standaloneGuide(idea)
}

export function getIdeaPrompt(idea: QuickIdea, linkedUseCase?: UseCase | null) {
  if (linkedUseCase?.promptSeed) return linkedUseCase.promptSeed
  const guide = standaloneGuide(idea)
  return [
    `ฉันกำลังทำงานนี้: ${idea.idea}`,
    `บริบทการใช้งาน: ${idea.moment} · ผู้ใช้หลัก: ${idea.role}`,
    '',
    `Input ที่ฉันจะให้: ${guide.inputHint}`,
    '',
    'ช่วยทำตามขั้นตอนนี้:',
    '1. ตรวจ input ก่อนว่ามีข้อมูลอะไรขาด/อ่านไม่ชัด/กำกวม แล้วบอกฉันก่อนถ้าจำเป็นต้องถามเพิ่ม',
    `2. ทำผลลัพธ์ในรูปแบบนี้: ${guide.outputHint}`,
    '3. ระบุ assumption, exception และรายการที่ต้องให้มนุษย์ยืนยันแยกต่างหาก',
    '',
    `ข้อควรระวัง: ${guide.guardrail}`,
    'อย่าแต่งข้อมูล ตัวเลข ชื่อ วันที่ หรือข้อกำหนดที่ไม่มีใน source.',
  ].join('\n')
}
