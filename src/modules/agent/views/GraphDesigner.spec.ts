import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/adapters/flow-graph', () => ({
  mountFlowGraph: vi.fn(() => ({ exportGraph: vi.fn(), destroy: vi.fn() })),
}))

vi.mock('@/modules/agent/api', () => ({
  executeGraph: vi.fn(),
  getGraphDef: vi.fn(),
  listModelOptions: vi.fn(),
  listToolOptions: vi.fn(),
  publishGraphDef: vi.fn(),
  saveDraftGraph: vi.fn(),
}))

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: { id: '42' } }),
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>()
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
    ElMessageBox: { prompt: vi.fn(), confirm: vi.fn() },
  }
})

import { mountFlowGraph } from '@/adapters/flow-graph'
import type {
  FlowGraphData,
  FlowGraphEvents,
  FlowGraphInstance,
  FlowGraphNode,
} from '@/adapters/flow-graph'
import {
  executeGraph,
  getGraphDef,
  listModelOptions,
  listToolOptions,
  saveDraftGraph,
} from '@/modules/agent/api'
import {
  NODE_CONFIG_KEY_INPUT_VAR,
  NODE_CONFIG_KEY_OUTPUT_VAR,
} from '@/modules/agent/utils/graphAdapter'
import type { ProcessGraph } from '@/contracts/agent'
import GraphDesigner from './GraphDesigner.vue'

const stubs = {
  'el-alert': {
    template:
      '<div class="el-alert" :class="type"><slot/><div class="alert-title">{{ title }}</div></div>',
    props: ['title', 'type', 'closable', 'showIcon'],
  },
  'el-tag': { template: '<span class="el-tag"><slot/></span>', props: ['size', 'type'] },
  'el-button': {
    template: '<button class="el-button" @click="$emit(\'click\')"><slot/></button>',
    props: ['type', 'size', 'loading', 'plain', 'link'],
  },
  'el-select': {
    template: '<div class="el-select"><slot/></div>',
    props: ['modelValue', 'placeholder'],
  },
  'el-option': {
    template: '<div class="el-option" :data-value="value" :data-label="label"/>',
    props: ['label', 'value'],
  },
  'el-input': {
    template:
      '<input class="el-input" :data-value="String(modelValue ?? \'\')" :data-placeholder="placeholder" @change="$emit(\'change\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'size'],
    // 声明 emits 防止 @change 作为 attrs fallthrough 到根元素（父级收到原生事件而非 $emit 参数）
    emits: ['change'],
  },
  'el-empty': {
    template: '<div class="el-empty">{{ description }}</div>',
    props: ['description', 'imageSize'],
  },
}

const mockGraph: ProcessGraph = {
  graphKey: 'agent_key123',
  name: '客服分流',
  version: 2,
  canvas: {},
  elements: [
    { id: 'start-1', kind: 'node', type: 'START', style: { x: 0, y: 0 } },
    {
      id: 'llm-1',
      kind: 'node',
      type: 'LLM',
      config: { agentModelConfigId: 7 },
      style: { x: 200, y: 0 },
    },
    {
      id: 'tool-1',
      kind: 'node',
      type: 'TOOL',
      config: { toolName: 'http_echo' },
      style: { x: 400, y: 0 },
    },
    { id: 'cond-1', kind: 'node', type: 'CONDITION', style: { x: 600, y: 0 } },
    { id: 'end-1', kind: 'node', type: 'END', style: { x: 800, y: 0 } },
    { id: 'edge-1', kind: 'edge', source: 'start-1', target: 'llm-1' },
    { id: 'edge-2', kind: 'edge', source: 'llm-1', target: 'tool-1' },
    { id: 'edge-3', kind: 'edge', source: 'tool-1', target: 'cond-1' },
    { id: 'edge-4', kind: 'edge', source: 'cond-1', target: 'end-1', config: { keyword: '加急' } },
    { id: 'edge-5', kind: 'edge', source: 'cond-1', target: 'end-1' },
  ],
}

