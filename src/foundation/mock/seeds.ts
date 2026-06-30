/**
 * Mock 种子数据 —— 共享常量，供 handlers.ts 多 handler 引用同一份假数据源。
 *
 * 本文件存放跨 handler 复用的假数据（字典选项、表单定义、提交记录等），
 * 各 handler 只 import 所需常量，避免内联重复。
 */

/** 用户种子（登录/会话放行用） */
export const MOCK_USERS = [
  { username: 'admin', displayName: '管理员', password: 'admin123' },
  { username: 'user', displayName: '普通用户', password: 'user123' },
]

/** mock GET /system/auth/me 响应。 */
export const MOCK_SESSION_DATA = {
  user: {
    id: '1',
    username: 'admin',
    displayName: '管理员',
    deptId: '101',
    tenantId: '1',
    avatar: null,
  },
  permissions: ['system:view', 'form:view', 'form:form:view', 'workflow:view'],
  roles: ['admin'],
  superAdmin: true,
}

/** mock GET /system/auth/menus 菜单树，与交付体一致。 */
export const MOCK_MENU_TREE = [
  {
    id: '1',
    parentId: null,
    name: 'system',
    title: '系统管理',
    path: 'system',
    component: null,
    icon: 'Setting',
    sort: 1,
    menuType: 0,
    permission: 'system:view',
    hidden: false,
    children: [
      {
        id: '10',
        parentId: '1',
        name: 'dict',
        title: '字典管理',
        path: 'system/dict',
        component: 'system/views/DictTypeList',
        icon: 'Collection',
        sort: 1,
        menuType: 1,
        permission: 'system:dict:view',
        hidden: false,
      },
    ],
  },
  {
    id: '2',
    parentId: null,
    name: 'form-designer',
    title: '表单设计器',
    path: 'form/designer',
    component: 'form/views/FormDesigner',
    icon: 'EditPen',
    sort: 2,
    menuType: 1,
    permission: 'form:design:view',
  },
  {
    id: '3',
    parentId: null,
    name: 'workflow',
    title: '流程引擎',
    path: 'workflow',
    component: 'workflow/views/WorkflowHome',
    icon: 'Share',
    sort: 3,
    menuType: 1,
    permission: 'workflow:view',
  },
  {
    id: '4',
    parentId: null,
    name: 'notify',
    title: '通知',
    path: 'notify',
    component: 'notify/views/NotifyHome',
    icon: 'Bell',
    sort: 4,
    menuType: 1,
    permission: 'notify:view',
  },
  {
    id: '5',
    parentId: null,
    name: 'agent',
    title: '智能体',
    path: 'agent',
    component: 'agent/views/AgentHome',
    icon: 'MagicStick',
    sort: 5,
    menuType: 1,
    permission: 'agent:view',
  },
  {
    id: '6',
    parentId: null,
    name: 'iot',
    title: '物联网',
    path: 'iot',
    component: 'iot/views/IotHome',
    icon: 'Cpu',
    sort: 6,
    menuType: 1,
    permission: 'iot:view',
  },
  {
    id: '7',
    parentId: null,
    name: 'openapi',
    title: '开放接口',
    path: 'openapi',
    component: 'openapi/views/OpenapiHome',
    icon: 'Connection',
    sort: 7,
    menuType: 1,
    permission: 'openapi:view',
  },
  {
    id: '8',
    parentId: null,
    name: 'form-def-list',
    title: '表单管理',
    path: 'form/form-def-list',
    component: 'form/views/FormDefList',
    icon: 'Document',
    sort: 8,
    menuType: 1,
    permission: 'form:view',
  },
]

/** 示例字典种子：value 字段名 code（对齐 {@link DictItemDTO}）。 */
export const MOCK_DICT_DATA: Record<string, { label: string; code: string }[]> = {
  sex: [
    { label: '男', code: 'MALE' },
    { label: '女', code: 'FEMALE' },
  ],
  status: [
    { label: '待审批', code: 'PENDING' },
    { label: '已通过', code: 'APPROVED' },
    { label: '已驳回', code: 'REJECTED' },
  ],
  dept: [
    { label: '技术部', code: 'TECH' },
    { label: '产品部', code: 'PRODUCT' },
    { label: '设计部', code: 'DESIGN' },
    { label: '人事部', code: 'HR' },
  ],
  leave_type: [
    { label: '事假', code: 'PERSONAL' },
    { label: '病假', code: 'SICK' },
    { label: '年假', code: 'ANNUAL' },
    { label: '调休', code: 'COMPENSATORY' },
    { label: '婚假', code: 'MARRIAGE' },
  ],
}

/**
 * 示例字典类型清单种子（对齐后端 SysDictType 子集：code/name）。
 * 供表单设计器 DICT 字段「绑定字典」下拉的 mock 验收使用；code 与 MOCK_DICT_DATA 的键对齐。
 */
export const MOCK_DICT_TYPES: { code: string; name: string }[] = [
  { code: 'sex', name: '性别' },
  { code: 'status', name: '审批状态' },
  { code: 'dept', name: '部门' },
  { code: 'leave_type', name: '请假类型' },
]

