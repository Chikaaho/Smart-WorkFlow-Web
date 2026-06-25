# Smart-WorkFlow 前端骨架（sw-web）

> 本仓库目前只是**前端骨架**：装好横切/安全地基的空壳，**不含任何业务逻辑**。
> 配套后端：Java 21 / Spring Boot 3.4 / MyBatis-Plus / Flowable，模块化单体。

## 铁律（不要违反）

1. **不实现业务**：不写实体 CRUD、不写具体表单/流程/IoT/AI 业务逻辑，模块只注册路由 + 空白页占位。
2. **不臆造后端 API 形状**：API 类型必须由 `pnpm gen:api-types` 从后端 Swagger/OpenAPI 文档生成，骨架阶段未接入真实后端，`src/contracts/api-types/` 暂无生成产物。
3. **安全红线**：
   - 全项目禁止 `eval` / `new Function`（ESLint `no-eval`/`no-implied-eval` 强制）。
   - 任何用户产生的 HTML 禁止裸 `v-html`，必须经 `security/sanitize.ts` 的 `sanitizeHtml()`，唯一出口是 `security/SafeHtml.vue`。
   - token 禁止写入 `localStorage`/`sessionStorage`；access token 只存内存（`foundation/auth`），读写收口在该模块。
4. **不要把 `pnpm dev` 当阻塞式校验**。校验只用 `typecheck` / `lint` / `build` / `test`，运行时冒烟用 `preview` 短时验证后立刻终止进程。
5. **逐步执行 + 每步校验门**，详见下方分层说明对应的 ESLint 边界规则。
6. **不引入 vben/yudao 作为依赖**，仅作参考实现。

## 目录分层

```
src/
├─ contracts/      我方稳定类型契约（业务层只认这里），api-types/ 为生成产物，禁止手动编辑
│                   session.ts（会话规范态）、menu.ts（菜单树规范态）
├─ foundation/      运行时横切：request（唯一 axios 出口）/ auth（token 策略，真接 /auth/login）/
│                   session（getInfo seam，占位会话）/ menu（菜单树 seam + 动态路由构建）/
│                   permission（v-perm、hasPerm/hasRole）/ dict（真接字典接口）
├─ security/        sanitize（dompurify 封装）/ safe-eval（expr-eval-fork 封装）/ csp（CSP 策略字符串）
├─ adapters/        易变第三方库防腐层：form-designer / bpmn / flow-graph（已装依赖，未深度集成）
├─ modules/         业务模块壳，对齐后端 sw-biz-*：system / lowcode / workflow / notify / agent / iot / openapi
│                   每个模块下 views/ 放占位页，由 foundation/menu 的白名单 glob 解析到，
│                   不再有 modules/*/routes.ts（已被菜单驱动的动态路由取代）
├─ views/           不属于任何 sw-biz-* 模块的常量页面：LoginPage、ErrorPage（403/404/500 复用）
├─ components/      全局通用基础组件（如 BlankPage）
├─ layouts/         基础布局壳（BasicLayout：侧边栏 + 顶栏 + router-view）
├─ router/          常量路由表（router/index.ts）+ 动态路由守卫（router/guard.ts）
├─ stores/          pinia 根装配 + user store（持有 Session：user/permissions/roles/superAdmin）
└─ locales/         zh-CN 起步
```

## 强制内部边界（ESLint，见 `eslint.config.js`）

- `modules/*` 禁止直引 `axios`、`dompurify`、`expr-eval-fork`、`form-create`、`@form-create/*`、`bpmn-js`、`@vue-flow/*`，只能走 `foundation/*`、`security/*`、`adapters/*`、`contracts/*`。
- `modules/A` 禁止 import `modules/B`（业务模块之间不允许横向耦合）。
- `axios` 全局只允许在 `foundation/request/**` 内出现。
- `dompurify`、`expr-eval-fork` 全局只允许在 `security/**` 内出现。
- `v-html` 全局禁止，唯一例外是 `security/SafeHtml.vue`。
- `src/contracts/api-types/**` 标记为生成产物（ESLint `ignores` + 目录内 `README.md` 标注 do-not-edit）。
- **Element Plus 经按需自动导入**（`unplugin-vue-components` + `unplugin-auto-import` + `ElementPlusResolver`）：组件全局按需注册、`ElMessage` 等 API 自动引入，`modules/*` 里**不出现** `element-plus` 的显式 import 语句，天然不触碰第三方库直引边界——EP 是被认可的 UI 层，允许在业务层使用；被禁的仍是 `axios`/`dompurify`/`expr-eval-fork`/`form-create`/`@vue-flow` 与模块互引，不变。生成的 `src/types/auto-imports.d.ts` / `src/types/components.d.ts` 为产物，纳入 ESLint/Prettier 忽略（同 `contracts/api-types`）。

