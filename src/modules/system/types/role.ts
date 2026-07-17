/**
 * 角色管理前端类型 —— 镜像后端实体 SysRole 字段。
 */

/** 角色实体（镜像 SysRole） */
export interface SysRole {
  id?: string
  name: string
  code: string
  sort?: number
  status?: number
  dataScope?: number
  builtIn?: boolean
  description?: string
  /** 审计字段 */
  createTime?: string
  updateTime?: string
}

/** 角色分页筛选 */
export interface RoleFilter {
  name?: string
  code?: string
  status?: number
}
