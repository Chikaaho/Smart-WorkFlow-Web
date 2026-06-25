import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { hasPerm, hasRole, isPermVisible } from './index'

describe('foundation/permission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hasPerm is pure: false on empty permission set even though v-perm would show it', () => {
    expect(hasPerm('system:user:add')).toBe(false)
    expect(isPermVisible('system:user:add')).toBe(true)
  })

  it('superAdmin (boolean) bypasses hasPerm/hasRole', () => {
    useUserStore().superAdmin = true
    expect(hasPerm('anything')).toBe(true)
    expect(hasRole('anything')).toBe(true)
  })

  it('dark state: placeholder session (no perms/roles, not superAdmin) does not gate v-perm', () => {
    expect(isPermVisible('system:user:add')).toBe(true)
  })

  it('once session is assembled with real permissions, v-perm gates normally', () => {
    useUserStore().permissions = new Set(['system:user:add'])
    expect(isPermVisible('system:user:add')).toBe(true)
    expect(isPermVisible('system:user:delete')).toBe(false)
  })
})
