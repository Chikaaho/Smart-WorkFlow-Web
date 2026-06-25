import type { Session } from '@/contracts/session'
import { getCurrentUsername } from '@/foundation/auth/token'

/**
 * getInfo（用户 + 权限码 + 角色 + 超管布尔）端点尚不存在，见决策文档 v2 §0/§6。
 * 占位实现：user 取登录时已知的最小信息（用户名），permissions/roles 留空、superAdmin 留 false。
 * 真端点落地后只需替换本函数函数体，下游（store/permission）形状不变，零改动点亮。
 */
export async function loadSession(): Promise<Session> {
  const username = getCurrentUsername() ?? 'unknown'
  return {
    user: {
      id: 'unknown',
      username,
      displayName: username,
      deptId: null,
      tenantId: null,
    },
    permissions: new Set<string>(),
    roles: new Set<string>(),
    superAdmin: false,
  }
}
