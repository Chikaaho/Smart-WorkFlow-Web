/**
 * 纯 token/用户名内存存储，不依赖 foundation/request，避免 auth ↔ request 循环依赖。
 * 安全约束：access token 仅存内存，禁止落 localStorage/sessionStorage。
 */

let accessToken: string | null = null
let lastUsername: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getCurrentUsername(): string | null {
  return lastUsername
}

export function setCurrentUsername(username: string | null): void {
  lastUsername = username
}
