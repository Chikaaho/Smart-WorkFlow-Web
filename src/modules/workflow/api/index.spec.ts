import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRequest = vi.fn()

vi.mock('@/foundation/request', () => ({
  request: <T>(config: unknown): Promise<T> => mockRequest(config),
}))

const workflowApi = await import('./index')

describe('modules/workflow/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queryTodoTasks sends GET /workflow/tasks/todo', async () => {
    const tasks = [
      {
        taskId: 't1',
        processInstanceId: 'p1',
        formKey: 'fk',
        businessKey: 'bk',
        createTime: '2026-07-14T10:00:00',
      },
    ]
    mockRequest.mockResolvedValueOnce(tasks)
    const result = await workflowApi.queryTodoTasks()
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/workflow/tasks/todo' })
    expect(result).toEqual(tasks)
  })

  it('completeTask sends POST /workflow/tasks/{taskId}/complete', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await workflowApi.completeTask('task-001')
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/workflow/tasks/task-001/complete',
    })
  })

  it('pageProcessDefs sends GET /workflow/defs and adapts records→list', async () => {
    mockRequest.mockResolvedValueOnce({
      records: [
        {
          id: 1,
          processKey: 'sk',
          name: 'N',
          formKey: 'fk',
          defVersion: 1,
          status: 'PUBLISHED',
          createTime: '',
          updateTime: '',
        },
      ],
      total: 1,
      pageNum: 1,
      pageSize: 10,
    })
    const result = await workflowApi.pageProcessDefs({ pageNum: 1, pageSize: 10 })
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/workflow/defs',
      params: { pageNum: 1, pageSize: 10 },
    })
    expect(result.list).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})
