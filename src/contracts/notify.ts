// ─── 通知消息 DTO（对齐后端 NotifyMessage） ───
export interface NotifyMessage {
  id: number
  recipientId: number
  title: string
  content: string
  bizType: 'WF_TODO' | 'WF_APPROVED'
  bizId: string | null
  read: boolean
  createTime: string
  updateTime: string
  createBy: number | null
  updateBy: number | null
  tenantId: number
}
