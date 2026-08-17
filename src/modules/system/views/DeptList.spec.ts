import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/modules/system/api/dept', () => ({
  listDeptTree: vi.fn(),
  getDept: vi.fn(),
  createDept: vi.fn(),
  updateDept: vi.fn(),
  deleteDept: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {}, params: {} }),
}))

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    ElMessage: { success: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: vi.fn() },
  }
})

import { listDeptTree, createDept, deleteDept } from '@/modules/system/api/dept'
import type { SysDept } from '@/modules/system/types/dept'
import DeptList from './DeptList.vue'

describe('DeptList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listDeptTree).mockResolvedValue([])
  })

  const minimalStubs = {
    ListToolbar: {
      template: '<div><slot name="actions"/></div>',
      props: ['title', 'total'],
    },
    StandardFormTemplate: {
      template: '<div><slot name="alert"/><slot/></div>',
      props: ['embedded'],
    },
    FormSection: { template: '<div><slot/></div>' },
    FormGrid: { template: '<div><slot/></div>', props: ['columns'] },
    'el-button': { template: '<button @click="$emit(\'click\')"><slot/></button>' },
    'el-table': { template: '<div><slot/></div>', props: ['data', 'rowKey'] },
    'el-table-column': { template: '<div/>' },
    'el-dialog': { template: '<div v-if="modelValue"><slot/></div>', props: ['modelValue'] },
    'el-input': { template: '<input/>', props: ['modelValue', 'placeholder'] },
    'el-input-number': { template: '<input type="number"/>', props: ['modelValue'] },
    'el-select': { template: '<select/>', props: ['modelValue'] },
    'el-option': { template: '<option/>' },
    'el-tree-select': { template: '<select/>', props: ['modelValue'] },
    'el-tag': { template: '<span><slot/></span>' },
    'el-alert': { template: '<div><slot/></div>', props: ['title', 'type'] },
  }

  // ─── API 交互 ───

  it('calls listDeptTree on mount', () => {
    mount(DeptList, { global: { stubs: minimalStubs } })
    expect(listDeptTree).toHaveBeenCalledWith()
  })

  // ─── 树形数据 ───

  it('builds tree from flat data via loadTree', async () => {
    const flatData: SysDept[] = [
      { id: '1', parentId: '0', name: '总公司', code: 'HQ', status: 0 },
      { id: '2', parentId: '1', name: '技术部', code: 'tech', status: 0 },
      { id: '3', parentId: '1', name: '市场部', code: 'mkt', status: 0 },
    ]
    vi.mocked(listDeptTree).mockResolvedValue(flatData)

    const wrapper = mount(DeptList, { global: { stubs: minimalStubs } })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      treeData: SysDept[]
    }

    // 根节点 1 个（总公司），含 2 个子部门
    expect(vm.treeData).toHaveLength(1)
    expect(vm.treeData[0].children).toHaveLength(2)
    expect(vm.treeData[0].children![0].name).toBe('技术部')
  })

  // ─── 删除 ───

  it('deleteDept can be called and propagates', async () => {
    vi.mocked(deleteDept).mockResolvedValue(undefined)
    await deleteDept('1')
    expect(deleteDept).toHaveBeenCalledWith('1')
  })

  // ─── 状态语义（I51：0=正常 / 1=停用，无锁定） ───

  it('新建表单默认 status=0（正常），openCreate 重置后仍为 0', () => {
    const wrapper = mount(DeptList, { global: { stubs: minimalStubs } })
    const vm = wrapper.vm as unknown as {
      form: SysDept
      openCreate: () => void
    }
    expect(vm.form.status).toBe(0)
    vm.openCreate()
    expect(vm.form.status).toBe(0)
  })

  it('选择「停用」(status=1) 后提交 payload 的 status=1', async () => {
    vi.mocked(createDept).mockResolvedValue('10')
    const wrapper = mount(DeptList, { global: { stubs: minimalStubs } })
    await nextTick()
    const vm = wrapper.vm as unknown as {
      form: SysDept
      handleSubmit: () => Promise<void>
    }
    vm.form.name = '测试部'
    vm.form.code = 'TEST'
    vm.form.status = 1
    await vm.handleSubmit()
    expect(vi.mocked(createDept)).toHaveBeenCalledWith(
      expect.objectContaining({ name: '测试部', code: 'TEST', status: 1 }),
    )
  })
})
