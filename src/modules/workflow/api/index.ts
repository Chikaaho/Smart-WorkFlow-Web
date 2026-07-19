import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import type { TodoTask, TaskDetail, ProcessedTask, ProcessDef } from '@/contracts/bpm'

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

/** GET /workflow/tasks/todo?pageNum=&pageSize= → PageResult<TodoTask> */
export async function queryTodoTasks(page: PageQuery): Promise<PageResult<TodoTask>> {
  const raw = await request<BackendPageResult<TodoTask>>({
    method: 'GET',
    url: '/workflow/tasks/todo',
    params: page,
  })
  return adaptPage(raw)
}

/** GET /workflow/tasks/{taskId} → TaskDetail */
export async function queryTaskDetail(taskId: string): Promise<TaskDetail> {
  return request<TaskDetail>({
    method: 'GET',
    url: `/workflow/tasks/${taskId}`,
  })
}

/** POST /workflow/tasks/{taskId}/complete → void */
export async function completeTask(taskId: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/workflow/tasks/${taskId}/complete`,
  })
}

/** POST /workflow/tasks/{taskId}/reject → void */
export async function rejectTask(taskId: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/workflow/tasks/${taskId}/reject`,
  })
}

// ═══════════════════════════════════════
// 已办任务
// ═══════════════════════════════════════

/** GET /workflow/tasks/processed?pageNum=&pageSize= → PageResult<ProcessedTask> */
export async function queryProcessedTasks(page: PageQuery): Promise<PageResult<ProcessedTask>> {
  const raw = await request<BackendPageResult<ProcessedTask>>({
    method: 'GET',
    url: '/workflow/tasks/processed',
    params: page,
  })
  return adaptPage(raw)
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