/** 带变量名契约键的图（LLM inputVar/outputVar；TOOL 仅 inputVar） */
const mockVarGraph: ProcessGraph = {
  graphKey: 'agent_key456',
  name: '多变量图',
  version: 1,
  canvas: {},
  elements: [
    { id: 'start-1', kind: 'node', type: 'START', style: { x: 0, y: 0 } },
    {
      id: 'llm-1',
      kind: 'node',
      type: 'LLM',
      config: { agentModelConfigId: 7, inputVar: 'raw', outputVar: 'summary' },
      style: { x: 200, y: 0 },
    },
    {
      id: 'tool-1',
      kind: 'node',
      type: 'TOOL',
      config: { toolName: 'http_echo', inputVar: 'summary' },
      style: { x: 400, y: 0 },
    },
    { id: 'end-1', kind: 'node', type: 'END', style: { x: 600, y: 0 } },
    { id: 'edge-1', kind: 'edge', source: 'start-1', target: 'llm-1' },
    { id: 'edge-2', kind: 'edge', source: 'llm-1', target: 'tool-1' },
    { id: 'edge-3', kind: 'edge', source: 'tool-1', target: 'end-1' },
  ],
}

function mountDesigner() {
  return mount(GraphDesigner, {
    global: { stubs, directives: { loading: {} } },
  })
}

/** 取最近一次挂载的（容器, 数据, 事件） */
function lastMountCall() {
  const calls = vi.mocked(mountFlowGraph).mock.calls
  return calls[calls.length - 1] as [HTMLElement, FlowGraphData, FlowGraphEvents]
}

async function mountLoaded() {
  return mountLoadedWith(mockGraph)
}

async function mountLoadedWith(graph: ProcessGraph) {
  vi.mocked(getGraphDef).mockResolvedValueOnce(graph)
  vi.mocked(listModelOptions).mockResolvedValueOnce([
    { id: 1, name: 'OpenAI 主配置', modelName: 'gpt-4o', protocolType: 'openai', enabled: true },
    { id: 2, name: 'Ollama 本地', modelName: 'qwen2.5', protocolType: 'ollama', enabled: true },
  ])
  vi.mocked(listToolOptions).mockResolvedValueOnce([
    { toolName: 'http_echo', description: 'echo 工具', source: 'internal' },
    { toolName: 'weather_query', description: '天气查询', source: 'external' },
  ])
  const wrapper = mountDesigner()
  await nextTick()
  await nextTick()
  return wrapper
}

function nodeById(data: FlowGraphData, id: string): FlowGraphNode {
  return data.nodes.find((n) => n.id === id)!
}