这些规则在开发过程中用反例验证过能正确拦截越界 import（验证后已移除反例文件）。

## 安全基线现状

- [x] ESLint 全局禁 `eval`/`new Function`，禁业务层裸 `v-html`。
- [x] CSP：`vite.config.ts` 通过 `cspMetaPlugin` 向 `index.html` 注入 `<meta http-equiv="Content-Security-Policy">`，并在 `server.headers` / `preview.headers` 同步注入。
  - `script-src 'self'` **维持严格**（禁 `unsafe-inline`/`unsafe-eval`）——高价值防线不动，JS 注入面继续封死。
  - `style-src 'self' 'unsafe-inline'`：Element Plus 弹层（下拉/select/tooltip/dialog/popover）运行时用**内联 style** 定位，与禁 inline 直接冲突会导致弹层错位、对话框样式破，故对 style 放开 inline。取舍依据：CSS 注入危害远小于 JS 注入，放开 style 的残余风险低，是使用组件库的标准代价；将来若要极致硬化可走 nonce 化样式，但与 EP 实际不兼容，暂不纳入。策略字符串见 `src/security/csp.ts`，已在 `pnpm build` 产物中验证存在。
- [x] token 存储：全仓库无 `localStorage`/`sessionStorage` 写入，access token 读写仅在 `foundation/auth/token`。
- [x] 请求层：`foundation/request` 已区分 401（清态跳登录，经依赖注入的 `setUnauthorizedHandler` 回调，避免循环依赖）与其他状态码（5xx/基础设施异常，骨架占位）；`/auth/login`/`/auth/refresh` 自身的失败响应不触发全局跳登录。
- [x] 依赖审计：见下方「依赖审计结果」。
- [x] `.env` 未引入，仓库不含任何密钥；AppSecret/签名类约定全部留在后端，前端不碰。

## 依赖审计结果

执行 `pnpm audit --registry https://registry.npmjs.org/`（本机默认 registry 为淘宝镜像，不支持 audit 接口，需显式指定官方 registry）。

