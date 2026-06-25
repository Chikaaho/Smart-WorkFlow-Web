import { describe, it, expect, vi, afterEach } from 'vitest'
import { MenuType } from '@/contracts/menu'
import { buildRoutesFromMenu, loadMenu } from './index'

describe('foundation/menu', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves real on-disk components for every placeholder route', async () => {
    const menu = await loadMenu()
    const routes = buildRoutesFromMenu(menu)
    expect(routes.length).toBeGreaterThan(0)
    expect(routes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('placeholder menu carries at least one two-level nesting (directory + children)', async () => {
    const menu = await loadMenu()
    const directory = menu.find((node) => node.menuType === MenuType.DIRECTORY)
    expect(directory).toBeDefined()
    expect(directory!.children?.length).toBeGreaterThan(0)
  })

  it('flattens the placeholder directory: the directory owns no route, its children do', async () => {
    const menu = await loadMenu()
    const paths = buildRoutesFromMenu(menu).map((route) => route.path)
    // 'lowcode' 目录本身不成路由，其子项 'lowcode/overview' / 'lowcode/form' 各自成路由。
    expect(paths).not.toContain('lowcode')
    expect(paths).toContain('lowcode/overview')
    expect(paths).toContain('lowcode/form')
  })

  it('skips button-type nodes and unresolved component paths, warning instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const routes = buildRoutesFromMenu([
      {
        id: 'b',
        parentId: null,
        name: 'btn',
        title: 'button',
        path: 'btn',
        component: null,
        sort: 1,
        menuType: MenuType.BUTTON,
      },
      {
        id: 'u',
        parentId: null,
        name: 'unknown',
        title: 'unknown',
        path: 'unknown',
        component: 'nope/views/DoesNotExist',
        sort: 2,
        menuType: MenuType.MENU,
      },
    ])
    expect(routes).toHaveLength(0)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('flattens directory nodes: directory itself owns no route, children do', () => {
    const routes = buildRoutesFromMenu([
      {
        id: 'd',
        parentId: null,
        name: 'dir',
        title: 'directory',
        path: 'dir',
        component: null,
        sort: 1,
        menuType: MenuType.DIRECTORY,
        children: [
          {
            id: '1',
            parentId: 'd',
            name: 'system',
            title: '系统管理',
            path: 'system',
            component: 'system/views/SystemHome',
            sort: 1,
            menuType: MenuType.MENU,
          },
        ],
      },
    ])
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('system')
  })
})
