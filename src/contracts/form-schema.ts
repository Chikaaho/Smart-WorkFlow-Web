/**
 * 前端自有表单契约,与后端 definition JSON 及 form-create 原生 schema 解耦。
 * 后端 definition 经 adapters/form-designer/parseDefinition 映射进来;
 * form-create 原生 schema 经 adapters/form-designer/toFormCreateRule 转出。
 * 业务层只认本文件导出的类型,不认后端原生 JSON。
 */

export type FieldType =
  | 'TEXT'
  | 'RICH_TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'BOOL'
  | 'DICT'
  | 'REFERENCE'
  | 'TABLE'

/** TABLE 子字段:仅携带 name 与 type,不递归嵌套。 */
export interface TableSubField {
  name: string
  type: FieldType
}

interface BaseField {
  name: string
  label?: string
  required?: boolean
}

export interface TextField extends BaseField {
  type: 'TEXT'
}

export interface RichTextField extends BaseField {
  type: 'RICH_TEXT'
}

export interface NumberField extends BaseField {
  type: 'NUMBER'
}

export interface DateField extends BaseField {
  type: 'DATE'
}

export interface BoolField extends BaseField {
  type: 'BOOL'
}

export interface DictField extends BaseField {
  type: 'DICT'
  dictType: string
}

export interface ReferenceField extends BaseField {
  type: 'REFERENCE'
}

export interface TableField extends BaseField {
  type: 'TABLE'
  subFields: TableSubField[]
}

/** 判别式联合——type 字面量为判别子,TypeScript 可在 if/switch 中自动收窄。 */
export type FormSchemaField =
  | TextField
  | RichTextField
  | NumberField
  | DateField
  | BoolField
  | DictField
  | ReferenceField
  | TableField

export interface FormSchema {
  title: string
  fields: FormSchemaField[]
}
