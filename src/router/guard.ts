import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { getAccessToken } from '@/foundation/auth/token'
import { refresh, logout } from '@/foundation/auth'
import { loadSession } from '@/foundation/session'
import { loadMenu, buildRoutesFromMenu, findFirstLeafPath } from '@/foundation/menu'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'

export const ROOT_LAYOUT_NAME = 'app-root'
const NOT_FOUND_ROUTE_NAME = 'not-found-catchall'

let dynamicRoutesBuilt = false
let buildingPromise: Promise<void> | null = null
let addedRouteNames: string[] = []

function isSafeRedirectPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function loginRedirectTarget(to: RouteLocationNormalized) {
  const redirect = to.fullPath
  return {
    path: '/login',
    query: isSafeRedirectPath(redirect) && redirect !== '/login' ? { redirect } : undefined,
  }
}

async function buildDynamicRoutes(router: Router): Promise<void> {
  const [session, menu] = await Promise.all([loadSession(), loadMenu()])
  useUserStore().setSession(session)
  // 同一份菜单载荷既建路由、又存入 menu store 供侧边栏渲染（单一数据源，决策文档 · 外壳刀 §4）。
  useMenuStore().setMenu(menu)

  const routes = buildRoutesFromMenu(menu)
  for (const route of routes) {
    router.addRoute(ROOT_LAYOUT_NAME, route)
    if (route.name) {
      addedRouteNames.push(String(route.name))
    }
  }

  // 404 必须在动态路由之后注册，否则会先于业务路由匹配，把所有业务页面吞成 404。
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: NOT_FOUND_ROUTE_NAME,
    redirect: '/404',
  })

  dynamicRoutesBuilt = true
}

/** 登出/401 时撤销已注册的动态路由 + 清会话，保证重新登录后用新会话/菜单数据重建。 */
export function clearDynamicRoutes(router: Router): void {
  for (const name of addedRouteNames) {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  }
  if (router.hasRoute(NOT_FOUND_ROUTE_NAME)) {
    router.removeRoute(NOT_FOUND_ROUTE_NAME)
  }
  addedRouteNames = []
  dynamicRoutesBuilt = false
  buildingPromise = null
  useUserStore().clearSession()
  useMenuStore().clearMenu()
}

export async function authGuard(
  router: Router,
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  if (to.meta.public) {
    next()
    return
  }

  if (!getAccessToken()) {
    try {
      // 冷启动静默续登：浏览器自动携带 rt cookie 调 /auth/refresh，
      // 成功后 access 回到内存，继续加载 session + menu 构建动态路由。
      await refresh()
    } catch {
      // refresh 失败（无 cookie / 已过期 / 已撤销）→ 重定向登录页
      next(loginRedirectTarget(to))
      return
    }
  }

  if (!dynamicRoutesBuilt) {
    if (!buildingPromise) {
      buildingPromise = buildDynamicRoutes(router).catch(async (error: unknown) => {
        // 会话装配失败 = 登出 + 跳登录（决策文档 v2 §5）。
        console.error('[guard] failed to assemble session/menu', error)
        await logout()
        clearDynamicRoutes(router)
        throw error
      })
    }
    try {
      await buildingPromise
    } catch {
      next(loginRedirectTarget(to))
      return
    }
    next({ ...to, replace: true })
    return
  }

  // 根路径默认落地：菜单已装载，DFS 取首个可访问叶子；取不到兜底 /404。
  // 不在路由定义层用 redirect 处理，因为 Vue Router 的 redirect 在 beforeEach 之前解析，
  // 冷启动时菜单 store 为空必然回退 /404，导致用户看不到登录页。
  if (to.path === '/') {
    const firstLeaf = findFirstLeafPath(useMenuStore().menu)
    next(firstLeaf ?? '/404')
    return
  }

  next()
}