修复记录：原计划使用 `expr-eval@2.0.2` 实现 `security/safe-eval.ts`，但该版本存在两个 **high** 级别漏洞（原型污染 [GHSA-8gw3-rxh4-v6jx](https://github.com/advisories/GHSA-8gw3-rxh4-v6jx)、`evaluate` 未限制传入函数 [GHSA-jc85-fpwf-qm7x](https://github.com/advisories/GHSA-jc85-fpwf-qm7x)），且原包再未发布补丁版本。已替换为社区维护的修复分支 **`expr-eval-fork@3.0.3`**（API 与原包一致），漏洞已消除。

仍存在的高/中危依赖（均为间接依赖，骨架阶段暂不影响构建产物）：

| 等级     | 包           | 来源路径                                                                                                         | 说明                                                                                                                                                                                                                               |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| high     | `wangeditor` | `@form-create/designer > @form-create/component-wangeditor > wangeditor`                                         | [GHSA-g7mw-5cq6-fv82](https://github.com/advisories/GHSA-g7mw-5cq6-fv82)，XSS，官方暂无补丁版本。`@form-create/designer` 目前仅安装未集成（见 `adapters/form-designer`），后续真正集成表单设计器时需重新评估或寻找替代富文本组件。 |
| high     | `ini`        | `@form-create/designer > js-beautify > config-chain > ini`；`@vue/test-utils > js-beautify > config-chain > ini` | 原型污染，仅影响开发期工具链（设计器代码格式化 / 测试工具间接依赖），不进入生产构建产物。                                                                                                                                          |
| moderate | `js-yaml`    | `openapi-typescript > @redocly/openapi-core > js-yaml`                                                           | DoS，仅影响 `gen:api-types` 这条本地生成类型脚本，不进入生产构建产物。                                                                                                                                                             |

## 实际解析依赖版本

dependencies:

| 包                      | 版本    |
| ----------------------- | ------- |
| vue                     | 3.5.38  |
| vue-router              | 5.1.0   |
| pinia                   | 3.0.4   |
| vue-i18n                | 11.4.6  |
| axios                   | 1.18.1  |
| element-plus            | 2.14.2  |
| @element-plus/icons-vue | 2.3.2   |
| dompurify               | 3.4.11  |
| expr-eval-fork          | 3.0.3   |
| @form-create/designer   | 3.5.0   |
| @form-create/element-ui | 3.3.1   |
| bpmn-js                 | 18.18.0 |
| @vue-flow/core          | 1.48.2  |

devDependencies（节选，完整见 `package.json`）：

| 包                      | 版本   |
| ----------------------- | ------ |
| typescript              | 6.0.3  |
| vite                    | 8.1.0  |
| vue-tsc                 | 3.3.5  |
| unplugin-auto-import    | 21.0.0 |
| unplugin-vue-components | 32.1.0 |
| eslint                  | 10.5.0 |
| typescript-eslint       | 8.62.0 |
| eslint-plugin-vue       | 10.9.2 |
| eslint-plugin-import    | 2.32.0 |
| prettier                | 3.8.4  |
| vitest                  | 4.1.9  |
| @vue/test-utils         | 2.4.11 |
| openapi-typescript      | 7.13.0 |
| @commitlint/cli         | 21.1.0 |
| lint-staged             | 17.0.8 |
| simple-git-hooks        | 2.13.1 |

## 接入后端 Swagger 的步骤

1. 拿到后端 Swagger/OpenAPI 文档地址，例如 `http://<backend-host>/v3/api-docs`。
2. 执行：
   ```bash
   SWAGGER_URL=http://<backend-host>/v3/api-docs pnpm gen:api-types
   ```
3. 生成的 `schema.d.ts` 会写入 `src/contracts/api-types/`（该目录已标注 do-not-edit）。
4. 业务层不要直接引用生成产物的内部结构，通过 `src/contracts/` 下的我方类型（如 `common.ts`、`form-schema.ts`）间接使用；新增业务类型时在 `contracts/` 补充对应的我方契约。

## 校验命令

```bash
pnpm install
pnpm typecheck   # vue-tsc -b --noEmit
pnpm lint        # eslint .
pnpm test        # vitest run
pnpm build       # vue-tsc -b && vite build
pnpm preview     # 仅用于短时冒烟，验证后立刻终止进程，不要当阻塞式校验跑
```

## 真接 vs 留空 seam（登录骨架 v2，对齐后端真实接口）

实测后端只有两个真实端点：`POST /auth/login`（裸 token 字符串，Bearer 7200s，无 httpOnly cookie refresh）、
`GET /system/dict/data/list/{type}`（字典，字段名 `code`→FE 的 `value`）。其余全部是边界清晰、实现留空的 seam：

- **真接**：`foundation/auth.login()` 真调 `/auth/login`；`foundation/dict.loadDict()` 真调字典接口并做 `code→value` 适配。
- **留空 seam**（均标注 `// TODO(skeleton)`，指向决策文档 v2 §6 的未来形状）：
  - `foundation/auth.refresh()` / `logout()`：`/auth/refresh`、`/auth/logout` 端点不存在，直接 reject / 仅清本地态。
  - `foundation/session.loadSession()`：`getInfo` 端点不存在，返回占位会话（`permissions`/`roles` 空集、`superAdmin=false`，`user` 取登录时已知的最小信息）。
  - `foundation/menu.loadMenu()`：菜单树端点不存在，喂本地占位载荷（7 个模块顶层节点），但 `buildRoutesFromMenu()` + `router/guard.ts` 的动态路由机器是真跑通的——端点落地后只需替换 `loadMenu()`/`loadSession()` 函数体，下游零改动。
- **不发租户头**（tenantId 由后端从 token 解出，FE 不参与）；超管用 `superAdmin: boolean`（非通配权限串）；数据权限 `checkDataScope` 恒真，仅 UX 展示用，本轮不做任何 scope 过滤。
- `adapters/form-designer` / `adapters/bpmn` / `adapters/flow-graph`：均为接口 + `throw new Error('not implemented')`，第三方库已装未引用，等待后续真正集成。
- `layouts/BasicLayout.vue`：标签页（多页签）占位，未实现；侧边栏仍是静态导航，未接入 `foundation/menu` 的动态菜单数据渲染。
- `src/contracts/api-types/`：尚无生成产物，等待后端 Swagger 地址。

## 下一步建议：补齐后端时按这些形状接

拿到对应端点的 Swagger 地址后，先跑 `pnpm gen:api-types` 生成类型，再逐个填充上面三个留空 seam：

- `POST /auth/refresh`：FE 侧需同时补单飞刷新逻辑（模块级 `refreshPromise` 去重并发 401）。
- `POST /auth/logout`。
- `GET /auth/info`（或等价 getInfo）：一次返回用户基本信息 + 权限码集合 + 角色 key 集合 + `superAdmin` 布尔，直接映射进 `contracts/session.ts` 的 `Session` 规范态。
- 菜单树端点：节点含 `component`（文件路径风格，对齐 `foundation/menu` 当前的占位约定）、`name`/`title`、`icon`、`sort`、`menuType`（0 目录/1 菜单/2 按钮）、`permission`、`parentId`，直接映射进 `contracts/menu.ts` 的 `MenuNode`。
