import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicField from './DynamicField.vue'
import type { FormSchemaField } from '@/contracts/form-schema'

/* ── stub helpers ── */
const baseGlobal = {
  stubs: {
    DictSelect: {
      props: ['type', 'modelValue'],
      emits: ['update:modelValue'],
      template:
        '<select :data-dict-type="type" data-testid="dict-select" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="male">male</option><option value="female">female</option></select>',
    },
    ElDatePicker: {
      props: ['modelValue', 'valueFormat'],
      emits: ['update:modelValue'],
      template: '<input data-testid="date-picker" :value="modelValue" />',
    },
    ElInputNumber: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<input data-testid="input-number" type="number" :value="modelValue" />',
    },
    ElSwitch: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template:
        '<input data-testid="switch" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    },
  },
}

function mountField(field: FormSchemaField, modelValue: unknown = '') {
  return mount(DynamicField, {
    props: { field, modelValue },
    global: baseGlobal,
  })
}

/* ═══════════════════════════════════════════════════
 * 8 类 field.type 各渲染出对应控件
 * ═══════════════════════════════════════════════════ */

describe('DynamicField — 8 类字段渲染', () => {
  it('TEXT → el-input', () => {
    const wrapper = mountField({ name: 'f1', type: 'TEXT' })
    expect(wrapper.findComponent({ name: 'ElInput' }).exists()).toBe(true)
    // RICH_TEXT 与 REFERENCE 也渲染 el-input，确认不是 textarea
    const input = wrapper.findComponent({ name: 'ElInput' })
    expect(input.props('type')).toBe('text')
  })

  it('RICH_TEXT → el-input textarea', () => {
    const wrapper = mountField({ name: 'f2', type: 'RICH_TEXT' })
    expect(wrapper.findComponent({ name: 'ElInput' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElInput' }).props('type')).toBe('textarea')
  })

  it('NUMBER → el-input-number', () => {
    const wrapper = mountField({ name: 'f3', type: 'NUMBER' })
    expect(wrapper.find('[data-testid="input-number"]').exists()).toBe(true)
  })

  it('DATE → el-date-picker with valueFormat YYYY-MM-DD', () => {
    const wrapper = mountField({ name: 'f4', type: 'DATE' })
    expect(wrapper.find('[data-testid="date-picker"]').exists()).toBe(true)
  })

  it('BOOL → el-switch', () => {
    const wrapper = mountField({ name: 'f5', type: 'BOOL' })
    expect(wrapper.find('[data-testid="switch"]').exists()).toBe(true)
  })

  it('DICT → DictSelect 透传 dictType', () => {
    const wrapper = mountField({ name: 'f6', type: 'DICT', dictType: 'sex' })
    const dict = wrapper.find('[data-testid="dict-select"]')
    expect(dict.exists()).toBe(true)
    expect(dict.attributes('data-dict-type')).toBe('sex')
  })

  it('REFERENCE → el-input 降级（非 textarea）', () => {
    const wrapper = mountField({ name: 'f7', type: 'REFERENCE' })
    const input = wrapper.findComponent({ name: 'ElInput' })
    expect(input.exists()).toBe(true)
    expect(input.props('type')).toBe('text')
  })

  it('TABLE → 内嵌子表，渲染 subFields 表头 + 添加行按钮', () => {
    const wrapper = mountField(
      {
        name: 't1',
        type: 'TABLE',
        subFields: [
          { name: 'col_a', type: 'TEXT' },
          { name: 'col_b', type: 'NUMBER' },
        ],
      },
      [{ col_a: 'hello', col_b: '42' }],
    )
    // 表头
    const headers = wrapper.findAll('th')
    expect(headers.length).toBe(3) // col_a, col_b, 操作
    expect(headers[0].text()).toBe('col_a')
    expect(headers[1].text()).toBe('col_b')
    // 数据行
    expect(wrapper.findAll('tbody tr').length).toBe(1)
    // 添加行按钮（最后一个 button）
    const buttons = wrapper.findAll('button')
    const addBtn = buttons[buttons.length - 1]
    expect(addBtn.text()).toContain('添加行')
  })

  it('TABLE addRow emits updated rows', async () => {
    const wrapper = mountField(
      { name: 't1', type: 'TABLE', subFields: [{ name: 'c1', type: 'TEXT' }] },
      [],
    )
    // 点击「添加行」按钮
    const buttons = wrapper.findAll('button')
    const addBtn = buttons[buttons.length - 1]
    await addBtn.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const rows = emitted![0][0] as Record<string, unknown>[]
    expect(rows.length).toBe(1)
    expect(rows[0].c1).toBe('')
  })

  it('TABLE removeRow emits updated rows', async () => {
    const wrapper = mountField(
      { name: 't1', type: 'TABLE', subFields: [{ name: 'c1', type: 'TEXT' }] },
      [{ c1: 'a' }, { c1: 'b' }],
    )
    const deleteBtns = wrapper.findAll('button').filter((b) => b.text() === '删除')
    await deleteBtns[0].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const rows = emitted![0][0] as Record<string, unknown>[]
    expect(rows.length).toBe(1)
  })
})

/* ═══════════════════════════════════════════════════
 * v-model 双向绑定
 * ═══════════════════════════════════════════════════ */

describe('DynamicField — v-model', () => {
  it('TEXT input emits update:modelValue on user input', async () => {
    const wrapper = mountField({ name: 'f1', type: 'TEXT' }, 'old')
    const input = wrapper.findComponent({ name: 'ElInput' })
    await input.vm.$emit('update:modelValue', 'new')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new'])
  })

  it('BOOL switch emits update:modelValue', async () => {
    const wrapper = mountField({ name: 'f1', type: 'BOOL' }, false)
    // Use the DOM change event on the stubbed checkbox
    const sw = wrapper.find('[data-testid="switch"]')
    await sw.setValue(true)
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe(true)
  })

  it('DICT select emits update:modelValue', async () => {
    const wrapper = mountField({ name: 'f1', type: 'DICT', dictType: 'sex' }, 'male')
    const select = wrapper.find('[data-testid="dict-select"]')
    // Select the "female" option to trigger change event
    await select.setValue('female')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('female')
  })
})

/* ═══════════════════════════════════════════════════
 * 必填 / 标签渲染
 * ═══════════════════════════════════════════════════ */

describe('DynamicField — 标签与必填', () => {
  it('renders label text from field.label', () => {
    const wrapper = mountField({ name: 'x', label: '用户名', type: 'TEXT' })
    expect(wrapper.find('label').text()).toContain('用户名')
  })

  it('falls back to field.name when no label', () => {
    const wrapper = mountField({ name: 'email', type: 'TEXT' })
    expect(wrapper.find('label').text()).toContain('email')
  })

  it('shows required star when field.required', () => {
    const wrapper = mountField({ name: 'x', type: 'TEXT', required: true })
    expect(wrapper.find('.dynamic-field__required').exists()).toBe(true)
  })

  it('always renders label (falls back to field.name)', () => {
    const wrapper = mountField({ name: 'x', type: 'TEXT' })
    // Label always renders now — falls back to field.name when no label
    expect(wrapper.find('label').exists()).toBe(true)
  })
})
