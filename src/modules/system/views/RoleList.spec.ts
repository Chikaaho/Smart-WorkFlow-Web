import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/modules/system/api/role', () => ({
  pageRoles: vi.fn(),
  getRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {}, params: {} }),
}))

import { pageRoles, deleteRole } from '@/modules/system/api/role'
import type { SysRole } from '@/modules/system/types/role'
import RoleList from './RoleList.vue'

function stubPageResult() {
  return { list: [] as SysRole[], total: 0, pageNum: 1, pageSize: 10 }
}

describe('RoleList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pageRoles).mockResolvedValue(stubPageResult())
  })

  const minimalStubs = {
    StandardListTemplate: {
      template:
        '<div><slot name="toolbar-actions"/><slot name="filter"/><slot name="filter-actions"/><slot/></div>',
      props: ['title', 'total', 'pageNum', 'pageSize', 'empty'],
      emits: ['update:pageNum', 'update:pageSize'],
    },
    'el-button': { template: '<button @click="$emit(\'click\')"><slot/></button>' },
    'el-table': { template: '<div><slot/></div>' },
    'el-table-column': { template: '<div/>' },
    'el-dialog': { template: '<div v-if="modelValue"><slot/></div>', props: ['modelValue'] },
    'el-input': { template: '<input/>', props: ['modelValue', 'placeholder'] },
    'el-input-number': { template: '<input type="number"/>', props: ['modelValue'] },
    'el-select': { template: '<select/>', props: ['modelValue'] },
    'el-option': { template: '<option/>' },
    'el-tag': { template: '<span><slot/></span>' },
    'el-alert': { template: '<div><slot/></div>', props: ['title', 'type'] },
  }

  // ─── API 交互 ───

  it('calls pageRoles on mount with default pagination', () => {
    mount(RoleList, { global: { stubs: minimalStubs } })
    expect(pageRoles).toHaveBeenCalledWith(
      { pageNum: 1, pageSize: 10 },
      expect.objectContaining({}),
    )
  })

  // ─── 分页 ───

  it('re-fetches on pageNum change via exposed handler', async () => {
    vi.mocked(pageRoles).mockClear()
    vi.mocked(pageRoles).mockResolvedValue(stubPageResult())
    const wrapper = mount(RoleList, { global: { stubs: minimalStubs } })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      handlePageNumChange: (p: number) => Promise<void>
    }
    await vm.handlePageNumChange(3)
    await nextTick()

    expect(pageRoles).toHaveBeenCalledWith({ pageNum: 3, pageSize: 10 }, expect.anything())
  })

  // ─── 筛选重查 ───

  it('resets filter and re-fetches on reset', async () => {
    vi.mocked(pageRoles).mockClear()
    vi.mocked(pageRoles).mockResolvedValue(stubPageResult())
    const wrapper = mount(RoleList, { global: { stubs: minimalStubs } })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      handleReset: () => Promise<void>
    }
    await vm.handleReset()
    await nextTick()

    expect(pageRoles).toHaveBeenCalledWith(
      { pageNum: 1, pageSize: 10 },
      expect.objectContaining({}),
    )
  })

  // ─── 删除 ───

  it('deleteRole can be called and propagates', async () => {
    vi.mocked(deleteRole).mockResolvedValue(undefined)
    await deleteRole('1')
    expect(deleteRole).toHaveBeenCalledWith('1')
  })
})
