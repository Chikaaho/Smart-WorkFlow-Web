/**
 * 部门管理前端类型 —— 镜像后端实体 SysDept 字段。
 *
 * children 字段为前端树形渲染用，后端 tree 端点不返回嵌套结构，
 * 前端需自行 flat→tree 转换注入 children。
 */

/** 部门实体（镜像 SysDept） */
export interface SysDept {
  id?: string
  parentId?: string
  name: string
  code: string
  sort?: number
  status?: number
  /** 审计字段 */
  createTime?: string
  updateTime?: string
  /** 前端树形渲染用，后端不返回 */
  children?: SysDept[]
}
