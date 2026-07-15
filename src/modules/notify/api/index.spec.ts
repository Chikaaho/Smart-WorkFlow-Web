import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRequest = vi.fn()

vi.mock('@/foundation/request', () => ({
  request: <T>(config: unknown): Promise<T> => mockRequest(config),
}))

const notifyApi = await import('./index')

describe('modules/notify/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queryNotifyMessages sends GET /notify/messages', async () => {
    const messages = [
      {
        id: 1,
        recipientId: 1,
        title: 'Test',
        content: 'Content',
        bizType: 'WF_TODO' as const,
        bizId: null,
        read: false,
        createTime: '2026-07-15T10:00:00',
        updateTime: '2026-07-15T10:00:00',
        createBy: null,
        updateBy: null,
        tenantId: 1,
      },
    ]
    mockRequest.mockResolvedValueOnce(messages)
    const result = await notifyApi.queryNotifyMessages()
    expect(mockRequest).toHaveBeenCalledWith({ method: 'GET', url: '/notify/messages' })
    expect(result).toEqual(messages)
  })

  it('markAsRead sends POST /notify/messages/:id/read', async () => {
    mockRequest.mockResolvedValueOnce(undefined)
    await notifyApi.markAsRead(5)
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/notify/messages/5/read',
    })
  })
})