describe('GraphDesigner.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('加载：getGraphDef(42) → elementsToFlowGraphData → mountFlowGraph 挂载画布', async () => {
    const wrapper = await mountLoaded()
    expect(getGraphDef).toHaveBeenCalledWith(42)
    expect(mountFlowGraph).toHaveBeenCalledTimes(1)

    const [, data] = lastMountCall()
    expect(data.nodes.map((n) => n.type)).toEqual(['START', 'LLM', 'TOOL', 'CONDITION', 'END'])
    // 坐标自 style.x/style.y 转换
    expect(data.nodes[1].position).toEqual({ x: 200, y: 0 })
    // LLM 业务配置回填 data
    expect(data.nodes[1].data).toEqual({ agentModelConfigId: 7 })
    // 条件边关键词 → edge.label
    const edge4 = data.edges.find((e) => e.id === 'edge-4')
    expect(edge4?.label).toBe('加急')
    // 无关键词边 label 为空
    expect(data.edges.find((e) => e.id === 'edge-5')?.label).toBeUndefined()
    wrapper.unmount()
  })

  it('属性面板按节点类型切换：LLM 显示模型下拉、TOOL 显示工具下拉（标注来源）', async () => {
    const wrapper = await mountLoaded()
    const [, data, events] = lastMountCall()

    // 点击 LLM 节点
    events.onNodeClick?.(nodeById(data, 'llm-1'))
    await nextTick()
    expect(wrapper.findAll('.el-select')).toHaveLength(1)
    const llmOptions = wrapper.findAll('.el-option').map((o) => ({
      value: o.attributes('data-value'),
      label: o.attributes('data-label'),
    }))
    expect(llmOptions).toEqual([
      { value: '1', label: 'OpenAI 主配置（gpt-4o）' },
      { value: '2', label: 'Ollama 本地（qwen2.5）' },
    ])

    // 点击 TOOL 节点：合并下拉，value=toolName 精确值，label 标注来源
    events.onNodeClick?.(nodeById(data, 'tool-1'))
    await nextTick()
    const toolOptions = wrapper.findAll('.el-option').map((o) => ({
      value: o.attributes('data-value'),
      label: o.attributes('data-label'),
    }))
    expect(toolOptions).toEqual([
      { value: 'http_echo', label: 'http_echo（内部）' },
      { value: 'weather_query', label: 'weather_query（外部）' },
    ])
    wrapper.unmount()
  })

  it('属性面板按节点类型切换：CONDITION 列出出边关键词输入框（写 edge.label）', async () => {
    const wrapper = await mountLoaded()
    const [, data, events] = lastMountCall()

    // START/END 无可编辑项
    events.onNodeClick?.(nodeById(data, 'start-1'))
    await nextTick()
    expect(wrapper.text()).toContain('开始节点无可编辑属性')

    // CONDITION：出边逐条显示关键词输入框（属性面板内，排除执行面板输入框）
    events.onNodeClick?.(nodeById(data, 'cond-1'))
    await nextTick()
    const inputs = wrapper
      .find('.property-panel')
      .findAll('.el-input')
      .map((i) => i.attributes('data-value'))
    expect(inputs).toEqual(['加急', ''])
    wrapper.unmount()
  })

  it('保存草稿：flowGraphDataToElements 组装 ProcessGraph 参数正确', async () => {
    const wrapper = await mountLoaded()
    vi.mocked(saveDraftGraph).mockResolvedValueOnce(undefined)

    const vm = wrapper.vm as unknown as { handleSaveDraft: () => Promise<void> }
    await vm.handleSaveDraft()

    expect(saveDraftGraph).toHaveBeenCalledTimes(1)
    const [id, graph] = vi.mocked(saveDraftGraph).mock.calls[0] as [number, ProcessGraph]
    expect(id).toBe(42)
    expect(graph.graphKey).toBe('agent_key123')
    expect(graph.name).toBe('客服分流')
    expect(graph.version).toBe(2)
    expect(graph.canvas).toEqual({})
    // 往返转换：节点 config/style 回填、边关键词回填 config.keyword
    const llmEl = graph.elements.find((el) => el.id === 'llm-1')
    expect(llmEl).toMatchObject({
      kind: 'node',
      type: 'LLM',
      config: { agentModelConfigId: 7 },
      style: { x: 200, y: 0 },
    })
    const edge4 = graph.elements.find((el) => el.id === 'edge-4')
    expect(edge4?.config).toEqual({ keyword: '加急' })
    const edge5 = graph.elements.find((el) => el.id === 'edge-5')
    expect(edge5?.config).toBeUndefined()
    wrapper.unmount()
  })

  it('执行成功：executeGraph 返回 success=true，展示 output 与耗时', async () => {
    const wrapper = await mountLoaded()
    vi.mocked(executeGraph).mockResolvedValueOnce({
      success: true,
      output: '您好，请问需要什么帮助？',
      latencyMs: 1234,
    })

    const vm = wrapper.vm as unknown as {
      executeInput: string
      handleExecute: () => Promise<void>
    }
    vm.executeInput = '你好'
    await vm.handleExecute()

    expect(executeGraph).toHaveBeenCalledWith(42, '你好')
    await nextTick()
    const html = wrapper.html()
    expect(html).toContain('执行成功')
    expect(html).toContain('输出：您好，请问需要什么帮助？')
    expect(html).toContain('耗时 1234ms')
    wrapper.unmount()
  })

  it('执行失败：success=false 展示 errorMessage（不上抛）', async () => {
    const wrapper = await mountLoaded()
    vi.mocked(executeGraph).mockResolvedValueOnce({
      success: false,
      output: undefined,
      errorMessage: '条件分支无匹配且无默认边: cond-1',
      latencyMs: 3,
    })

    const vm = wrapper.vm as unknown as {
      executeInput: string
      handleExecute: () => Promise<void>
    }
    vm.executeInput = '随便什么'
    await vm.handleExecute()

    await nextTick()
    const html = wrapper.html()
    expect(html).toContain('执行失败')
    expect(html).toContain('原因：条件分支无匹配且无默认边: cond-1')
    expect(html).toContain('耗时 3ms')
    wrapper.unmount()
  })

  it('卸载时销毁画布实例', async () => {
    const wrapper = await mountLoaded()
    const instance = vi.mocked(mountFlowGraph).mock.results[0].value as FlowGraphInstance
    wrapper.unmount()
    expect(instance.destroy).toHaveBeenCalledTimes(1)
  })

  it('变量名输入项：LLM/TOOL 属性面板各渲染两个输入框，回填 data 既有值，placeholder 提示默认变量', async () => {
    const wrapper = await mountLoadedWith(mockVarGraph)
    const [, data, events] = lastMountCall()

    // LLM：inputVar/outputVar 回填，placeholder 含默认变量提示
    events.onNodeClick?.(nodeById(data, 'llm-1'))
    await nextTick()
    const llmInputs = wrapper
      .find('.property-panel')
      .findAll('.el-input')
      .map((i) => ({
        value: i.attributes('data-value'),
        placeholder: i.attributes('data-placeholder'),
      }))
    expect(llmInputs).toHaveLength(2)
    expect(llmInputs[0].value).toBe('raw')
    expect(llmInputs[1].value).toBe('summary')
    expect(llmInputs[0].placeholder).toBe('留空 = 默认变量 input')
    expect(llmInputs[1].placeholder).toBe('留空 = 默认变量 input')

    // TOOL：仅 inputVar 回填，outputVar 留空
    events.onNodeClick?.(nodeById(data, 'tool-1'))
    await nextTick()
    const toolInputs = wrapper
      .find('.property-panel')
      .findAll('.el-input')
      .map((i) => i.attributes('data-value'))
    expect(toolInputs).toEqual(['summary', ''])
    wrapper.unmount()
  })

  it('LLM 变量名输入写回：经 handleVarNameChange 落 data.inputVar/outputVar（合并写不丢既有键）', async () => {
    const wrapper = await mountLoaded()
    const [, data, events] = lastMountCall()
    events.onNodeClick?.(nodeById(data, 'llm-1'))
    await nextTick()

    const inputs = wrapper.find('.property-panel').findAll('.el-input')
    ;(inputs[0].element as HTMLInputElement).value = 'raw'
    await inputs[0].trigger('change')
    await nextTick()
    ;(inputs[1].element as HTMLInputElement).value = 'summary'
    await inputs[1].trigger('change')
    await nextTick()

    expect(nodeById(data, 'llm-1').data).toEqual({
      agentModelConfigId: 7,
      inputVar: 'raw',
      outputVar: 'summary',
    })
    wrapper.unmount()
  })

  it('变量名留空（含空白）：移除 data 键，不落 config（= 默认变量零迁移语义）', async () => {
    const wrapper = await mountLoaded()
    const [, data, events] = lastMountCall()
    events.onNodeClick?.(nodeById(data, 'llm-1'))
    await nextTick()

    const inputs = wrapper.find('.property-panel').findAll('.el-input')
    ;(inputs[0].element as HTMLInputElement).value = 'raw'
    await inputs[0].trigger('change')
    await nextTick()
    expect(nodeById(data, 'llm-1').data?.[NODE_CONFIG_KEY_INPUT_VAR]).toBe('raw')

    // 清空为空白串 → 键被移除
    ;(inputs[0].element as HTMLInputElement).value = '   '
    await inputs[0].trigger('change')
    await nextTick()
    expect(nodeById(data, 'llm-1').data?.[NODE_CONFIG_KEY_INPUT_VAR]).toBeUndefined()
    expect(Object.keys(nodeById(data, 'llm-1').data ?? {})).not.toContain(NODE_CONFIG_KEY_INPUT_VAR)
    expect(nodeById(data, 'llm-1').data?.[NODE_CONFIG_KEY_OUTPUT_VAR]).toBeUndefined()
    wrapper.unmount()
  })

  it('TOOL 变量名输入写回：落 data.inputVar/outputVar，保存草稿后 config 含精确契约键往返', async () => {
    const wrapper = await mountLoaded()
    const [, data, events] = lastMountCall()
    events.onNodeClick?.(nodeById(data, 'tool-1'))
    await nextTick()

    const inputs = wrapper.find('.property-panel').findAll('.el-input')
    ;(inputs[0].element as HTMLInputElement).value = 'final'
    await inputs[0].trigger('change')
    await nextTick()
    ;(inputs[1].element as HTMLInputElement).value = 'final_out'
    await inputs[1].trigger('change')
    await nextTick()
    expect(nodeById(data, 'tool-1').data).toEqual({
      toolName: 'http_echo',
      inputVar: 'final',
      outputVar: 'final_out',
    })

    // 保存草稿：flowGraphDataToElements 整包往返，config 含 inputVar/outputVar 契约键
    vi.mocked(saveDraftGraph).mockResolvedValueOnce(undefined)
    const vm = wrapper.vm as unknown as { handleSaveDraft: () => Promise<void> }
    await vm.handleSaveDraft()

    const [, graph] = vi.mocked(saveDraftGraph).mock.calls[0] as [number, ProcessGraph]
    const toolEl = graph.elements.find((el) => el.id === 'tool-1')
    expect(toolEl?.config).toEqual({
      toolName: 'http_echo',
      inputVar: 'final',
      outputVar: 'final_out',
    })
    wrapper.unmount()
  })
})
