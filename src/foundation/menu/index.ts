import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { MenuType, type MenuNode } from '@/contracts/menu'

/**
 * 菜单树端点尚不存在，见决策文档 v2 §0/§6。本轮喂本地占位载荷，
 * 形状对齐未来后端菜单树端点；端点落地后只需替换本函数函数体，
 * 下游（router/guard 的动态路由构建）零改动点亮。
 */
const PLACEHOLDER_MENU: MenuNode[] = [
  {
    id: '1',
    parentId: null,
    name: 'system',
    title: '系统管理',
    path: 'system',
    component: 'system/views/SystemHome',
    icon: 'Setting',
    sort: 1,
    menuType: MenuType.MENU,
    permission: 'system:view',
  },
  // 低代码作为「目录」演示两级嵌套：目录本身无路由，子菜单各自成路由（决策文档 · 外壳刀 §4）。
  {
    id: '2',
    parentId: null,
    name: 'lowcode',
    title: '低代码',
    path: 'lowcode',
    component: null,
    icon: 'Grid',
    sort: 2,
    menuType: MenuType.DIRECTORY,
    permission: 'lowcode:view',
    children: [
      {
        id: '2-1',
        parentId: '2',
        name: 'lowcode-overview',
        title: '低代码概览',
        path: 'lowcode/overview',
        component: 'lowcode/views/LowcodeHome',
        icon: 'Document',
        sort: 1,
        menuType: MenuType.MENU,
        permission: 'lowcode:view',
      },
      {
        id: '2-2',
        parentId: '2',
        name: 'lowcode-form',
        title: '表单设计',
        path: 'lowcode/form',
        component: 'lowcode/views/LowcodeForm',
        icon: 'EditPen',
        sort: 2,
        menuType: MenuType.MENU,
        permission: 'lowcode:form:view',
      },
    ],
  },
  {
    id: '3',
    parentId: null,
    name: 'workflow',
    title: '流程引擎',
    path: 'workflow',
    component: 'workflow/views/WorkflowHome',
    icon: 'Share',
    sort: 3,
    menuType: MenuType.MENU,
    permission: 'workflow:view',
  },
  {
    id: '4',
    parentId: null,
    name: 'notify',
    title: '通知',
    path: 'notify',
    component: 'notify/views/NotifyHome',
    icon: 'Bell',
    sort: 4,
    menuType: MenuType.MENU,
    permission: 'notify:view',
  },
  {
    id: '5',
    parentId: null,
    name: 'agent',
    title: '智能体',
    path: 'agent',
    component: 'agent/views/AgentHome',
    icon: 'MagicStick',
    sort: 5,
    menuType: MenuType.MENU,
    permission: 'agent:view',
  },
  {
    id: '6',
    parentId: null,
    name: 'iot',
    title: '物联网',
    path: 'iot',
    component: 'iot/views/IotHome',
    icon: 'Cpu',
    sort: 6,
    menuType: MenuType.MENU,
    permission: 'iot:view',
  },
  {
    id: '7',
    parentId: null,
    name: 'openapi',
    title: '开放接口',
    path: 'openapi',
    component: 'openapi/views/OpenapiHome',
    icon: 'Connection',
    sort: 7,
    menuType: MenuType.MENU,
    permission: 'openapi:view',
  },
]

export async function loadMenu(): Promise<MenuNode[]> {
  return PLACEHOLDER_MENU
}

/**
 * 组件白名单：只允许加载 src/modules/** 下的 .vue 文件，禁止用字符串拼接 import() 任意模块。
 * 菜单节点的 component 字段（如 "system/views/SystemHome"）经此白名单解析，解析不到则跳过并告警。
 */
const componentWhitelist = import.meta.glob<{ default: Component }>('/src/modules/**/*.vue')

function resolveComponent(componentPath: string) {
  return componentWhitelist[`/src/modules/${componentPath}.vue`]
}

function buildRoutesFromNodes(nodes: MenuNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const node of nodes) {
    if (node.menuType === MenuType.BUTTON) {
      continue
    }

    if (node.menuType === MenuType.DIRECTORY) {
      if (node.children?.length) {
        routes.push(...buildRoutesFromNodes(node.children))
      }
      continue
    }

    const loader = node.component ? resolveComponent(node.component) : undefined
    if (!loader) {
      console.warn(`[menu] unknown component path, skip route: ${node.path} -> ${node.component}`)
      continue
    }

    const children = node.children?.length ? buildRoutesFromNodes(node.children) : undefined

    routes.push({
      path: node.path,
      name: node.name,
      component: loader,
      meta: { title: node.title, icon: node.icon, permission: node.permission },
      ...(children ? { children } : {}),
    })
  }

  return routes
}

export function buildRoutesFromMenu(nodes: MenuNode[]): RouteRecordRaw[] {
  return buildRoutesFromNodes(nodes)
}
