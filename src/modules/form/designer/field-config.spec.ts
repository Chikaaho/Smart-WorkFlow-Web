import { describe, it, expect } from 'vitest'
import { applyFieldPatch, type FieldPatch } from './field-config'
import type { DictField, TextField } from '@/contracts/form-schema'

describe('field-config', () => {
  it('applyFieldPatch merges contract keys in place (single source, same object ref)', () => {
    const field: TextField = { name: 'col_a', type: 'TEXT', label: '旧标签', required: false }
    applyFieldPatch(field, { label: '新标签', name: 'col_b', required: true, length: 50 })
    expect(field).toEqual({
      name: 'col_b',
      type: 'TEXT',
      label: '新标签',
      required: true,
      length: 50,
    })
  })

  it('applyFieldPatch writes DICT-specific keys (dictType / renderAs)', () => {
    const field: DictField = {
      name: 'd',
      type: 'DICT',
      label: '字典',
      required: false,
      dictType: '',
    }
    applyFieldPatch(field, { dictType: 'dept', renderAs: 'radio' })
    expect(field.dictType).toBe('dept')
    expect(field.renderAs).toBe('radio')
  })

  it('FieldPatch carries only existing schema keys (compile-time guard against dirty keys)', () => {
    // 仅契约已有键可进补丁；占位/默认值/min/max 等无契约键无法出现在此对象，
    // 一旦有人想塞自造键，TypeScript 编译期即报错（本断言锁住允许键集合）。
    const patch: FieldPatch = {
      label: 'x',
      name: 'y',
      required: true,
      length: 1,
      dictType: 'z',
      renderAs: 'select',
    }
    expect(Object.keys(patch).sort()).toEqual(
      ['dictType', 'label', 'length', 'name', 'renderAs', 'required'].sort(),
    )
  })
})
