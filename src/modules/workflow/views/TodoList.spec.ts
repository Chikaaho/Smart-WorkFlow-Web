import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/modules/workflow/api', () => ({
  queryTodoTasks: vi.fn(),
  completeTask: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn(),
    },
  }
})

import { queryTodoTasks, completeTask } from '@/modules/workflow/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import type { TodoTask } from '@/contracts/bpm'
import TodoList from './TodoList.vue'

const stubs = {
  StandardListTemplate: {
    template: '<div><slot/></div>',
    props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
    emits: ['update:pageNum', 'update:pageSize'],
  },
  'el-alert': { template: '<div class="el-alert">{{ title }}</div>', props: ['title', 'type'] },
  'el-table': { template: '<div><slot/></div>' },
  'el-table-column': { template: '<div/>' },
  'el-button': { template: '<button><slot/></button>' },
}

const mockTask: TodoTask = {
  taskId: 'mock-task-001',
  processInstanceId: 'mock-proc-001',
  formKey: 'leave-request',
  businessKey: 'fd_001',
  createTime: '2026-07-10T09:15:00',
}

describe('TodoList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls queryTodoTasks on mount', async () => {
    vi.mocked(queryTodoTasks).mockResolvedValueOnce([mockTask])
    mount(TodoList, { global: { stubs } })
    await nextTick()
    expect(queryTodoTasks).toHaveBeenCalledOnce()
  })

  it('shows fallback error message when API fails with non-ApiError', async () => {
    vi.mocked(queryTodoTasks).mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(TodoList, { global: { stubs } })
    await nextTick()
    await nextTick()
    expect(wrapper.vm).toHaveProperty('errorMsg', '加载待办任务失败')
  })

  it('shows ApiError message when API returns business error', async () => {
    vi.mocked(queryTodoTasks).mockRejectedValueOnce(new ApiError(2001, '任务列表为空'))
    const wrapper = mount(TodoList, { global: { stubs } })
    await nextTick()
    await nextTick()
    expect(wrapper.vm).toHaveProperty('errorMsg', '任务列表为空')
  })

  it('calls completeTask and removes task on approve', async () => {
    vi.mocked(queryTodoTasks).mockResolvedValueOnce([mockTask])
    vi.mocked(completeTask).mockResolvedValueOnce(undefined)
    vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce('confirm' as never)

    const wrapper = mount(TodoList, { global: { stubs } })
    await nextTick()

    // 直接调用 handleApprove（避免 stub 渲染限制）
    await (
      wrapper.vm as unknown as { handleApprove: (r: TodoTask) => Promise<void> }
    ).handleApprove(mockTask)
    await nextTick()

    expect(completeTask).toHaveBeenCalledWith('mock-task-001')
    expect(ElMessage.success).toHaveBeenCalledWith('审批通过')
    expect((wrapper.vm as unknown as { list: TodoTask[] }).list).toHaveLength(0)
  })

  it('does not call completeTask when user cancels confirm', async () => {
    vi.mocked(queryTodoTasks).mockResolvedValueOnce([mockTask])
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

    const wrapper = mount(TodoList, { global: { stubs } })
    await nextTick()

    await (
      wrapper.vm as unknown as { handleApprove: (r: TodoTask) => Promise<void> }
    ).handleApprove(mockTask)
    await nextTick()

    expect(completeTask).not.toHaveBeenCalled()
  })
})
