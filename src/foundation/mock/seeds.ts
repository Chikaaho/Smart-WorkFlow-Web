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
    { name: 'relatedRecord', label: '关联单号', type: 'REFERENCE' },
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
