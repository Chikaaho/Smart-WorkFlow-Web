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
    // 参数化的低代码表单页作为静态子路由挂在根布局下,
    // 直达 URL 可进,受 authGuard 保护,无需纳入后端菜单树。
    children: [
      {
        path: 'lowcode/form-render/:formKey',
        name: 'lowcode-form-render',
        component: () => import('@/modules/lowcode/views/LowcodeFormRender.vue'),
        meta: { title: '表单渲染' },
      },
      {
        path: 'lowcode/form-list/:formKey',
        name: 'lowcode-form-list',
        component: () => import('@/modules/lowcode/views/LowcodeFormList.vue'),
        meta: { title: '提交记录' },
      },
    ],
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