// ─── 演示表单「demo-form」定义 ──────────────────────────────

/** 固定 formKey，仅供验收使用。 */
export const DEMO_FORM_KEY = 'demo-form'

/**
 * 后端裸 definition JSON 对象（非 serialized）。
 * 与 foundation/mock 解耦：此数据经 index.ts handler 做 JSON.stringify 后返回，
 * 再由 form service → parseDefinition 解析为 FormSchema。
 */
export const MOCK_DEMO_FORM_DEFINITION = {
  title: '请假申请单',
  fields: [
    { name: 'applicant', label: '申请人', type: 'TEXT', required: true },
    { name: 'department', label: '部门', type: 'DICT', required: true, dictType: 'dept' },
    { name: 'leaveType', label: '请假类型', type: 'DICT', required: true, dictType: 'leave_type' },
    { name: 'leaveDate', label: '请假日期', type: 'DATE', required: true },
    { name: 'days', label: '天数', type: 'NUMBER', required: true },
    { name: 'urgent', label: '是否加急', type: 'BOOL' },
    { name: 'reason', label: '事由', type: 'RICH_TEXT' },
    { name: 'relatedRecord', label: '关联单号', type: 'REFERENCE', targetFormId: 'demo-form' },
    {
      name: 'attachments',
      label: '附件',
      type: 'TABLE',
      subFields: [
        { name: 'fileName', type: 'TEXT' },
        { name: 'fileSize', type: 'TEXT' },
        { name: 'fileType', type: 'TEXT' },
      ],
    },
  ],
}

/** demo-form 假提交记录列表（与字段定义对应）。 */
export const MOCK_DEMO_SUBMISSIONS = [
  {
    id: 'rec_001',
    applicant: '张三',
    department: 'TECH',
    leaveType: 'SICK',
    leaveDate: '2026-06-20',
    days: 2,
    urgent: false,
    reason: '感冒发烧，需要休息',
    attachments: JSON.stringify([{ fileName: '诊断书.jpg', fileSize: '2.3MB', fileType: '图片' }]),
  },
  {
    id: 'rec_002',
    applicant: '李四',
    department: 'PRODUCT',
    leaveType: 'ANNUAL',
    leaveDate: '2026-06-21',
    days: 5,
    urgent: true,
    reason: '年假出游，已安排工作交接',
    attachments: JSON.stringify([]),
  },
  {
    id: 'rec_003',
    applicant: '王五',
    department: 'DESIGN',
    leaveType: 'PERSONAL',
    leaveDate: '2026-06-25',
    days: 1,
    urgent: false,
    reason: '家里有事需要处理',
    attachments: JSON.stringify([
      { fileName: '申请说明.docx', fileSize: '0.5MB', fileType: '文档' },
    ]),
  },
  {
    id: 'rec_004',
    applicant: '赵六',
    department: 'TECH',
    leaveType: 'COMPENSATORY',
    leaveDate: '2026-06-28',
    days: 0.5,
    urgent: false,
    reason: '调休半天',
    attachments: JSON.stringify([]),
  },
  {
    id: 'rec_005',
    applicant: '陈七',
    department: 'HR',
    leaveType: 'MARRIAGE',
    leaveDate: '2026-07-01',
    days: 15,
    urgent: false,
    reason: '婚假申请',
    attachments: JSON.stringify([
      { fileName: '结婚证.jpg', fileSize: '3.1MB', fileType: '图片' },
      { fileName: '请假申请单.pdf', fileSize: '1.2MB', fileType: '文档' },
    ]),
  },
]

/**
 * 表单数据查询 mock 记录（与 MOCK_DEMO_FORM_DEFINITION 字段对齐）。
 * 每个 record 包含 id + create_time + 所有业务列 + ref 列。
 * 临时数据，上线后由后端真实数据替换。
 */
