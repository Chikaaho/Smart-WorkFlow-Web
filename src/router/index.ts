import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard, clearDynamicRoutes, ROOT_LAYOUT_NAME } from './guard'
import { setUnauthorizedHandler } from '@/foundation/request'

// 只保留常量路由：登录、错误页、根布局。7 个业务模块的路由由 router/guard.ts
// 在会话确立后经 loadMenu() 占位载荷动态 addRoute，不在此静态聚合（决策文档 v2 §4）。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROOT_LAYOUT_NAME,
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/system',
    children: [],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/ErrorPage.vue'),
    meta: { public: true, errorCode: 403, title: '无权限访问' },
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/views/ErrorPage.vue'),
    meta: { public: true, errorCode: 404, title: '页面不存在' },
  },
  {
    path: '/500',
    name: 'server-error',
    component: () => import('@/views/ErrorPage.vue'),
    meta: { public: true, errorCode: 500, title: '服务异常' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => authGuard(router, to, from, next))

setUnauthorizedHandler((redirectPath) => {
  clearDynamicRoutes(router)
  router.push({
    path: '/login',
    query: redirectPath && redirectPath !== '/login' ? { redirect: redirectPath } : undefined,
  })
})
