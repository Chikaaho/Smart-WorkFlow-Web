# Smart-WorkFlow 前端（sw-web）

> 低代码 OA + AI Agent 平台的前端单应用。
> 配套后端：[Smart-WorkFlow](https://github.com/Chikaaho/Smart-WorkFlow)（Java 21 / Spring Boot 3.4）
> 规划知识库：[Smart-WorkFlow-Knowledge](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge)（方案/回执/知识库）
>
> 本仓库是 Smart-WorkFlow 三件套之一。

---

## 目录

- [项目状态](#项目状态)
- [技术栈](#技术栈)
- [目录分层](#目录分层)
- [已实现功能](#已实现功能)
- [强制内部边界（ESLint）](#强制内部边界eslint)
- [安全基线](#安全基线)
- [依赖审计](#依赖审计)
- [校验命令](#校验命令)
- [开发模式：mock 先行](#开发模式mock-先行)
- [真接 vs seam](#真接-vs-seam)
- [接入后端 Swagger](#接入后端-swagger)

---

## 项目状态

| 模块          | 状态            | 说明                                                                   |
| ------------- | --------------- | ---------------------------------------------------------------------- |
| 登录/认证     | ✅ 真接         | 双 token 管线（access 内存 + refresh cookie），静默续期                |
| 菜单系统      | ✅ 动态路由     | 菜单驱动路由构建 + 侧边栏渲染                                          |
| 权限系统      | ✅ 骨架就绪     | `v-perm` 指令、`hasPerm`/`hasRole` 可用                                |
| 字典          | ✅ 真接         | 字典接口已联通，含 DictSelect/DictTag 组件                             |
| 表单设计器    | ✅ 功能完整     | 8 字段类型拖拽设计、配置面板、预览、子表设计                           |
| 表单渲染      | ✅ 功能完整     | 运行时表单渲染、动态字段分发、REFERENCE 选择器                         |
| 系统管理      | ✅ 完整 CRUD    | 字典/用户/角色/部门/岗位管理                                           |
| 通知          | ✅ 已落地       | NotifyHome 通知列表 + 标记已读                                         |
| 工作流        | ✅ 已联通       | TodoList 待办 + ProcessDefList 流程定义 + ProcessInstanceList 流程监控 |
| 定时任务      | ✅ 完整         | JobList CRUD + JobLog 日志 + 暂停/恢复/触发                            |
| 文件管理      | ✅ 完整         | StorageList 上传/列表/下载/删除                                        |
| BPMN 集成     | ✅ 查看器已实现 | `adapters/bpmn/` 防腐层 + 两个消费方（流程图查看 + 流程监控高亮）      |
| Vue Flow 集成 | ✅ adapter 就绪 | `adapters/flow-graph/` 防腐层（零消费方，M07 AI 调度图未就位）         |
| IoT           | 🔲 占位         | 路由/菜单已注册                                                        |
| Agent         | 🔲 占位         | 路由/菜单已注册                                                        |
| OpenAPI       | 🔲 占位         | 路由/菜单已注册                                                        |

---

## 技术栈

### 运行时依赖

| 包                      | 版本     | 用途                                 |
| ----------------------- | -------- | ------------------------------------ |
| vue                     | ^3.5.38  | 框架                                 |
| vue-router              | ^5.1.0   | 路由                                 |
| pinia                   | ^3.0.4   | 状态管理                             |
| vue-i18n                | ^11.4.6  | 国际化                               |
| element-plus            | ^2.14.2  | UI 组件库                            |
| axios                   | ^1.18.1  | HTTP 请求                            |
| dompurify               | ^3.4.11  | HTML 安全过滤                        |
| expr-eval-fork          | ^3.0.3   | 安全表达式求值（expr-eval 修复分支） |
| @form-create/designer   | ^3.5.0   | 表单设计器内核                       |
| @form-create/element-ui | ^3.3.1   | 表单渲染器                           |
| bpmn-js                 | ^18.18.0 | BPMN 流程设计器（待集成）            |
| @vue-flow/core          | ^1.48.2  | 流程图设计器（待集成）               |
| vue-draggable-plus      | ^0.6.1   | 拖拽排序                             |

### 开发工具链

| 包                      | 版本    | 用途                |
| ----------------------- | ------- | ------------------- |
| typescript              | ~6.0.2  | 语言                |
| vite                    | ^8.1.0  | 构建                |
| vue-tsc                 | ^3.3.5  | IDE / 类型检查      |
| eslint                  | ^10.5.0 | 代码规范 + 架构边界 |
| typescript-eslint       | ^8.62.0 | TS 规则             |
| prettier                | ^3.8.4  | 格式化              |
| vitest                  | ^4.1.9  | 单测                |
| @vue/test-utils         | ^2.4.11 | Vue 组件测试        |
| openapi-typescript      | ^7.13.0 | 后端类型生成        |
| unplugin-auto-import    | ^21.0.0 | API 自动导入        |
| unplugin-vue-components | ^32.1.0 | 组件自动注册        |
| simple-git-hooks        | ^2.13.1 | Git 钩子            |
| @commitlint/cli         | ^21.1.0 | 提交规范            |

---

## 目录分层

```
src/
├─ contracts/          我方稳定类型契约（业务层只认这里）
│   ├─ session.ts      会话规范态
│   ├─ menu.ts         菜单树规范态
│   ├─ common.ts       通用类型
│   ├─ form-schema.ts  表单 schema 类型
│   └─ api-types/      后端 Swagger 生成产物（do-not-edit，暂无）
│
├─ foundation/         运行时横切基础设施
│   ├─ request/        唯一 axios 出口（全局只此一处直引 axios）
│   ├─ auth/           token 策略（仅内存，不落 storage）
│   ├─ session/        getInfo seam，占位会话
│   ├─ menu/           菜单树 seam + 动态路由构建
│   ├─ permission/     v-perm 指令、hasPerm/hasRole
│   ├─ dict/           字典接口 + DictSelect/DictTag 组件
│   └─ mock/           MSW mock 服务器（dev:mock 模式用）
│
├─ security/           安全层
│   ├─ csp.ts          CSP 策略字符串
│   ├─ sanitize.ts     dompurify 封装
│   ├─ safe-eval.ts    expr-eval-fork 封装
│   └─ SafeHtml.vue    v-html 唯一出口
│
├─ adapters/           易变第三方库防腐层
│   ├─ form-designer/  form-create 防腐层（含 FormPreview 组件）
│   ├─ bpmn/           BPMN adapter（未实现）
│   └─ flow-graph/     Vue Flow adapter（未实现）
│
├─ modules/            业务模块（对应后端 sw-biz-*）
│   ├─ form/           表单模块（最完整，含设计器 + 渲染器）
│   │   ├─ designer/   表单设计器（拖拽画布、字段配置、预览）
│   │   ├─ views/      表单定义列表、表单设计、表单渲染、表单数据
│   │   ├─ components/ ReferenceSelector 等业务组件
│   │   ├─ api/        表单相关 API 封装
│   │   └─ utils/      接缝纯函数（设计时可自定义的取值逻辑）
│   ├─ system/         系统管理（字典管理已实现）
│   ├─ workflow/       工作流（占位）
│   ├─ notify/         通知（占位）
│   ├─ agent/          AI Agent（占位）
│   ├─ iot/            IoT（占位）
│   └─ openapi/        OpenAPI（占位）
│
├─ components/         全局组件
│   ├─ BlankPage.vue   空白占位页
│   ├─ DynamicField.vue 动态字段分发（8 类型）
│   └─ page-layout/    页型组件（StandardFormTemplate / StandardListTemplate）
│
├─ layouts/            布局壳
│   ├─ BasicLayout.vue 侧边栏 + 顶栏 + router-view
│   └─ components/     AppLogo / AppSidebar / AppTopbar
│
├─ router/             路由
│   ├─ index.ts        常量路由表
│   └─ guard.ts        动态路由守卫
│
├─ stores/             Pinia 状态管理
│   ├─ user.ts         用户 store（Session：user/permissions/roles/superAdmin）
│   ├─ menu.ts         菜单 store
│   └─ app.ts          应用级 store
│
├─ views/              常量页面（不属于业务模块）
│   ├─ LoginPage.vue   登录页
│   └─ ErrorPage.vue   403/404/500 错误页
│
├─ styles/             全局样式
│   ├─ tokens.css      CSS 变量单一源（品牌色/间距/圆角/阴影）
│   └─ tokens.spec.ts  token 值回归测试
│
├─ locales/            国际化
│   └─ zh-CN.ts        zh-CN 起步
│
└─ types/              自动生成类型（gitignored）
    ├─ auto-imports.d.ts
    └─ components.d.ts
```

---

## 已实现功能

### 表单设计器（modules/form/designer）

基于 `@form-create/designer` 封装的低代码表单设计器，通过防腐层隔离第三方依赖：

- **8 种字段类型**：文本 TEXT、富文本 RICH_TEXT、数字 NUMBER、日期 DATE、布尔 BOOL、字典 DICT、引用 REFERENCE、子表 TABLE
- **拖拽设计**：左面板字段调色板 → 中间画布拖拽放置 → 右侧配置面板
- **字段配置面板**：每种字段类型有专属配置面板（CommonConfigRows + 类型特定面板）
- **子表设计器**：TABLE 类型字段内可嵌套设计子字段
- **表单预览**：设计态实时预览 Modal
- **定义转换**：内部类型 → form-create schema 的双向转换
- **草案持久化**：设计过程中自动保存/恢复草案

### 表单渲染（modules/form）

- **运行时渲染**：基于 form-create element-ui 渲染器
- **动态字段分发**：`DynamicField.vue` 按 type 分发 8 类控件
- **引用选择器**：`ReferenceSelector.vue` 弹窗选择引用记录（存 id 显示 value）
- **页面模板**：`StandardFormTemplate` 页型 A + `StandardListTemplate` 页型 B
- **接缝函数**：`deriveColumns` / `deriveFilterFields` / `deriveReferenceColumns` / `resolveReferenceDisplay` 等可替换纯函数

### 系统管理

- **字典类型管理**：`DictTypeList.vue` — 字典类型列表 + 增删改
- **字典数据管理**：`DictDataList.vue` — 字典项列表 + 增删改

### 基础设施

- **菜单驱动路由**：`foundation/menu` 加载菜单树 → 动态构建路由表，侧边栏与路由同一数据源
- **权限指令**：`v-perm`（按钮级） + `hasPerm`/`hasRole` 函数
- **字典组件**：`DictSelect`（下拉选择器） + `DictTag`（标签展示）
- **错误码映射**：`error-code-map.ts` 后端业务码 → 中文提示
- **CSP 注入**：构建时注入 CSP meta 标签 + dev/preview 响应头

---

## 强制内部边界（ESLint）

见 `eslint.config.js`，以下规则在 CI 和本地开发中强制：

- `modules/*` 禁止直引 `axios`、`dompurify`、`expr-eval-fork`、`form-create`、`@form-create/*`、`bpmn-js`、`@vue-flow/*`，只能走 `foundation/*`、`security/*`、`adapters/*`、`contracts/*`。
- `modules/A` 禁止 import `modules/B`（业务模块之间不允许横向耦合）。
- `axios` 全局只允许在 `foundation/request/**` 内出现。
- `dompurify`、`expr-eval-fork` 全局只允许在 `security/**` 内出现。
- `v-html` 全局禁止，唯一例外是 `security/SafeHtml.vue`。
- `src/contracts/api-types/**` 标记为生成产物，禁止手动编辑。
- **Element Plus 经按需自动导入**（`unplugin-vue-components` + `unplugin-auto-import` + `ElementPlusResolver`）：组件全局按需注册、`ElMessage` 等 API 自动引入，`modules/*` 里不出现 `element-plus` 的显式 import 语句。

---

## 安全基线

- [x] **ESLint 全局禁 `eval`/`new Function`**，禁业务层裸 `v-html`。
- [x] **CSP**：`vite.config.ts` 通过 `cspMetaPlugin` 向 `index.html` 注入 `<meta http-equiv="Content-Security-Policy">`。
  - `script-src 'self'` 严格（禁 `unsafe-inline`/`unsafe-eval`）。
  - `style-src 'self' 'unsafe-inline'`：Element Plus 弹层运行时用内联 style 定位，故对 style 放开 inline。
- [x] **token 仅内存**：全仓库无 `localStorage`/`sessionStorage` 写入，access token 读写仅在 `foundation/auth/token`。
- [x] **单一请求层**：`foundation/request` 已区分 401（清态跳登录）与其他状态码。
- [x] **表达式安全**：`security/safe-eval` 封装 `expr-eval-fork`，禁 `eval`/`new Function`。
- [x] **v-html 唯一出口**：`security/SafeHtml.vue`，经 dompurify 过滤。
- [x] **open redirect 防护**：路由守卫同源校验。
- [x] **依赖审计**：见下方表格。
- [x] **无 .env 泄露**：仓库不含密钥，AppSecret 全部留在后端。

---

## 依赖审计

执行 `pnpm audit --registry https://registry.npmjs.org/`。

修复记录：`expr-eval@2.0.2` 存在两个 **high** 级别漏洞（原型污染 [GHSA-8gw3-rxh4-v6jx](https://github.com/advisories/GHSA-8gw3-rxh4-v6jx)、函数注入 [GHSA-jc85-fpwf-qm7x](https://github.com/advisories/GHSA-jc85-fpwf-qm7x)），已替换为社区修复分支 **`expr-eval-fork@3.0.3`**。

仍存在的高/中危依赖（均为间接依赖，不进入生产构建产物）：

| 等级     | 包           | 来源路径                                                                    | 说明                                |
| -------- | ------------ | --------------------------------------------------------------------------- | ----------------------------------- |
| high     | `wangeditor` | `@form-create/designer > @form-create/component-wangeditor > wangeditor`    | XSS，官方暂无补丁。仅安装未实际集成 |
| high     | `ini`        | 多重间接依赖（form-create / test-utils → js-beautify → config-chain → ini） | 原型污染，仅影响开发期工具链        |
| moderate | `js-yaml`    | `openapi-typescript > @redocly/openapi-core > js-yaml`                      | DoS，仅影响 `gen:api-types` 脚本    |

---

## 校验命令

```bash
pnpm install        # 安装依赖
pnpm typecheck      # vue-tsc -b --noEmit    类型检查
pnpm lint           # eslint .               代码规范 + 架构边界
pnpm test           # vitest run             单元测试（60 spec files / 521 tests）
pnpm build          # vue-tsc -b && vite build 生产构建
pnpm preview        # 短时冒烟验证，用后终止
```

> `pnpm dev` 禁用做阻塞式校验——它没有确定退出码。校验请用 `typecheck` / `lint` / `test` / `build`。

---

## 开发模式：mock 先行

采用**契约先行 + 前后端并行**模式：前端不等后端就绪，拿 mock 把页面/功能全推起来。

| 命令            | 模式 | 说明                                                    |
| --------------- | ---- | ------------------------------------------------------- |
| `pnpm dev`      | real | 直连后端 `/api`，后端未就绪的 seam 显示「待上线」可读态 |
| `pnpm dev:mock` | mock | 全 mock 模式，MSW 拦截请求，零后端依赖，用于肉眼验收    |

Mock 由 `foundation/mock/` 提供，仅在 `VITE_USE_MOCK=true`（即 `dev:mock`）时激活，生产构建经过 tree-shake 不进入产物。

---

## 真接 vs seam

### 已真接

| 端点                                | 位置              | 说明                             |
| ----------------------------------- | ----------------- | -------------------------------- |
| `POST /auth/login`                  | `foundation/auth` | 返回裸 token，Bearer 7200s       |
| `GET /system/dict/data/list/{type}` | `foundation/dict` | 字典项，字段 `code` → FE `value` |

### seam（占位，标注 `// TODO(skeleton)`）

| seam                       | 位置                  | 现状                                                                           |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `GET /auth/info` (getInfo) | `foundation/session`  | 端点不存在，返回占位会话（permissions/roles 空集）                             |
| 菜单树端点                 | `foundation/menu`     | 端点不存在，喂本地占位载荷。`buildRoutesFromMenu()` + 路由守卫动态路由已真跑通 |
| 多页签                     | `layouts/BasicLayout` | 占位，未实现                                                                   |

> 已消除的 seam：`/auth/refresh` + `/auth/logout`（双 token 管线已真接）、BPMN adapter（查看器防腐层已完成 + 两个消费方）、Vue Flow adapter（防腐层已完成，零消费方）。

### 工程约束

- **不发租户头**：tenantId 由后端从 token 解出，FE 不参与。
- **超管**：`superAdmin: boolean`（非通配权限串）。
- **数据权限**：`checkDataScope` 恒真，仅 UX 展示，不做 scope 过滤。
- **REFERENCE 存 id 显示 value**：提交入库存目标记录 id（对应后端 `ref_{name}_id` 列），UI 显示显示名。

---

## 接入后端 Swagger

1. 拿到后端 Swagger/OpenAPI 文档地址，例如 `http://<backend-host>/v3/api-docs`。
2. 执行：
   ```bash
   SWAGGER_URL=http://<backend-host>/v3/api-docs pnpm gen:api-types
   ```
3. 生成的 `schema.d.ts` 写入 `src/contracts/api-types/`（do-not-edit）。
4. 业务层通过 `src/contracts/` 下我方类型间接使用，不直引生成产物内部结构。

---

## 不可破的工程约束

- **token 仅内存**，全仓库无 localStorage/sessionStorage 写 token；刷新=重登录。
- **superAdmin = 布尔**（对齐后端 `userId==1`），不用 `*:*:*` 通配串。
- **前端不发租户头**。
- **菜单单一数据源**：同一份 `loadMenu()` 同时喂 router 与侧边栏 store（有回归测试钉死）。
- **组件解析走 `import.meta.glob` 白名单**，禁止字符串拼路径 `import()`。
- **单一请求层**：业务层禁直引 axios，全部走 `foundation/request`。
- **表达式求值只走 `security/safe-eval`**，禁 `eval`/`new Function`。
- **v-html 唯一出口** `sanitizeHtml`/`<SafeHtml>`；open-redirect 必做同源校验。
- **form-designer 防腐层**：form-create 原生 schema 不得泄漏进 `modules/`（ESLint 导入边界强制）。
- **配置接缝层**：设计时可自定义的取值逻辑（列展示、可搜字段、列宽等）一律收进 `modules/form/utils/` 下的可替换纯函数，页面/组件零改。
