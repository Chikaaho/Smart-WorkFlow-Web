import type { FormSchema } from '@/contracts/form-schema'

/**
 * 保存草稿 / 发布的动作接缝（本刀空跑）。
 *
 * 两个动作分开、互不混用。本刀只把定义对象打印出来验证形状，**不发任何请求、不触发建表/DDL**。
 * 第四刀 / 第五刀把这里换成走 foundation/request 的真接口，FormDesigner 调用处零改。
 */

/** TODO(第四刀): 接草稿保存接口（走 foundation/request），当前仅打印定义。 */
export function saveDraftDefinition(definition: FormSchema): void {
  console.log('[form-designer] 草稿保存（接口待接，第四刀）', definition)
}

/** TODO(第五刀): 接发布接口（走 foundation/request），当前仅打印定义。 */
export function publishDefinition(definition: FormSchema): void {
  console.log('[form-designer] 发布（接口待接，第五刀）', definition)
}
