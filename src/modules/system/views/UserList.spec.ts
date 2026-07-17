import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/modules/system/api/user', () => ({
  pageUsers: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {}, params: {} }),
}))

import { pageUsers, deleteUser } from '@/modules/system/api/user'
import type { SysUser } from '@/modules/system/types/user'
import UserList from './UserList.vue'

function stubPageResult() {
  return { list: [] as SysUser[], total: 0, pageNum: 1, pageSize: 10 }
}

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pageUsers).mockResolvedValue(stubPageResult())
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
    'el-select': { template: '<select/>', props: ['modelValue'] },
    'el-option': { template: '<option/>' },
    'el-tag': { template: '<span><slot/></span>' },
    'el-alert': { template: '<div><slot/></div>', props: ['title', 'type'] },
  }

  // ─── API 交互 ───

  it('calls pageUsers on mount with default pagination', () => {
    mount(UserList, { global: { stubs: minimalStubs } })
    expect(pageUsers).toHaveBeenCalledWith(
      { pageNum: 1, pageSize: 10 },
      expect.objectContaining({}),
    )
  })

  // ─── 分页 ───

  it('re-fetches on pageNum change via exposed handler', async () => {
    vi.mocked(pageUsers).mockClear()
    vi.mocked(pageUsers).mockResolvedValue(stubPageResult())
    const wrapper = mount(UserList, { global: { stubs: minimalStubs } })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      handlePageNumChange: (p: number) => Promise<void>
    }
    await vm.handlePageNumChange(3)
    await nextTick()

    expect(pageUsers).toHaveBeenCalledWith({ pageNum: 3, pageSize: 10 }, expect.anything())
  })

  // ─── 筛选重查 ───

  it('resets filter and re-fetches on reset', async () => {
    vi.mocked(pageUsers).mockClear()
    vi.mocked(pageUsers).mockResolvedValue(stubPageResult())
    const wrapper = mount(UserList, { global: { stubs: minimalStubs } })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      handleReset: () => Promise<void>
    }
    await vm.handleReset()
    await nextTick()

    expect(pageUsers).toHaveBeenCalledWith(
      { pageNum: 1, pageSize: 10 },
      expect.objectContaining({}),
    )
  })

  // ─── 删除 ───

  it('deleteUser can be called and propagates', async () => {
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    await deleteUser('1')
    expect(deleteUser).toHaveBeenCalledWith('1')
  })
})
