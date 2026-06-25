import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiResponse } from '@/contracts/common'
import { getAccessToken } from '@/foundation/auth/token'

/**
 * 业务层唯一 HTTP 入口。axios 只允许在本文件出现（ESLint 边界规则强制）。
 */
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
})

// /auth/login、/auth/refresh 自身的 401/未授权响应不走全局跳登录处理，
// 否则登录页的“账密错误”提示会被误判成会话失效并清态跳转。
const AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING = ['/auth/login', '/auth/refresh']

type UnauthorizedHandler = (redirectPath: string) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * 由 router 层在创建 router 后注入（依赖反转），避免 foundation/request 直接依赖 router 造成循环依赖。
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    const isAuthEndpoint = AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING.some((path) =>
      url.includes(path),
    )
    if (error.response?.status === 401 && !isAuthEndpoint) {
      unauthorizedHandler?.(window.location.pathname + window.location.search)
    } else if (!isAuthEndpoint) {
      // TODO(skeleton): 5xx / 网络层基础设施异常分级处理，对齐后端「过滤层异常分级」原则
    }
    return Promise.reject(error)
  },
)

export async function request<T>(config: Parameters<AxiosInstance['request']>[0]): Promise<T> {
  const response = await client.request<ApiResponse<T>>(config)
  return response.data.data
}
