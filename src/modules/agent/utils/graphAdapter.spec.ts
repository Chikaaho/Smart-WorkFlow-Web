import { describe, it, expect } from 'vitest'
import { elementsToFlowGraphData, flowGraphDataToElements, edgeKeyword } from './graphAdapter'
import type { GraphElement } from '@/contracts/agent'

describe('graphAdapter 双向转换', () => {
  it('elements → FlowGraphData → elements 往返一致（config/style 不透明字段不丢失）', () => {
    const elements: GraphElement[] = [
      {
        id: 'start-1',
        kind: 'node',
        type: 'START',
        config: undefined,
        style: { x: 10, y: 20 },
      },
      {
        id: 'llm-1',
        kind: 'node',
        type: 'LLM',
        config: { agentModelConfigId: 7 },
        style: { x: 210, y: 120 },
      },
      {
        id: 'tool-1',
        kind: 'node',
        type: 'TOOL',
        config: { toolName: 'http_echo' },
        style: { x: 410, y: 220 },
      },
      {
        id: 'edge-1',
        kind: 'edge',
        source: 'start-1',
        target: 'llm-1',
        config: undefined,
        style: undefined,
      },
      {
        id: 'edge-2',
        kind: 'edge',
        source: 'llm-1',
        target: 'tool-1',
        config: { keyword: '加急' },
        style: undefined,
      },
    ]

    const data = elementsToFlowGraphData(elements)
    expect(data.nodes).toHaveLength(3)
    expect(data.edges).toHaveLength(2)

    // 坐标读自 style.x/style.y
    expect(data.nodes[0].position).toEqual({ x: 10, y: 20 })
    expect(data.nodes[1].position).toEqual({ x: 210, y: 120 })
    // 业务配置读自 config
    expect(data.nodes[1].data).toEqual({ agentModelConfigId: 7 })
    expect(data.nodes[2].data).toEqual({ toolName: 'http_echo' })
    // 条件边关键词读自 config.keyword → label
    expect(data.edges[1].label).toBe('加急')
    // 无关键词边 label 为 undefined
    expect(data.edges[0].label).toBeUndefined()

    const roundTrip = flowGraphDataToElements(data)
    expect(roundTrip).toHaveLength(5)
    expect(roundTrip[0]).toEqual({
      id: 'start-1',
      kind: 'node',
      type: 'START',
      source: undefined,
      target: undefined,
      config: undefined,
      style: { x: 10, y: 20 },
    })
    expect(roundTrip[1].config).toEqual({ agentModelConfigId: 7 })
    expect(roundTrip[1].style).toEqual({ x: 210, y: 120 })
    expect(roundTrip[2].config).toEqual({ toolName: 'http_echo' })
    // 边：关键词写回 config.keyword
    expect(roundTrip[4].config).toEqual({ keyword: '加急' })
    // 边：无关键词不产生 config（= 默认边语义）
    expect(roundTrip[3].config).toBeUndefined()
  })

  it('空图：零节点零边，往返为空', () => {
    const data = elementsToFlowGraphData([])
    expect(data.nodes).toHaveLength(0)
    expect(data.edges).toHaveLength(0)
    expect(flowGraphDataToElements(data)).toHaveLength(0)
  })

  it('仅 START + END（后端 create 初始图形态），往返不丢拓扑', () => {
    const elements: GraphElement[] = [
      { id: 'start-1', kind: 'node', type: 'START', style: { x: 0, y: 0 } },
      { id: 'end-1', kind: 'node', type: 'END', style: { x: 300, y: 0 } },
      { id: 'edge-1', kind: 'edge', source: 'start-1', target: 'end-1' },
    ]
    const data = elementsToFlowGraphData(elements)
    expect(data.nodes.map((n) => n.type)).toEqual(['START', 'END'])
    expect(data.edges[0]).toMatchObject({ source: 'start-1', target: 'end-1' })

    const roundTrip = flowGraphDataToElements(data)
    expect(roundTrip.map((el) => [el.id, el.kind])).toEqual([
      ['start-1', 'node'],
      ['end-1', 'node'],
      ['edge-1', 'edge'],
    ])
    expect(roundTrip[2].source).toBe('start-1')
    expect(roundTrip[2].target).toBe('end-1')
  })

  it('未知节点类型（预留扩展）不崩溃，原样透传', () => {
    const elements: GraphElement[] = [
      { id: 'loop-1', kind: 'node', type: 'LOOP', style: { x: 1, y: 2 } },
    ]
    const data = elementsToFlowGraphData(elements)
    expect(data.nodes[0].type).toBe('LOOP')
    const roundTrip = flowGraphDataToElements(data)
    expect(roundTrip[0].type).toBe('LOOP')
    expect(roundTrip[0].style).toEqual({ x: 1, y: 2 })
  })

  it('keywordOf 与后端语义一致：缺失/空串/非字符串均视为默认边', () => {
    expect(edgeKeyword({ id: 'e', kind: 'edge' })).toBeNull()
    expect(edgeKeyword({ id: 'e', kind: 'edge', config: {} })).toBeNull()
    expect(edgeKeyword({ id: 'e', kind: 'edge', config: { keyword: '' } })).toBeNull()
    expect(edgeKeyword({ id: 'e', kind: 'edge', config: { keyword: '  ' } })).toBeNull()
    expect(edgeKeyword({ id: 'e', kind: 'edge', config: { keyword: 123 } })).toBeNull()
    expect(edgeKeyword({ id: 'e', kind: 'edge', config: { keyword: '加急' } })).toBe('加急')
  })
})
