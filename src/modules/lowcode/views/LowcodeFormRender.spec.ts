import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { formKey: 'test-form-key' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/modules/lowcode/api/form', () => ({
  getFormDefinition: vi.fn(),
  submitForm: vi.fn(),
}))

import { getFormDefinition } from '@/modules/lowcode/api/form'
import LowcodeFormRender from './LowcodeFormRender.vue'

describe('LowcodeFormRender', () => {
  beforeEach(() => {
    vi.mocked(getFormDefinition).mockReset()
  })

  it('renders one wrapper div per field (data-field-name) for given FormSchema', async () => {
    vi.mocked(getFormDefinition).mockResolvedValueOnce({
      title: '测试表单',
      fields: [
        { name: 'f1', type: 'TEXT', required: false },
        { name: 'f2', type: 'NUMBER', required: false },
        { name: 'f3', type: 'BOOL', required: false },
        { name: 'f4', type: 'DATE', required: false },
        { name: 'f5', type: 'REFERENCE', required: false },
      ],
    })

    const wrapper = mount(LowcodeFormRender, {
      global: {
        stubs: {
          DictSelect: { template: '<select />' },
          ElDatePicker: { template: '<input type="text" />' },
          ElInputNumber: { template: '<input type="number" />' },
          ElSkeleton: { template: '<div />' },
          ElEmpty: { template: '<div />' },
          ElAlert: { template: '<div />' },
        },
      },
    })

    await flushPromises()

    const fields = wrapper.findAll('[data-field-name]')
    expect(fields).toHaveLength(5)
  })

  it('renders form title from schema', async () => {
    vi.mocked(getFormDefinition).mockResolvedValueOnce({
      title: '我的业务表单',
      fields: [{ name: 'x', type: 'TEXT', required: false }],
    })

    const wrapper = mount(LowcodeFormRender, {
      global: {
        stubs: {
          DictSelect: { template: '<select />' },
          ElDatePicker: { template: '<input />' },
          ElInputNumber: { template: '<input type="number" />' },
          ElSkeleton: { template: '<div />' },
          ElEmpty: { template: '<div />' },
          ElAlert: { template: '<div />' },
        },
      },
    })

    await flushPromises()
    expect(wrapper.text()).toContain('我的业务表单')
  })

  it('renders DICT and TABLE field types', async () => {
    vi.mocked(getFormDefinition).mockResolvedValueOnce({
      title: 'F',
      fields: [
        { name: 'd1', type: 'DICT', dictType: 'some_type', required: false },
        {
          name: 't1',
          type: 'TABLE',
          required: false,
          subFields: [{ name: 'col', type: 'TEXT' }],
        },
      ],
    })

    const wrapper = mount(LowcodeFormRender, {
      global: {
        stubs: {
          DictSelect: { template: '<select data-testid="dict-select" />' },
          ElDatePicker: { template: '<input />' },
          ElInputNumber: { template: '<input type="number" />' },
          ElSkeleton: { template: '<div />' },
          ElEmpty: { template: '<div />' },
          ElAlert: { template: '<div />' },
        },
      },
    })

    await flushPromises()

    const fields = wrapper.findAll('[data-field-name]')
    expect(fields).toHaveLength(2)
    expect(wrapper.find('[data-testid="dict-select"]').exists()).toBe(true)
  })

  it('shows error message when schema loading fails', async () => {
    vi.mocked(getFormDefinition).mockRejectedValueOnce(new Error('load failed'))

    const wrapper = mount(LowcodeFormRender, {
      global: {
        stubs: {
          ElSkeleton: { template: '<div />' },
          ElEmpty: { template: '<div data-testid="empty" />' },
          ElAlert: {
            props: ['title'],
            template: '<div class="el-alert">{{ title }}</div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('表单定义加载失败')
  })
})
