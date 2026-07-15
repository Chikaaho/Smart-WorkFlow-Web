import { request } from '@/foundation/request'
import type { NotifyMessage } from '@/contracts/notify'

// ═══════════════════════════════════════
// 通知消息
// ═══════════════════════════════════════

/** GET /notify/messages → NotifyMessage[] */
export async function queryNotifyMessages(): Promise<NotifyMessage[]> {
  return request<NotifyMessage[]>({
    method: 'GET',
    url: '/notify/messages',
  })
}

/** POST /notify/messages/{id}/read → void */
export async function markAsRead(id: number): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/notify/messages/${id}/read`,
  })
}
