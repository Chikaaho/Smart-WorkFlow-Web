import { describe, it, expect } from 'vitest'
import { FIELD_TYPE_REGISTRY, getFieldTypeDescriptor } from './field-types'
import type { FieldType } from '@/contracts/form-schema'

// 与契约「启用类型」全集对齐——新增/删减启用类型时本断言会逼着同步注册表。
const ENABLED_TYPES: FieldType[] = [
  'TEXT',
  'RICH_TEXT',
  'NUMBER',
  'DATE',
  'BOOL',
  'DICT',
  'REFERENCE',
  'TABLE',
]

describe('FIELD_TYPE_REGISTRY', () => {
  it('covers exactly the 8 enabled field types, one descriptor each', () => {
    const types = FIELD_TYPE_REGISTRY.map((d) => d.type)
    expect(types).toHaveLength(ENABLED_TYPES.length)
    expect(new Set(types)).toEqual(new Set(ENABLED_TYPES))
  })

  it('every descriptor carries label + icon + null config slot (filled in 第二刀)', () => {
    for (const d of FIELD_TYPE_REGISTRY) {
      expect(d.label).toBeTruthy()
      expect(d.icon).toBeTruthy()
      expect(d.configComponent).toBeNull()
    }
  })

  it('createDefault produces contract-shaped fields keyed by the real schema keys', () => {
    for (const d of FIELD_TYPE_REGISTRY) {
      const field = d.createDefault('col_x')
      expect(field.name).toBe('col_x')
      expect(field.type).toBe(d.type)
      expect(field.required).toBe(false)
      expect(field.label).toBeTruthy()
    }
  })

  it('DICT default carries dictType; TABLE default carries subFields (contract requirements)', () => {
    const dict = getFieldTypeDescriptor('DICT')!.createDefault('d')
    expect(dict).toMatchObject({ type: 'DICT', dictType: '' })

    const table = getFieldTypeDescriptor('TABLE')!.createDefault('t')
    expect(table).toMatchObject({ type: 'TABLE', subFields: [] })
  })

  it('getFieldTypeDescriptor looks up by type / misses gracefully', () => {
    expect(getFieldTypeDescriptor('TEXT')?.type).toBe('TEXT')
    expect(getFieldTypeDescriptor('IMAGE' as FieldType)).toBeUndefined()
  })
})