export const MOCK_FORM_DATA_RECORDS: Record<string, unknown>[] = [
  {
    id: 'fd_001',
    version: 1,
    applicant: '张三',
    department: 'TECH',
    leaveType: 'SICK',
    leaveDate: '2026-06-20',
    days: 2,
    urgent: 1,
    reason: '感冒发烧，需要休息',
    ref_relatedRecord_id: null,
    attachments: JSON.stringify([{ fileName: '诊断书.jpg', fileSize: '2.3MB', fileType: '图片' }]),
    create_time: '2026-06-20 08:30:00',
  },
  {
    id: 'fd_002',
    version: 1,
    applicant: '李四',
    department: 'PRODUCT',
    leaveType: 'ANNUAL',
    leaveDate: '2026-06-21',
    days: 5,
    urgent: 0,
    reason: '年假出游，已安排工作交接',
    ref_relatedRecord_id: null,
    attachments: JSON.stringify([]),
    create_time: '2026-06-21 09:15:00',
  },
  {
    id: 'fd_003',
    version: 1,
    applicant: '王五',
    department: 'DESIGN',
    leaveType: 'PERSONAL',
    leaveDate: '2026-06-25',
    days: 1,
    urgent: 0,
    reason: '家里有事需要处理',
    ref_relatedRecord_id: null,
    attachments: JSON.stringify([
      { fileName: '申请说明.docx', fileSize: '0.5MB', fileType: '文档' },
    ]),
    create_time: '2026-06-25 10:00:00',
  },
  {
    id: 'fd_004',
    version: 1,
    applicant: '赵六',
    department: 'TECH',
    leaveType: 'COMPENSATORY',
    leaveDate: '2026-06-28',
    days: 0.5,
    urgent: 0,
    reason: '调休半天',
    ref_relatedRecord_id: null,
    attachments: JSON.stringify([]),
    create_time: '2026-06-28 14:20:00',
  },
  {
    id: 'fd_005',
    version: 1,
    applicant: '陈七',
    department: 'HR',
    leaveType: 'MARRIAGE',
    leaveDate: '2026-07-01',
    days: 15,
    urgent: 1,
    reason: '婚假申请',
    ref_relatedRecord_id: null,
    attachments: JSON.stringify([
      { fileName: '结婚证.jpg', fileSize: '3.1MB', fileType: '图片' },
      { fileName: '请假申请单.pdf', fileSize: '1.2MB', fileType: '文档' },
    ]),
    create_time: '2026-07-01 07:45:00',
  },
]

/**
 * 通用表单假记录（对齐 handlers.ts 中 generic definition 的字段）。
 * 供 REFERENCE 选择器在目标表单非 demo-form 时也有数据可展示。
 * 字段：id, name(TEXT), department(DICT dept), date(DATE), amount(NUMBER),
 *       remark(RICH_TEXT), create_time。
 * 临时数据，上线后由后端真实数据替换。
 */
export const MOCK_GENERIC_FORM_RECORDS: Record<string, unknown>[] = [
  {
    id: 'gen_001',
    version: 1,
    name: '张三',
    department: 'TECH',
    date: '2026-06-20',
    amount: 1500,
    remark: '通用记录一，用于测试关联选择器',
    create_time: '2026-06-20 08:30:00',
  },
  {
    id: 'gen_002',
    version: 1,
    name: '李四',
    department: 'PRODUCT',
    date: '2026-06-21',
    amount: 3200,
    remark: '通用记录二，用于测试关联选择器',
    create_time: '2026-06-21 09:15:00',
  },
  {
    id: 'gen_003',
    version: 1,
    name: '王五',
    department: 'DESIGN',
    date: '2026-06-22',
    amount: 800,
    remark: '通用记录三，用于测试关联选择器',
    create_time: '2026-06-22 10:00:00',
  },
]

/**
 * Mock 表单定义草稿存储（内存，供 form-def mock handlers 读写）。
 *
 * 新建草稿 → createFormDef 在此插入一条；存 definition → saveFormConfig 在此更新；
 * 取 definition → getFormDefinitionById 在此读取；发布 → publishFormDef 在此更新状态。
 * 临时数据，后端真实端点就绪后下线。
 */
export const MOCK_FORM_DEF_STORE: Map<
  string,
  {
    id: string
    formKey: string
    name: string
    status: 'DRAFT' | 'PUBLISHED'
    definition: string
  }
> = new Map()

// ─── MOCK_FORM_DEF_STORE 种子数据 ───────────────────────────
// 临时数据，对齐分页接口 handler 的响应形状预期。
// 与第四刀 create handler 共用同一 store：设计器新建的草稿自动出现在列表。
// 种子包含 DRAFT + PUBLISHED 各至少一条，供列表页验收状态标签色。

export const MOCK_FORM_DEF_SEEDS: Array<{
  id: string
  formKey: string
  name: string
  status: 'DRAFT' | 'PUBLISHED'
  definition: string
}> = [
  {
    id: 'seed-def-001',
    formKey: 'leave-request',
    name: '请假申请单',
    status: 'PUBLISHED',
    definition: JSON.stringify(MOCK_DEMO_FORM_DEFINITION),
  },
  {
    id: 'seed-def-002',
    formKey: 'expense-report',
    name: '费用报销单',
    status: 'DRAFT',
    definition: JSON.stringify({ title: '费用报销单', fields: [] }),
  },
  {
    id: 'seed-def-003',
    formKey: 'purchase-order',
    name: '采购订单',
    status: 'PUBLISHED',
    definition: JSON.stringify({ title: '采购订单', fields: [] }),
  },
  {
    id: 'seed-def-004',
    formKey: 'travel-reimbursement',
    name: '差旅报销',
    status: 'DRAFT',
    definition: JSON.stringify({ title: '差旅报销', fields: [] }),
  },
  {
    id: 'seed-def-005',
    formKey: 'contract-approval',
    name: '合同审批',
    status: 'PUBLISHED',
    definition: JSON.stringify({ title: '合同审批', fields: [] }),
  },
]

function initFormDefStore(): void {
  if (MOCK_FORM_DEF_STORE.size === 0) {
    for (const seed of MOCK_FORM_DEF_SEEDS) {
      MOCK_FORM_DEF_STORE.set(seed.id, seed)
    }
  }
}
initFormDefStore()
