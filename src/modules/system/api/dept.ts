/**
 * 部门管理 API 层 —— 4 个 CRUD 函数 + tree 端点。
 *
 * 部门不分页，用 GET /tree 返回全量列表（前端 flat→tree 转换）。
 * 不含 BackendPageResult / adaptPage / PageQuery / PageResult 导入。
 */
import { request } from '@/foundation/request'
import type { SysDept } from '@/modules/system/types/dept'

// ═══════════════════════════════════════

/** GET /system/dept/tree → 全量部门列表（flat，前端自行组装树） */
export async function listDeptTree(): Promise<SysDept[]> {
  return request<SysDept[]>({
    method: 'GET',
    url: '/system/dept/tree',
  })
}

/** GET /system/dept/{id} */
export async function getDept(id: string): Promise<SysDept> {
  return request<SysDept>({ method: 'GET', url: `/system/dept/${id}` })
}

/** POST /system/dept → R<Long> */
export async function createDept(data: SysDept): Promise<string> {
  return request<string>({ method: 'POST', url: '/system/dept', data })
}

/** PUT /system/dept → R<Void> */
export async function updateDept(data: SysDept): Promise<void> {
  return request<void>({ method: 'PUT', url: '/system/dept', data })
}

/** DELETE /system/dept/{id} → R<Void> */
export async function deleteDept(id: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/system/dept/${id}` })
}
