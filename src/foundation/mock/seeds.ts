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
  permissions: ['system:view', 'form:view', 'form:form:view', 'workflow:view', 'notify:view'],
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
    component: null,
    icon: 'Share',
    sort: 3,
    menuType: 0,
    permission: 'workflow:view',
    hidden: false,
    children: [
      {
        id: '30',
        parentId: '3',
        name: 'todo-list',
        title: '我的待办',
        path: 'workflow/todo',
        component: 'workflow/views/TodoList',
        icon: 'List',
        sort: 1,
        menuType: 1,
        permission: 'workflow:view',
        hidden: false,
      },
      {
        id: '31',
        parentId: '3',
        name: 'process-def-list',
        title: '流程定义',
        path: 'workflow/defs',
        component: 'workflow/views/ProcessDefList',
        icon: 'Document',
        sort: 2,
        menuType: 1,
        permission: 'workflow:view',
        hidden: false,
      },
    ],
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

// ─── 待办任务 Mock 种子 ──────────────────────────────
export const MOCK_TODO_TASKS: Array<{
  taskId: string
  processInstanceId: string
  formKey: string
  businessKey: string
  createTime: string
}> = [
  {
    taskId: 'mock-task-001',
    processInstanceId: 'mock-proc-001',
    formKey: 'leave-request',
    businessKey: 'fd_001',
    createTime: '2026-07-10T09:15:00',
  },
  {
    taskId: 'mock-task-002',
    processInstanceId: 'mock-proc-002',
    formKey: 'purchase-order',
    businessKey: 'fd_003',
    createTime: '2026-07-11T14:30:00',
  },
  {
    taskId: 'mock-task-003',
    processInstanceId: 'mock-proc-003',
    formKey: 'contract-approval',
    businessKey: 'fd_005',
    createTime: '2026-07-12T10:00:00',
  },
  {
    taskId: 'mock-task-004',
    processInstanceId: 'mock-proc-004',
    formKey: 'expense-report',
    businessKey: 'gen_001',
    createTime: '2026-07-13T08:45:00',
  },
  {
    taskId: 'mock-task-005',
    processInstanceId: 'mock-proc-005',
    formKey: 'leave-request',
    businessKey: 'gen_002',
    createTime: '2026-07-14T11:20:00',
  },
]

// ─── 流程定义 Mock 种子 ──────────────────────────────
export const MOCK_PROCESS_DEFS: Array<{
  id: number
  processKey: string
  name: string
  formKey: string
  defVersion: number
  status: 'DRAFT' | 'PUBLISHED'
  createTime: string
  updateTime: string
}> = [
  {
    id: 1,
    processKey: 'skeleton_approval',
    name: '单节点审批流程',
    formKey: 'it_application',
    defVersion: 1,
    status: 'PUBLISHED',
    createTime: '2026-07-05 10:00:00',
    updateTime: '2026-07-05 10:00:00',
  },
  {
    id: 2,
    processKey: 'leave_approval',
    name: '请假审批流程',
    formKey: 'leave-request',
    defVersion: 1,
    status: 'PUBLISHED',
    createTime: '2026-07-08 14:20:00',
    updateTime: '2026-07-09 09:10:00',
  },
  {
    id: 3,
    processKey: 'contract_approval',
    name: '合同审批流程',
    formKey: 'contract-approval',
    defVersion: 1,
    status: 'PUBLISHED',
    createTime: '2026-07-06 16:30:00',
    updateTime: '2026-07-10 11:00:00',
  },
  {
    id: 4,
    processKey: 'purchase_draft',
    name: '采购审批（草稿）',
    formKey: 'purchase-order',
    defVersion: 1,
    status: 'DRAFT',
    createTime: '2026-07-12 08:00:00',
    updateTime: '2026-07-12 08:00:00',
  },
  {
    id: 5,
    processKey: 'expense_approval',
    name: '费用报销流程',
    formKey: 'expense-report',
    defVersion: 1,
    status: 'PUBLISHED',
    createTime: '2026-07-09 13:45:00',
    updateTime: '2026-07-11 15:30:00',
  },
]

// ─── 通知消息 Mock 种子 ──────────────────────────────
export const MOCK_NOTIFY_MESSAGES: Array<{
  id: number
  recipientId: number
  title: string
  content: string
  bizType: 'WF_TODO' | 'WF_APPROVED'
  bizId: string | null
  read: boolean
  createTime: string
  createBy: number | null
  updateTime: string
  updateBy: number | null
  tenantId: number
}> = [
  {
    id: 1,
    recipientId: 1,
    title: '新待办任务：请假申请审批',
    content: '张三提交了请假申请，等待您审批。请假日期：2026-07-10，共2天。',
    bizType: 'WF_TODO',
    bizId: 'mock-task-001',
    read: false,
    createTime: '2026-07-15T09:00:00',
    createBy: null,
    updateTime: '2026-07-15T09:00:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 2,
    recipientId: 1,
    title: '审批结果：采购订单已通过',
    content: '您提交的采购订单已通过审批，请查看详情。',
    bizType: 'WF_APPROVED',
    bizId: 'mock-task-002',
    read: false,
    createTime: '2026-07-14T16:30:00',
    createBy: null,
    updateTime: '2026-07-14T16:30:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 3,
    recipientId: 1,
    title: '新待办任务：合同审批流程',
    content: '李四提交了合同审批申请，请尽快处理。合同编号：CT-2026-0712。',
    bizType: 'WF_TODO',
    bizId: 'mock-task-003',
    read: false,
    createTime: '2026-07-14T10:15:00',
    createBy: null,
    updateTime: '2026-07-14T10:15:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 4,
    recipientId: 1,
    title: '会议通知：项目复盘会',
    content: '项目复盘会定于7月16日14:00在3楼会议室召开，请准时参加。',
    bizType: 'WF_TODO',
    bizId: null,
    read: true,
    createTime: '2026-07-13T08:00:00',
    createBy: null,
    updateTime: '2026-07-13T08:00:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 5,
    recipientId: 1,
    title: '审批结果：费用报销已驳回',
    content: '您提交的费用报销单因缺少发票附件被驳回，请补充后重新提交。',
    bizType: 'WF_APPROVED',
    bizId: 'mock-task-004',
    read: true,
    createTime: '2026-07-12T15:45:00',
    createBy: null,
    updateTime: '2026-07-12T15:45:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 6,
    recipientId: 1,
    title: '新待办任务：差旅报销审批',
    content: '王五提交了差旅报销申请，金额3,200元，请审批。',
    bizType: 'WF_TODO',
    bizId: 'mock-task-005',
    read: true,
    createTime: '2026-07-11T11:20:00',
    createBy: null,
    updateTime: '2026-07-11T11:20:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 7,
    recipientId: 1,
    title: '系统通知：密码即将过期',
    content: '您的登录密码将于7天后过期，请及时修改密码以保障账户安全。',
    bizType: 'WF_TODO',
    bizId: null,
    read: false,
    createTime: '2026-07-10T09:00:00',
    createBy: null,
    updateTime: '2026-07-10T09:00:00',
    updateBy: null,
    tenantId: 1,
  },
  {
    id: 8,
    recipientId: 1,
    title: '审批结果：请假申请已通过',
    content: '您提交的请假申请（2026-07-10）已通过审批，请合理安排工作。',
    bizType: 'WF_APPROVED',
    bizId: 'fd_001',
    read: true,
    createTime: '2026-07-10T08:30:00',
    createBy: null,
    updateTime: '2026-07-10T08:30:00',
    updateBy: null,
    tenantId: 1,
  },
]
