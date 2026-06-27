/**
 * Mock handler 注册数据 —— 导出纯数据（无副作用的 handler 定义），
 * 由 foundation/mock/index 在 registry 初始化后集中注册。
 *
 * ## 扩展指南
 * 按以下样板追加 handler，modules/* 与各 service 层零改动：
 *
 * ```ts
 * export const mockRegistrations: MockRegistration[] = [
 *   ...,
 *   {
 *     method: 'GET',
 *     pattern: '/api/your/endpoint/:param',
 *     handler: (params, query, body) => ({
 *       code: 0,
 *       message: 'ok',
 *       data: { ... },
 *     }),
 *   },
 * ]
 * ```
 *
 * 共享种子数据位于同级 ./seeds。
 */

import type { MockHandler, MockMethod } from './index'
import {
  MOCK_DICT_DATA,
  MOCK_SESSION_DATA,
  MOCK_MENU_TREE,
  DEMO_FORM_KEY,
  MOCK_DEMO_FORM_DEFINITION,
  MOCK_DEMO_SUBMISSIONS,
} from './seeds'

// ─── 注册条目类型 ────────────────────────────────────────

export interface MockRegistration {
  method: MockMethod
  pattern: `/${string}`
  handler: MockHandler
}

// ─── Handler 实现 ─────────────────────────────────────────

export const mockRegistrations: MockRegistration[] = [
  // ── 登录/会话 ────────────────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/auth/login',
    handler: (_params, _query, _body) => ({
      code: 0,
      message: 'ok',
      data: 'mock-access-token-' + Date.now(),
    }),
  },

  // ── 当前用户会话 ──────────────────────────────────────────
  // GET /api/system/auth/me → SessionDTO
  {
    method: 'GET',
    pattern: '/api/system/auth/me',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: MOCK_SESSION_DATA,
    }),
  },

  // ── 当前用户菜单 ─────────────────────────────────────────
  // GET /api/system/auth/menus → MenuNode[]
  {
    method: 'GET',
    pattern: '/api/system/auth/menus',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: MOCK_MENU_TREE,
    }),
  },

  // ── 字典 ──────────────────────────────────────────────────
  // GET /api/system/dict/data/list/:type
  // 响应形状：ApiResponse<DictItemDTO[]>, DictItemDTO = { code: string, label: string }
  {
    method: 'GET',
    pattern: '/api/system/dict/data/list/:type',
    handler: (params) => ({
      code: 0,
      message: 'ok',
      data: MOCK_DICT_DATA[(params as Record<string, string>).type] ?? [],
    }),
  },

  // ── 表单定义元信息 ────────────────────────────────────────
  // GET /api/form/def/by-key/:formKey → FormDefDTO
  {
    method: 'GET',
    pattern: '/api/form/def/by-key/:formKey',
    handler: (params) => {
      const formKey = (params as Record<string, string>).formKey
      return {
        code: 0,
        message: 'ok',
        data: {
          formKey,
          formName: formKey === DEMO_FORM_KEY ? '请假申请单' : `表单「${formKey}」`,
        },
      }
    },
  },

  // ── 表单定义 schema ───────────────────────────────────────
  // GET /api/form/def/by-key/:formKey/definition
  // 返回裸 JSON 字符串，经 form service → parseDefinition 解析为 FormSchema
  {
    method: 'GET',
    pattern: '/api/form/def/by-key/:formKey/definition',
    handler: (params) => {
      const formKey = (params as Record<string, string>).formKey
      const definition =
        formKey === DEMO_FORM_KEY
          ? MOCK_DEMO_FORM_DEFINITION
          : {
              title: `示例表单「${formKey}」`,
              fields: [
                { name: 'name', label: '申请人', type: 'TEXT', required: true },
                {
                  name: 'department',
                  label: '部门',
                  type: 'DICT',
                  dictType: 'dept',
                  required: true,
                },
                { name: 'date', label: '申请日期', type: 'DATE', required: true },
                { name: 'amount', label: '金额', type: 'NUMBER' },
                { name: 'remark', label: '备注', type: 'RICH_TEXT' },
              ],
            }
      return {
        code: 0,
        message: 'ok',
        data: JSON.stringify(definition),
      }
    },
  },

  // ── 表单提交 ──────────────────────────────────────────────
  // POST /api/form/submit/:formKey
  // - 正常 ➤ code=0, data: recordId
  // - 必填 TEXT 为空 ➤ code=1401, data=null
  // - 字典值域错误 ➤ code=1403, data=null（当 leaveType 不在字典范围内）
  {
    method: 'POST',
    pattern: '/api/form/submit/:formKey',
    handler: (_params, _query, body) => {
      const formKey = (_params as Record<string, string>).formKey
      const payload = body as Record<string, unknown> | undefined

      if (formKey === DEMO_FORM_KEY && payload) {
        // 1401：必填 TEXT 字段 applicant 为空
        const applicant = String(payload.applicant ?? '').trim()
        if (!applicant) {
          return { code: 1401, message: '申请人必填', data: null }
        }

        // 1403：leaveType 不在字典值域内
        const leaveType = String(payload.leaveType ?? '').trim()
        if (leaveType) {
          const validTypes: string[] = (MOCK_DICT_DATA.leave_type ?? []).map((d) => d.code)
          if (!validTypes.includes(leaveType)) {
            return { code: 1403, message: '请假类型不在字典允许范围内', data: null }
          }
        }
      }

      return {
        code: 0,
        message: 'ok',
        data: 'mock-record-' + Date.now(),
      }
    },
  },

  // ── 提交记录列表 ──────────────────────────────────────────
  // GET /api/form/submit/by-key/:formKey/list
  // 形状严格对齐 BackendPageResult<T> =
  //   { records: T[], total: number, pageNum: number, pageSize: number }
  {
    method: 'GET',
    pattern: '/api/form/submit/by-key/:formKey/list',
    handler: (_params, query) => {
      const formKey = (_params as Record<string, string>).formKey
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)

      const records =
        formKey === DEMO_FORM_KEY
          ? MOCK_DEMO_SUBMISSIONS
          : [
              {
                id: 'rec_001',
                formKey,
                applicant: '张三',
                department: '技术部',
                status: 'approved',
                submittedAt: '2026-06-20T10:00:00Z',
              },
              {
                id: 'rec_002',
                formKey,
                applicant: '李四',
                department: '产品部',
                status: 'pending',
                submittedAt: '2026-06-21T14:30:00Z',
              },
              {
                id: 'rec_003',
                formKey,
                applicant: '王五',
                department: '设计部',
                status: 'rejected',
                submittedAt: '2026-06-22T09:15:00Z',
              },
              {
                id: 'rec_004',
                formKey,
                applicant: '赵六',
                department: '技术部',
                status: 'approved',
                submittedAt: '2026-06-23T16:45:00Z',
              },
              {
                id: 'rec_005',
                formKey,
                applicant: '陈七',
                department: '人事部',
                status: 'pending',
                submittedAt: '2026-06-24T11:30:00Z',
              },
            ]

      return {
        code: 0,
        message: 'ok',
        data: {
          records,
          total: records.length,
          pageNum,
          pageSize,
        },
      }
    },
  },
]
