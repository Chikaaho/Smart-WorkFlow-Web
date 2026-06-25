import { request } from '@/foundation/request'
import { getAccessToken, setAccessToken, getCurrentUsername, setCurrentUsername } from './token'

/**
 * 登录流程壳。token 读写收口在 ./token（被 foundation/request 复用，避免循环依赖）。
 * refresh/logout 对应的后端端点尚不存在（决策文档 v2 §0/§6），保留为留空 seam。
 */

export interface LoginPayload {
  username: string
  password: string
}

export { getAccessToken, getCurrentUsername }

export async function login(payload: LoginPayload): Promise<void> {
  const token = await request<string>({
    method: 'POST',
    url: '/auth/login',
    data: payload,
  })
  setCurrentUsername(payload.username)
  setAccessToken(token)
}

export async function logout(): Promise<void> {
  setAccessToken(null)
  setCurrentUsername(null)
  // TODO(skeleton): /auth/logout 端点不存在，见决策文档 §6；端点落地后在此调用使会话失效。
}

export async function refresh(): Promise<void> {
  // TODO(skeleton): /auth/refresh 端点不存在，见决策文档 §6；端点落地后按文档 §2 算法补单飞刷新逻辑。
  throw new Error('NOT_IMPLEMENTED: /auth/refresh seam, see decision doc §6')
}

export function useAuth() {
  return {
    getAccessToken,
    getCurrentUsername,
    login,
    logout,
    refresh,
  }
}
