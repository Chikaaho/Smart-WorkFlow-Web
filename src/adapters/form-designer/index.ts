import type { FormSchema } from '@/contracts/form-schema'

/**
 * form-create（@form-create/designer + @form-create/element-ui）的防腐层。
 * 第三方库的原生 schema/API 只允许在本文件内出现，业务层只认下方导出的我方契约。
 */

export function toFormSchema(_native: unknown): FormSchema {
  throw new Error('not implemented') // TODO(skeleton): 接入 @form-create 原生 schema 转换
}

export function fromFormSchema(_schema: FormSchema): unknown {
  throw new Error('not implemented') // TODO(skeleton): 转换为 @form-create 原生 schema
}

export function mountFormDesigner(_container: HTMLElement, _schema?: FormSchema): void {
  throw new Error('not implemented') // TODO(skeleton): 挂载 @form-create/designer
}
