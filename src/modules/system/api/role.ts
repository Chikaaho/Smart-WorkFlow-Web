/**
 * 角色管理 API 层 —— 5 个 CRUD 函数。
 *
 * 全部经 foundation/request 单一请求层，禁直引 axios。
 * 后端统一响应 R<T> 由 request() 解包，本层直接拿到 data: T。
 */
import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { SysRole, RoleFilter } from '@/modules/system/types/role'

// ─── 后端分页原始形状 ───

interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

function adaptPage<T>(raw: BackendPageResult<T>): PageResult<T> {
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}

// ═══════════════════════════════════════

/** POST /system/role/page?pageNum=&pageSize= + body 筛选 */
export async function pageRoles(page: PageQuery, filter: RoleFilter): Promise<PageResult<SysRole>> {
  const raw = await request<BackendPageResult<SysRole>>({
    method: 'POST',
    url: '/system/role/page',
    params: page,
    data: filter,
  })
  return adaptPage(raw)
}

/** GET /system/role/{id} */
export async function getRole(id: string): Promise<SysRole> {
  return request<SysRole>({ method: 'GET', url: `/system/role/${id}` })
}

/** POST /system/role → R<Long> */
export async function createRole(data: SysRole): Promise<string> {
  return request<string>({ method: 'POST', url: '/system/role', data })
}

/** PUT /system/role → R<Void> */
export async function updateRole(data: SysRole): Promise<void> {
  return request<void>({ method: 'PUT', url: '/system/role', data })
}

/** DELETE /system/role/{id} → R<Void> */
export async function deleteRole(id: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/system/role/${id}` })
}
