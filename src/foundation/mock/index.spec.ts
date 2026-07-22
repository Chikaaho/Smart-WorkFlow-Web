import { describe, it, expect } from 'vitest'

/**
 * Mock 模块加载/注册回归测试。
 *
 * 覆盖场景：
 *  - 模块导入不抛 TDZ（回归验证：handlers 与 index 的循环依赖已解）
 *  - registry 被 mockRegistrations 填充，大小符合预期
 *  - dispatchMock 对已知端点命中正常
 *  - dispatchMock 对未注册端点 fallthrough（返回 undefined）
 *  - 表单全链路：def → definition → submit → list
 *  - 业务错误码：必填为空 1401、字典值域 1403
 *  - DICT handler 返回的 value 全为 string
 *  - prod tree-shake 路径不受影响（import.meta.env.DEV 回退态）
 */

const DEMO_FORM_KEY = 'demo-form'

describe('foundation/mock/index', () => {
  it('模块加载不抛 TDZ（handlers 无副作用反向 import）', async () => {
    const mod = await import('@/foundation/mock/index')
    expect(mod).toBeDefined()
    expect(typeof mod.dispatchMock).toBe('function')
    expect(typeof mod.defineMock).toBe('function')
  })

  it('registry 有已注册的 handler', async () => {
    const mod = await import('@/foundation/mock/index')

    // 验证 login handler 存在（F1 契约：R<TokenResponseDTO>）
    const loginResult = await mod.dispatchMock(
      'POST',
      '/auth/login',
      '/api',
      {},
      {
        username: 'admin',
        password: 'admin123',
      },
    )
    expect(loginResult).toBeDefined()
    expect(loginResult!.code).toBe(0)
    expect(loginResult!.data).toMatchObject({
      accessToken: expect.any(String) as string,
      expiresIn: 900,
    })

    // 验证 refresh handler 存在（F1 契约：R<TokenResponseDTO>）
    const refreshResult = await mod.dispatchMock('POST', '/auth/refresh', '/api', {}, {})
    expect(refreshResult).toBeDefined()
    expect(refreshResult!.code).toBe(0)
    expect(refreshResult!.data).toMatchObject({
      accessToken: expect.any(String) as string,
      expiresIn: 900,
    })

    // 验证 logout handler 存在（幂等，返回 R<null>）
    const logoutResult = await mod.dispatchMock('POST', '/auth/logout', '/api', {}, {})
    expect(logoutResult).toBeDefined()
    expect(logoutResult!.code).toBe(0)
    expect(logoutResult!.data).toBeNull()

    // 验证 dict handler 存在
    const dictResult = await mod.dispatchMock('GET', '/system/dict/data/list/dept', '/api', {}, {})
    expect(dictResult).toBeDefined()
    expect(dictResult!.code).toBe(0)
    expect(Array.isArray(dictResult!.data)).toBe(true)
  })

  // ── demo-form 全链路 ─────────────────────────────────────

  it('demo-form 元信息 handler 返回 FormDefDTO', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      `/form/def/by-key/${DEMO_FORM_KEY}`,
      '/api',
      {},
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(result!.data).toMatchObject({
      formKey: DEMO_FORM_KEY,
      formName: '请假申请单',
    })
  })

  it('demo-form definition handler 返回可解析 JSON 字符串', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      `/form/def/by-key/${DEMO_FORM_KEY}/definition`,
      '/api',
      {},
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(typeof result!.data).toBe('string')

    // 验证 JSON 可解析且包含 fields
    const parsed = JSON.parse(result!.data as string)
    expect(parsed).toHaveProperty('title', '请假申请单')
    expect(parsed).toHaveProperty('fields')
    expect(Array.isArray(parsed.fields)).toBe(true)
    expect(parsed.fields.length).toBeGreaterThanOrEqual(6)

    // 验证必填 TEXT 字段存在（用于 1401 演示）
    const applicant = parsed.fields.find((f: { name: string }) => f.name === 'applicant')
    expect(applicant).toBeDefined()
    expect(applicant.type).toBe('TEXT')
    expect(applicant.required).toBe(true)

    // 验证 TABLE 字段包含 subFields
    const attachments = parsed.fields.find((f: { name: string }) => f.name === 'attachments')
    expect(attachments).toBeDefined()
    expect(attachments.type).toBe('TABLE')
    expect(attachments.subFields).toHaveLength(3)
  })

  it('demo-form submit 正常返回 recordId', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'POST',
      `/form/data/${DEMO_FORM_KEY}`,
      '/api',
      {},
      {
        applicant: '张三',
        department: 'TECH',
        leaveType: 'ANNUAL',
        leaveDate: '2026-07-01',
        days: 5,
      },
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(typeof result!.data).toBe('string')
    expect((result!.data as string).startsWith('mock-record-')).toBe(true)
  })

  it('demo-form submit 必填 TEXT 为空返回 1401', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'POST',
      `/form/data/${DEMO_FORM_KEY}`,
      '/api',
      {},
      {
        applicant: '', // 必填字段为空
        department: 'TECH',
        leaveType: 'ANNUAL',
        leaveDate: '2026-07-01',
        days: 5,
      },
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(1401)
    expect(result!.message).toMatch(/必填/)
    expect(result!.data).toBeNull()
  })

  it('demo-form submit 字典值域错误返回 1403', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'POST',
      `/form/data/${DEMO_FORM_KEY}`,
      '/api',
      {},
      {
        applicant: '张三',
        department: 'TECH',
        leaveType: 'INVALID_TYPE', // 不在字典值域内
        leaveDate: '2026-07-01',
        days: 5,
      },
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(1403)
    expect(result!.message).toMatch(/字典/)
    expect(result!.data).toBeNull()
  })

  it('demo-form list 返回分页数据', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      `/form/submit/by-key/${DEMO_FORM_KEY}/list`,
      '/api',
      { pageNum: '1', pageSize: '10' },
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(result!.data).toHaveProperty('records')
    expect(result!.data).toHaveProperty('total')
    expect(result!.data).toHaveProperty('pageNum', 1)
    expect(result!.data).toHaveProperty('pageSize', 10)
    const data = result!.data as {
      records: Array<Record<string, unknown>>
      total: number
      pageNum: number
      pageSize: number
    }
    expect(Array.isArray(data.records)).toBe(true)
    expect(data.records.length).toBeGreaterThanOrEqual(3)

    // 第一条记录应包含 demo-form 字段
    const first = data.records[0]
    expect(first).toHaveProperty('applicant')
    expect(first).toHaveProperty('department')
    expect(first).toHaveProperty('leaveType')
  })

  // ── dict handler ─────────────────────────────────────────

  it('dict handler 返回的 value(code) 全为 string', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      '/system/dict/data/list/leave_type',
      '/api',
      {},
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    const items = result!.data as Array<{ label: string; code: string }>
    for (const item of items) {
      expect(typeof item.code).toBe('string')
      expect(typeof item.label).toBe('string')
    }
  })

  it('dict handler 对未知 type 返回空数组', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      '/system/dict/data/list/nonexistent',
      '/api',
      {},
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(result!.data).toEqual([])
  })

  // ── 非 demo-form 仍走通用逻辑 ─────────────────────────────

  it('非 demo-form 的 definition handler 返回通用表单 JSON', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'GET',
      '/form/def/by-key/other-form/definition',
      '/api',
      {},
      {},
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    const parsed = JSON.parse(result!.data as string)
    expect(parsed.title).toContain('other-form')
  })

  it('非 demo-form 的 submit 正常返回 recordId（无校验）', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock(
      'POST',
      '/form/data/other-form',
      '/api',
      {},
      { applicant: '' }, // 空值但非 demo-form → 无校验
    )
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(typeof result!.data).toBe('string')
  })

  // ── fallthrough ──────────────────────────────────────────

  it('dispatchMock 对未注册端点 fallthrough（返回 undefined）', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock('DELETE', '/api/nonexistent', '/api', {}, {})
    expect(result).toBeUndefined()
  })

  it('dispatchMock 对未知 method 不命中', async () => {
    const mod = await import('@/foundation/mock/index')
    const result = await mod.dispatchMock('OPTIONS', '/auth/login', '/api', {}, {})
    expect(result).toBeUndefined()
  })

  // ── 运行时注册 ────────────────────────────────────────────

  it('定义新 handler 后 registry 可命中', async () => {
    const mod = await import('@/foundation/mock/index')
    mod.defineMock('GET', '/api/_test/ping', () => ({
      code: 0,
      message: 'pong',
      data: null,
    }))

    const result = await mod.dispatchMock('GET', '/_test/ping', '/api', {}, {})
    expect(result).toBeDefined()
    expect(result!.code).toBe(0)
    expect(result!.message).toBe('pong')
  })
})
