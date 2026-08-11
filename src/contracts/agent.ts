// ═══════════════════════════════════════════════════════════════
// agent 模块契约：字段与后端 DTO 严格对齐（M07-F02 Step9 现场核对）
//
// 对照后端（Smart-WorkFlow sw-basic-agent）：
//   AgentGraphDef       ← AgentGraphDefDTO（列表/发布响应，不含 graph_json 大字段）
//   GraphElement        ← dto/graph/GraphElement（config/style 为后端不透明 Map，
//                        前端只写、后端原样透传；坐标存 style.x/style.y 是前端裁定，
//                        不是后端契约，见 modules/agent/utils/graphAdapter.ts 顶部注释）
//   ProcessGraph        ← dto/graph/ProcessGraph
//   AgentGraphExecute*  ← AgentGraphExecuteReq/RespDTO（success=false 表示运行时失败）
//   AgentModelConfigDTO ← GET /agent/models 分页响应（LLM 节点下拉数据源）
//   AgentTool*ConfigDTO ← GET /agent/tool/{internal,external} 分页响应（TOOL 节点下拉）
// ═══════════════════════════════════════════════════════════════

/** 图定义（列表/发布响应 DTO，不含 graph_json 大字段）。 */
export interface AgentGraphDef {
  id: number
  /** 图业务 key（发布后冻结） */
  graphKey: string
  /** 图名称 */
  name: string
  /** 定义版本号（每次发布递增） */
  defVersion: number
  /** 状态：DRAFT / PUBLISHED */
  status: 'DRAFT' | 'PUBLISHED' | string
  createTime: string
  updateTime: string
}

/** 图元素 —— 节点或边（对齐后端 GraphElement）。 */
export interface GraphElement {
  /** 元素唯一标识（设计器分配） */
  id: string
  /** 元素种类："node" | "edge" */
  kind: 'node' | 'edge'
  /** 节点类型（START/END/LLM/TOOL/CONDITION/…），边为 null */
  type?: string
  /** 边起点节点 id（仅边使用） */
  source?: string
  /** 边终点节点 id（仅边使用） */
  target?: string
  /** 不透明配置（后端不解释，原样透传） */
  config?: Record<string, unknown>
  /** 不透明样式（画布样式，原样透传；坐标 x/y 存此处，前端裁定） */
  style?: Record<string, unknown>
}

/** 图定义模型（对齐后端 ProcessGraph，即 graph_json 的序列化格式）。 */
export interface ProcessGraph {
  graphKey: string
  name: string
  version: number
  elements: GraphElement[]
  /** 画布元数据（不透明，原样透传） */
  canvas: Record<string, unknown>
}

/** 创建图定义请求（仅名称；graphKey 与初始 START→END 图由服务端生成）。 */
export interface AgentGraphCreateReq {
  name: string
}

/** 图执行请求（Step8：单一 input 文本作为初始累积文本）。 */
export interface AgentGraphExecuteReq {
  input: string
}

/** 图执行响应（Step8：运行时失败以 success=false + errorMessage 表达，不上抛）。 */
export interface AgentGraphExecuteResp {
  success: boolean
  /** 最终输出文本（END 节点处的累积文本，成功时非空） */
  output?: string
  /** 失败原因摘要（不含明文 API Key） */
  errorMessage?: string
  /** 执行耗时（毫秒） */
  latencyMs: number
}

/** 模型配置下拉选项（对齐 AgentModelConfigDTO 的只读展示字段）。 */
export interface AgentModelConfigOption {
  id: number
  name: string
  modelName: string
  protocolType: string
  enabled: boolean
}

/** 工具下拉选项（internal/external 合并展示，value 必须是后端 name 精确值）。 */
export interface AgentToolOption {
  /** 后端工具名（internal/external 两表 name 精确值，Step8 解释器按此精确匹配） */
  toolName: string
  description?: string
  /** 来源标注：internal / external */
  source: 'internal' | 'external'
}
