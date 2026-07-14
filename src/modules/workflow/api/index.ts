import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { TodoTask, ProcessDef } from '@/contracts/bpm'

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
// 待办任务
// ═══════════════════════════════════════

/** GET /workflow/tasks/todo → TodoTask[] */
export async function queryTodoTasks(): Promise<TodoTask[]> {
  return request<TodoTask[]>({
    method: 'GET',
    url: '/workflow/tasks/todo',
  })
}

/** POST /workflow/tasks/{taskId}/complete → void */
export async function completeTask(taskId: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/workflow/tasks/${taskId}/complete`,
  })
}

// ═══════════════════════════════════════
// 流程定义
// ═══════════════════════════════════════

/** GET /workflow/defs → PageResult<ProcessDef> */
export async function pageProcessDefs(page: PageQuery): Promise<PageResult<ProcessDef>> {
  const raw = await request<BackendPageResult<ProcessDef>>({
    method: 'GET',
    url: '/workflow/defs',
    params: page,
  })
  return adaptPage(raw)
}
