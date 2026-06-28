import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiResponse } from '@/contracts/common'
import { getAccessToken } from '@/foundation/auth/token'
import { getErrorMessage } from './error-code-map'

/**
 * 业务层唯一 HTTP 入口。axios 只允许在本文件出现（ESLint 边界规则强制）。
 */
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
})

// /auth/login、/auth/refresh 自身的 401/未授权响应不走全局跳登录处理，
// 否则登录页的"账密错误"提示会被误判成会话失效并清态跳转。
const AUTH_ENDPOINTS_EXCLUDED_FROM_401_HANDLING = ['/auth/login', '/auth/refresh']

type UnauthorizedHandler = (redirectPath: string) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * 由 router 层在创建 router 后注入（依赖反转），避免 foundation/request 直接依赖 router 造成循环依赖。
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

/** 后端业务层错误(HTTP 200 + code≠0),上层按 code 映射可读提示。 */
export class ApiError extends Error {
  readonly code: number
  readonly msg: string

  constructor(code: number, msg: string) {
    super(msg)
    this.name = 'ApiError'
    this.code = code
    this.msg = msg
  }
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
  // ── dev-only 全 mock 开关 ──
  // 双重 gate + 动态 import 保证 tree-shake 安全：prod 构建时 import.meta.env.DEV 恒为 false，
  // 整个 if 块被 DCE，foundation/mock/ 不出现在 dist 中。
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const { dispatchMock } = await import('@/foundation/mock/index')
    const mockResult = await dispatchMock<T>(
      config.method ?? 'GET',
      config.url ?? '',
      client.defaults.baseURL ?? '/api',
      (config.params as Record<string, string>) ?? {},
      config.data,
    )
    if (mockResult !== undefined) {
      // mock 响应流经与真实请求相同的错误归一管线（ApiError）
      if (mockResult.code !== 0) {
        throw new ApiError(mockResult.code, getErrorMessage(mockResult.code, mockResult.message))
      }
      return mockResult.data as T
    }
    // fallthrough: 无匹配 handler → 走真实 axios
  }

  const response = await client.request<ApiResponse<T>>(config)
  if (response.data.code !== 0) {
    throw new ApiError(
      response.data.code,
      getErrorMessage(response.data.code, response.data.message),
    )
  }
  return response.data.data
}
