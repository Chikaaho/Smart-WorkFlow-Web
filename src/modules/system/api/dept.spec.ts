import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/foundation/request', () => ({ request: vi.fn() }))

import { request } from '@/foundation/request'
import { listDeptTree, getDept, createDept, updateDept, deleteDept } from './dept'

const mockRequest = vi.mocked(request)

describe('modules/system/api/dept — 部门管理 6 个', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  // ─── listDeptTree ───

  it('listDeptTree: GET /system/dept/tree returns array', async () => {
    mockRequest.mockResolvedValueOnce([
      { id: '1', parentId: '0', name: '总公司', code: 'HQ', status: 0 },
    ])

    const result = await listDeptTree()

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/system/dept/tree' }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('总公司')
    expect(result[0].parentId).toBe('0')
  })

  it('listDeptTree: returns empty array when no depts', async () => {
    mockRequest.mockResolvedValueOnce([])

    const result = await listDeptTree()

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/system/dept/tree' }),
    )
    expect(result).toEqual([])
  })

  // ─── getDept ───

  it('getDept: GET /system/dept/{id}', async () => {
    const item = { id: '1', parentId: '0', name: '总公司', code: 'HQ', status: 0 }
    mockRequest.mockResolvedValueOnce(item)

    const result = await getDept('1')

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/system/dept/1' }),
    )
    expect(result).toEqual(item)
  })

  // ─── createDept ───

  it('createDept: POST /system/dept with body (含 parentId) → Long (string)', async () => {
    mockRequest.mockResolvedValueOnce('10')
    const id = await createDept({ name: '技术部', code: 'tech', parentId: '1', status: 0 })
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/system/dept',
        data: { name: '技术部', code: 'tech', parentId: '1', status: 0 },
      }),
    )
    expect(id).toBe('10')
  })

  // ─── updateDept ───

  it('updateDept: PUT /system/dept with body → void', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await updateDept({ id: '1', name: 'updated', code: 'HQ', status: 0 })
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: '/system/dept',
        data: { id: '1', name: 'updated', code: 'HQ', status: 0 },
      }),
    )
  })

  // ─── deleteDept ───

  it('deleteDept: DELETE /system/dept/{id} → void', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await deleteDept('1')
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE', url: '/system/dept/1' }),
    )
  })
})
