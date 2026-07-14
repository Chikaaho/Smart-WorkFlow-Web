// ─── 待办任务 DTO（对齐后端 TodoTaskRespDTO） ───
export interface TodoTask {
  taskId: string
  processInstanceId: string
  formKey: string
  businessKey: string
  createTime: string
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
