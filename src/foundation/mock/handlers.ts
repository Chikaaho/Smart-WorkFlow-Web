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
  MOCK_DICT_TYPES,
  MOCK_SESSION_DATA,
  MOCK_MENU_TREE,
  DEMO_FORM_KEY,
  MOCK_DEMO_FORM_DEFINITION,
  MOCK_DEMO_SUBMISSIONS,
  MOCK_FORM_DATA_RECORDS,
  MOCK_GENERIC_FORM_RECORDS,
  MOCK_FORM_DEF_STORE,
  MOCK_TODO_TASKS,
  MOCK_PROCESS_DEFS,
  MOCK_NOTIFY_MESSAGES,
  MOCK_USERS_LIST,
  MOCK_ROLES_LIST,
  MOCK_DEPTS_LIST,
  MOCK_POSTS_LIST,
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

  // ── 字典类型清单（设计器 DICT 绑定下拉） ────────────────────
  // POST /api/system/dict/type/page?pageNum=&pageSize=
  // 响应严格对齐后端分页原始形状 BackendPageResult<{code,name}> =
  //   { records, total, pageNum, pageSize }（foundation/dict.listDictTypes 取 records）
  {
    method: 'POST',
    pattern: '/api/system/dict/type/page',
    handler: (_params, query) => ({
      code: 0,
      message: 'ok',
      data: {
        records: MOCK_DICT_TYPES,
        total: MOCK_DICT_TYPES.length,
        pageNum: Number(query.pageNum ?? 1),
        pageSize: Number(query.pageSize ?? 1000),
      },
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
  // POST /api/form/data/:formKey
  // - 正常 ➤ code=0, data: recordId
  // - 必填 TEXT 为空 ➤ code=1401, data=null
  // - 字典值域错误 ➤ code=1403, data=null（当 leaveType 不在字典范围内）
  {
    method: 'POST',
    pattern: '/api/form/data/:formKey',
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

  // ── 表单数据查询（页型 B 列表） ──────────────────────────────
  // POST /api/form/data/{formKey}/query
  // 请求: { pageNum, pageSize, filters: [{field, op, value}] }
  // 响应: R<PageResult<Map>> — records, total, pageNum, pageSize
  {
    method: 'POST',
    pattern: '/api/form/data/:formKey/query',
    handler: (params, _query, body) => {
      const formKey = (params as Record<string, string>).formKey
      const req = (body as Record<string, unknown>) ?? {}
      const pageNum = Number(req.pageNum ?? 1)
      const pageSize = Number(req.pageSize ?? 10)

      // demo-form 返回完整假数据；其他 formKey 返回通用假记录
      const allRecords =
        formKey === DEMO_FORM_KEY ? MOCK_FORM_DATA_RECORDS : MOCK_GENERIC_FORM_RECORDS

      // 简易过滤（按 filters 条件逐个匹配）
      const filters = (req.filters as Array<{ field: string; op: string; value: string }>) ?? []
      let filtered = allRecords
      for (const f of filters) {
        if (!f.value) continue
        filtered = filtered.filter((r) => {
          const cell = r[f.field]
          if (cell === null || cell === undefined) return false
          const strCell = String(cell)
          if (f.op === 'EQ') return strCell === f.value
          if (f.op === 'LIKE') return strCell.includes(f.value)
          // GE / LE 暂不实现 mock 级过滤（日期范围留手工验收分页）
          return true
        })
      }

      // 分页
      const start = (pageNum - 1) * pageSize
      const records = filtered.slice(start, start + pageSize)

      return {
        code: 0,
        message: 'ok',
        data: {
          records,
          total: filtered.length,
          pageNum,
          pageSize,
        },
      }
    },
  },

  // ── 表单数据：查详情（编辑回显） ────────────────────────────
  // GET /api/form/data/{formKey}/{recordId}
  // 返: R<Map> 含 id / version / 审计列 / 业务字段 / 子表行（每行带 id）
  {
    method: 'GET',
    pattern: '/api/form/data/:formKey/:recordId',
    handler: (params) => {
      const { formKey, recordId } = params as Record<string, string>
      const allRecords =
        formKey === DEMO_FORM_KEY ? MOCK_FORM_DATA_RECORDS : MOCK_GENERIC_FORM_RECORDS
      const record = allRecords.find((r) => String(r.id) === recordId)
      if (!record) {
        return { code: 1507, message: '记录不存在或已被删除', data: null }
      }
      // 返回副本，将 JSON 串子表字段解析为带行 id 的数组
      const result: Record<string, unknown> = { ...record }
      for (const [key, val] of Object.entries(result)) {
        if (typeof val === 'string' && val.trim().startsWith('[')) {
          try {
            const arr = JSON.parse(val) as Record<string, unknown>[]
            result[key] = arr.map((item, idx) => ({
              id: `${recordId}_row_${idx + 1}`,
              ...item,
            }))
          } catch {
            /* 非 JSON 串则保留原值 */
          }
        }
      }
      return { code: 0, message: 'ok', data: result }
    },
  },

  // ── 表单数据：更新记录 ─────────────────────────────────────
  // PUT /api/form/data/{formKey}/{recordId}
  // ← { data, version, subTableRows } → R<Void>
  // 错误码: 1507 记录不存在 · 1508 版本冲突
  {
    method: 'PUT',
    pattern: '/api/form/data/:formKey/:recordId',
    handler: (params, _query, body) => {
      const { formKey, recordId } = params as Record<string, string>
      const { version: reqVersion } = (body as { version?: number }) ?? {}
      const allRecords =
        formKey === DEMO_FORM_KEY ? MOCK_FORM_DATA_RECORDS : MOCK_GENERIC_FORM_RECORDS
      const record = allRecords.find((r) => String(r.id) === recordId)
      if (!record) {
        return { code: 1507, message: '记录不存在或已被删除', data: null }
      }
      const currentVersion = (record.version as number) ?? 1
      if (reqVersion !== undefined && reqVersion !== currentVersion) {
        return { code: 1508, message: '版本冲突，请刷新后重试', data: null }
      }
      // mock: 更新成功，版本号 +1
      record.version = currentVersion + 1
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 表单定义：新建草稿 ───────────────────────────────────
  // POST /api/form/def
  // 入参: { formKey, name }  返: FormDefDTO{ id, formKey, status }
  {
    method: 'POST',
    pattern: '/api/form/def',
    handler: (_params, _query, body) => {
      const req = body as { formKey?: string; name?: string }
      const id = 'mock-def-' + Date.now()
      const formKey = req.formKey ?? 'form_' + Date.now()
      const name = req.name ?? '未命名表单'

      MOCK_FORM_DEF_STORE.set(id, {
        id,
        formKey,
        name,
        status: 'DRAFT',
        definition: JSON.stringify({ title: name, fields: [] }),
      })

      return {
        code: 0,
        message: 'ok',
        data: { id, formKey, name, status: 'DRAFT' },
      }
    },
  },

  // ── 表单定义：保存 config ─────────────────────────────────
  // POST /api/form/def/:id/config
  // 入参: { definition: string }  返: void
  {
    method: 'POST',
    pattern: '/api/form/def/:id/config',
    handler: (params, _query, body) => {
      const id = (params as Record<string, string>).id
      const req = body as { definition?: string }
      const existing = MOCK_FORM_DEF_STORE.get(id)

      if (!existing) {
        return { code: 1500, message: '表单不存在', data: null }
      }

      existing.definition = req.definition ?? existing.definition
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 表单定义：取 definition ────────────────────────────────
  // GET /api/form/def/:id/definition
  // 返: R<String>（definition JSON 字符串）
  {
    method: 'GET',
    pattern: '/api/form/def/:id/definition',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const existing = MOCK_FORM_DEF_STORE.get(id)

      if (!existing) {
        return {
          code: 0,
          message: 'ok',
          data: JSON.stringify({ title: '未命名表单', fields: [] }),
        }
      }

      return { code: 0, message: 'ok', data: existing.definition }
    },
  },

  // ── 表单定义：发布 ────────────────────────────────────────
  // POST /api/form/def/:id/publish
  // 返: FormDefDTO（status=PUBLISHED）
  // 模拟校验：非法列名（以数字开头）→ 1204
  {
    method: 'POST',
    pattern: '/api/form/def/:id/publish',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const existing = MOCK_FORM_DEF_STORE.get(id)

      if (!existing) {
        return { code: 1500, message: '表单不存在', data: null }
      }

      // 简易 mock 校验：检查 definition 中是否有以数字开头的字段名
      try {
        const def = JSON.parse(existing.definition) as {
          title: string
          fields: Array<{ name: string; type: string }>
        }
        for (const field of def.fields) {
          if (/^\d/.test(field.name)) {
            return {
              code: 1204,
              message: `字段名 "${field.name}" 不合法（仅允许字母/数字/下划线，且不能以数字开头）`,
              data: null,
            }
          }
          // DICT 未绑定 dictType
          if (field.type === 'DICT' && !(field as { dictType?: string }).dictType) {
            return {
              code: 1206,
              message: `字典字段 "${field.name}" 未绑定字典类型`,
              data: null,
            }
          }
          // REFERENCE 未指定 targetFormId
          if (field.type === 'REFERENCE' && !(field as { targetFormId?: string }).targetFormId) {
            return {
              code: 1207,
              message: `引用字段 "${field.name}" 未指定目标表单`,
              data: null,
            }
          }
          // TABLE 无子列
          if (
            field.type === 'TABLE' &&
            (!(field as { subFields?: unknown[] }).subFields ||
              (field as { subFields?: unknown[] }).subFields!.length === 0)
          ) {
            return {
              code: 1208,
              message: `子表格字段 "${field.name}" 未定义子列`,
              data: null,
            }
          }
        }
      } catch {
        // JSON 非法时也返回校验失败
      }

      existing.status = 'PUBLISHED'
      return {
        code: 0,
        message: 'ok',
        data: {
          id: existing.id,
          formKey: existing.formKey,
          name: existing.name,
          status: 'PUBLISHED',
        },
      }
    },
  },

  // ── 表单定义分页列表 ──────────────────────────────────────
  // GET /api/form/def/page?pageNum=&pageSize=&keyword=
  // 返 BackendPageResult<FormDefListItem>（records/total/pageNum/pageSize）
  // 排序 update_time DESC（mock 按种子定义顺序模拟）
  // 临时数据，上线后由后端真实数据替换。
  {
    method: 'GET',
    pattern: '/api/form/def/page',
    handler: (_params, query) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      const keyword = String(query.keyword ?? '').trim()

      // 从共享 store 读取所有条目，填充列表额外字段
      const now = '2026-06-30 10:00:00'
      let all = Array.from(MOCK_FORM_DEF_STORE.values()).map((item) => ({
        id: item.id,
        formKey: item.formKey,
        name: item.name,
        logicalTableName: '',
        status: item.status,
        physicalTableName: '',
        formVersion: 1,
        description: '',
        createTime: now,
        updateTime: now,
      }))

      // keyword 过滤
      if (keyword) {
        all = all.filter((i) => i.name.includes(keyword) || i.formKey.includes(keyword))
      }

      // 按 updateTime DESC（mock 按 name 逆序模拟）
      all.sort((a, b) => b.name.localeCompare(a.name))

      const total = all.length
      const start = (pageNum - 1) * pageSize
      const records = all.slice(start, start + pageSize)

      return {
        code: 0,
        message: 'ok',
        data: { records, total, pageNum, pageSize },
      }
    },
  },

  // ── 待办任务：当前用户待办列表 ──────────────────────────
  {
    method: 'GET',
    pattern: '/api/workflow/tasks/todo',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: MOCK_TODO_TASKS,
    }),
  },

  // ── 待办任务：完成审批（从 mock 列表中移除对应 task） ────
  {
    method: 'POST',
    pattern: '/api/workflow/tasks/:taskId/complete',
    handler: (params) => {
      const { taskId } = params as Record<string, string>
      const idx = MOCK_TODO_TASKS.findIndex((t) => t.taskId === taskId)
      if (idx === -1) {
        return { code: 404, message: '任务不存在', data: null }
      }
      MOCK_TODO_TASKS.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 流程定义：分页列表 ─────────────────────────────────
  {
    method: 'GET',
    pattern: '/api/workflow/defs',
    handler: (_params, query) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      const total = MOCK_PROCESS_DEFS.length
      const start = (pageNum - 1) * pageSize
      const records = MOCK_PROCESS_DEFS.slice(start, start + pageSize)
      return {
        code: 0,
        message: 'ok',
        data: { records, total, pageNum, pageSize },
      }
    },
  },

  // ── 通知消息：当前用户通知列表 ──────────────────────────
  {
    method: 'GET',
    pattern: '/api/notify/messages',
    handler: () => ({
      code: 0,
      message: 'ok',
      data: MOCK_NOTIFY_MESSAGES,
    }),
  },

  // ── 通知消息：标记已读 ──────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/notify/messages/:id/read',
    handler: (params) => {
      const msg = MOCK_NOTIFY_MESSAGES.find(
        (m) => m.id === Number((params as Record<string, string>).id),
      )
      if (msg) {
        msg.read = true
      }
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 用户管理 CRUD ──────────────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/system/user/page',
    handler: (_params, query, body) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      let list = [...MOCK_USERS_LIST]
      if (body && typeof body === 'object') {
        const f = body as Record<string, unknown>
        if (f.username) list = list.filter((u) => u.username.includes(String(f.username)))
        if (f.status !== undefined && f.status !== null && f.status !== '')
          list = list.filter((u) => u.status === Number(f.status))
      }
      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
    },
  },
  {
    method: 'GET',
    pattern: '/api/system/user/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const user = MOCK_USERS_LIST.find((u) => u.id === id)
      if (!user) return { code: 404, message: '用户不存在', data: null }
      return { code: 0, message: 'ok', data: { ...user } }
    },
  },
  {
    method: 'POST',
    pattern: '/api/system/user',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const id = String(Date.now())
      const newUser = {
        id,
        username: String(data.username ?? ''),
        realName: String(data.realName ?? ''),
        email: String(data.email ?? ''),
        phone: String(data.phone ?? ''),
        sex: Number(data.sex ?? 0),
        status: Number(data.status ?? 1),
        deptId: String(data.deptId ?? ''),
        isAdmin: false,
        avatar: null,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      MOCK_USERS_LIST.push(newUser as (typeof MOCK_USERS_LIST)[number])
      return { code: 0, message: 'ok', data: id }
    },
  },
  {
    method: 'PUT',
    pattern: '/api/system/user',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const idx = MOCK_USERS_LIST.findIndex((u) => u.id === String(data.id))
      if (idx === -1) return { code: 404, message: '用户不存在', data: null }
      const existing = MOCK_USERS_LIST[idx]
      MOCK_USERS_LIST[idx] = {
        ...existing,
        username: String(data.username ?? existing.username),
        realName: String(data.realName ?? existing.realName),
        email: String(data.email ?? existing.email),
        phone: String(data.phone ?? existing.phone),
        sex: data.sex !== undefined ? Number(data.sex) : existing.sex,
        status: data.status !== undefined ? Number(data.status) : existing.status,
        deptId: data.deptId !== undefined ? String(data.deptId) : existing.deptId,
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      return { code: 0, message: 'ok', data: null }
    },
  },
  {
    method: 'DELETE',
    pattern: '/api/system/user/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const idx = MOCK_USERS_LIST.findIndex((u) => u.id === id)
      if (idx === -1) return { code: 0, message: 'ok', data: null }
      MOCK_USERS_LIST.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 角色管理 CRUD ──────────────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/system/role/page',
    handler: (_params, query, body) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      let list = [...MOCK_ROLES_LIST]
      if (body && typeof body === 'object') {
        const f = body as Record<string, unknown>
        if (f.name) list = list.filter((r) => r.name.includes(String(f.name)))
        if (f.code) list = list.filter((r) => r.code.includes(String(f.code)))
        if (f.status !== undefined && f.status !== null && f.status !== '')
          list = list.filter((r) => r.status === Number(f.status))
      }
      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
    },
  },
  {
    method: 'GET',
    pattern: '/api/system/role/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const role = MOCK_ROLES_LIST.find((r) => r.id === id)
      if (!role) return { code: 404, message: '角色不存在', data: null }
      return { code: 0, message: 'ok', data: { ...role } }
    },
  },
  {
    method: 'POST',
    pattern: '/api/system/role',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const id = String(Date.now())
      const newRole = {
        id,
        name: String(data.name ?? ''),
        code: String(data.code ?? ''),
        sort: Number(data.sort ?? 0),
        status: Number(data.status ?? 1),
        dataScope: 1,
        builtIn: false,
        description: String(data.description ?? ''),
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      MOCK_ROLES_LIST.push(newRole as (typeof MOCK_ROLES_LIST)[number])
      return { code: 0, message: 'ok', data: id }
    },
  },
  {
    method: 'PUT',
    pattern: '/api/system/role',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const idx = MOCK_ROLES_LIST.findIndex((r) => r.id === String(data.id))
      if (idx === -1) return { code: 404, message: '角色不存在', data: null }
      const existing = MOCK_ROLES_LIST[idx]
      MOCK_ROLES_LIST[idx] = {
        ...existing,
        name: String(data.name ?? existing.name),
        code: String(data.code ?? existing.code),
        sort: data.sort !== undefined ? Number(data.sort) : existing.sort,
        status: data.status !== undefined ? Number(data.status) : existing.status,
        description:
          data.description !== undefined ? String(data.description) : existing.description,
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      return { code: 0, message: 'ok', data: null }
    },
  },
  {
    method: 'DELETE',
    pattern: '/api/system/role/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const idx = MOCK_ROLES_LIST.findIndex((r) => r.id === id)
      if (idx === -1) return { code: 0, message: 'ok', data: null }
      MOCK_ROLES_LIST.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 部门管理 CRUD ──────────────────────────────────────────
  {
    method: 'GET',
    pattern: '/api/system/dept/tree',
    handler: () => {
      return { code: 0, message: 'ok', data: [...MOCK_DEPTS_LIST] }
    },
  },
  {
    method: 'GET',
    pattern: '/api/system/dept/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const dept = MOCK_DEPTS_LIST.find((d) => d.id === id)
      if (!dept) return { code: 404, message: '部门不存在', data: null }
      return { code: 0, message: 'ok', data: { ...dept } }
    },
  },
  {
    method: 'POST',
    pattern: '/api/system/dept',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const id = String(Date.now())
      const newDept = {
        id,
        parentId: String(data.parentId ?? '0'),
        name: String(data.name ?? ''),
        code: String(data.code ?? ''),
        sort: Number(data.sort ?? 0),
        status: Number(data.status ?? 1),
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      MOCK_DEPTS_LIST.push(newDept as (typeof MOCK_DEPTS_LIST)[number])
      return { code: 0, message: 'ok', data: id }
    },
  },
  {
    method: 'PUT',
    pattern: '/api/system/dept',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const idx = MOCK_DEPTS_LIST.findIndex((d) => d.id === String(data.id))
      if (idx === -1) return { code: 404, message: '部门不存在', data: null }
      const existing = MOCK_DEPTS_LIST[idx]
      MOCK_DEPTS_LIST[idx] = {
        ...existing,
        parentId: data.parentId !== undefined ? String(data.parentId) : existing.parentId,
        name: String(data.name ?? existing.name),
        code: String(data.code ?? existing.code),
        sort: data.sort !== undefined ? Number(data.sort) : existing.sort,
        status: data.status !== undefined ? Number(data.status) : existing.status,
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      return { code: 0, message: 'ok', data: null }
    },
  },
  {
    method: 'DELETE',
    pattern: '/api/system/dept/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const idx = MOCK_DEPTS_LIST.findIndex((d) => d.id === id)
      if (idx === -1) return { code: 0, message: 'ok', data: null }
      MOCK_DEPTS_LIST.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },

  // ── 岗位管理 CRUD ──────────────────────────────────────────
  {
    method: 'POST',
    pattern: '/api/system/post/page',
    handler: (_params, query, body) => {
      const pageNum = Number(query.pageNum ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      let list = [...MOCK_POSTS_LIST]
      if (body && typeof body === 'object') {
        const f = body as Record<string, unknown>
        if (f.code) list = list.filter((p) => p.code.includes(String(f.code)))
        if (f.name) list = list.filter((p) => p.name.includes(String(f.name)))
        if (f.status !== undefined && f.status !== null && f.status !== '')
          list = list.filter((p) => p.status === Number(f.status))
      }
      const total = list.length
      const start = (pageNum - 1) * pageSize
      const records = list.slice(start, start + pageSize)
      return { code: 0, message: 'ok', data: { records, total, pageNum, pageSize } }
    },
  },
  {
    method: 'GET',
    pattern: '/api/system/post/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const post = MOCK_POSTS_LIST.find((p) => p.id === id)
      if (!post) return { code: 404, message: '岗位不存在', data: null }
      return { code: 0, message: 'ok', data: { ...post } }
    },
  },
  {
    method: 'POST',
    pattern: '/api/system/post',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const id = String(Date.now())
      const newPost = {
        id,
        code: String(data.code ?? ''),
        name: String(data.name ?? ''),
        sort: Number(data.sort ?? 0),
        status: Number(data.status ?? 1),
        description: String(data.description ?? ''),
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      MOCK_POSTS_LIST.push(newPost as (typeof MOCK_POSTS_LIST)[number])
      return { code: 0, message: 'ok', data: id }
    },
  },
  {
    method: 'PUT',
    pattern: '/api/system/post',
    handler: (_params, _query, body) => {
      const data = body as Record<string, unknown>
      const idx = MOCK_POSTS_LIST.findIndex((p) => p.id === String(data.id))
      if (idx === -1) return { code: 404, message: '岗位不存在', data: null }
      const existing = MOCK_POSTS_LIST[idx]
      MOCK_POSTS_LIST[idx] = {
        ...existing,
        code: String(data.code ?? existing.code),
        name: String(data.name ?? existing.name),
        sort: data.sort !== undefined ? Number(data.sort) : existing.sort,
        status: data.status !== undefined ? Number(data.status) : existing.status,
        description:
          data.description !== undefined ? String(data.description) : existing.description,
        updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      }
      return { code: 0, message: 'ok', data: null }
    },
  },
  {
    method: 'DELETE',
    pattern: '/api/system/post/:id',
    handler: (params) => {
      const id = (params as Record<string, string>).id
      const idx = MOCK_POSTS_LIST.findIndex((p) => p.id === id)
      if (idx === -1) return { code: 0, message: 'ok', data: null }
      MOCK_POSTS_LIST.splice(idx, 1)
      return { code: 0, message: 'ok', data: null }
    },
  },
]
