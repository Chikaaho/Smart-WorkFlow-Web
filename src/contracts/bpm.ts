// ─── 待办任务 DTO（对齐后端 TodoTaskRespDTO） ───
export interface TodoTask {
  taskId: string
  processInstanceId: string
  processName: string // 来自 BpmProcessDef.name，可为空字符串
  formKey: string
  businessKey: string
  createTime: string
}

// ─── 任务详情 DTO（对齐后端 TaskDetailRespDTO） ───
export interface TaskDetail {
  taskId: string
  taskName: string
  processInstanceId: string
  processDefinitionKey: string
  processName: string | null // 流程定义被删除时为 null
  formKey: string
  businessKey: string
  assignee: string
  initiatorId: number // 后端 Long → JSON number
  createTime: string // LocalDateTime → ISO-8601 string
  processVariables: Record<string, unknown> // Map<String, Object>
  approvalHistory: ApprovalHistoryItem[]
}

// ─── 审批历史项 DTO（对齐后端 ApprovalHistoryItemDTO） ───
export interface ApprovalHistoryItem {
  taskId: string
  taskName: string
  assignee: string
  createTime: string
  endTime: string | null // 可能为 null
}

// ─── 已办任务 DTO（对齐后端 ProcessedTaskRespDTO） ───
export interface ProcessedTask {
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string | null // 流程定义被删除时为 null
  formKey: string
  businessKey: string
  createTime: string
  endTime: string | null // 极端历史数据可能为 null
}

// ─── 流程定义列表项 DTO（对齐后端 BpmProcessDef，不含 graph_json） ───
export interface ProcessDef {
  id: number
  processKey: string
  name: string
  formKey: string
  defVersion: number
  status: 'DRAFT' | 'PUBLISHED'
  createTime: string
  updateTime: string
}
