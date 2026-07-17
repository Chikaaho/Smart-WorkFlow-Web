import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/foundation/request', () => ({ request: vi.fn() }))

import { request } from '@/foundation/request'
import { pageRoles, getRole, createRole, updateRole, deleteRole } from './role'

const mockRequest = vi.mocked(request)

describe('modules/system/api/role — 角色管理 6 个', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  // ─── pageRoles ───

  it('pageRoles: POST /system/role/page with params + body, adapts records→list', async () => {
    mockRequest.mockResolvedValueOnce({
      records: [{ id: '1', name: '管理员', code: 'admin', status: 1 }],
      total: 50,
      pageNum: 1,
      pageSize: 10,
    })

    const result = await pageRoles({ pageNum: 1, pageSize: 10 }, { name: '管理员' })

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/system/role/page',
        params: { pageNum: 1, pageSize: 10 },
        data: { name: '管理员' },
      }),
    )
    expect(result.list).toHaveLength(1)
    expect(result.list[0].code).toBe('admin')
    expect(result.total).toBe(50)
  })

  it('pageRoles: empty filter', async () => {
    mockRequest.mockResolvedValueOnce({ records: [], total: 0, pageNum: 1, pageSize: 10 })
    await pageRoles({ pageNum: 1, pageSize: 10 }, {})
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { pageNum: 1, pageSize: 10 },
        data: {},
      }),
    )
  })

  // ─── getRole ───

  it('getRole: GET /system/role/{id}', async () => {
    const item = { id: '1', name: '管理员', code: 'admin', status: 1 }
    mockRequest.mockResolvedValueOnce(item)

    const result = await getRole('1')

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/system/role/1' }),
    )
    expect(result).toEqual(item)
  })

  // ─── createRole ───

  it('createRole: POST /system/role with body → Long (string)', async () => {
    mockRequest.mockResolvedValueOnce('42')
    const id = await createRole({ name: '测试角色', code: 'test', status: 1 })
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/system/role',
        data: { name: '测试角色', code: 'test', status: 1 },
      }),
    )
    expect(id).toBe('42')
  })

  // ─── updateRole ───

  it('updateRole: PUT /system/role with body → void', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await updateRole({ id: '1', name: 'updated', code: 'test', status: 1 })
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: '/system/role',
        data: { id: '1', name: 'updated', code: 'test', status: 1 },
      }),
    )
  })

  // ─── deleteRole ───

  it('deleteRole: DELETE /system/role/{id} → void', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await deleteRole('1')
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE', url: '/system/role/1' }),
    )
  })
})
