/**
 * 我方表单契约，与 form-create 的原生 schema 解耦。
 * form-create 原生 schema 不得外泄到业务层，转换逻辑在 adapters/form-designer 中完成。
 */

export type FieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'switch'

export interface FormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string | number }>
}

export interface FormSchema {
  id: string
  name: string
  fields: FormField[]
}
