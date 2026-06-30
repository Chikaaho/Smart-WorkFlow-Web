import { request } from '@/foundation/request'
import { parseDefinition } from '@/adapters/form-designer'
import type { FormSchema } from '@/contracts/form-schema'

/**
 * 表单定义 API 模块（设计器草稿保存 / 发布接线）。
 *
 * 四个端点，全部走 foundation/request，禁直引 axios。
 */

/** 后端 sw_form_def 记录状态。 */
export type FormDefStatus = 'DRAFT' | 'PUBLISHED'

/** 建草稿请求体。 */
export interface FormCreateReq {
  formKey: string
  name: string
}

/** 表单定义 DTO（后端返回）。 */
export interface FormDefDTO {
  id: string
  formKey: string
  name?: string
  status: FormDefStatus
}

/** 存 definition 请求体。 */
export interface FormConfigSaveReq {
  definition: string
}

/**
 * 新建草稿。
 * POST /api/form/def
 * 入参 FormCreateReq，返 FormDefDTO（status=DRAFT）。
 */
export async function createFormDef(req: FormCreateReq): Promise<FormDefDTO> {
  return request<FormDefDTO>({
    method: 'POST',
    url: '/form/def',
    data: req,
  })
}

/**
 * 保存表单定义（可反复调，不校验、不动状态）。
 * POST /api/form/def/{id}/config
 * 入参 FormConfigSaveReq（definition = FormSchema JSON 字符串）。
 */
export async function saveFormConfig(id: string, definition: string): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/form/def/${id}/config`,
    data: { definition } satisfies FormConfigSaveReq,
  })
}

/**
 * 取已存表单定义。
 * GET /api/form/def/{id}/definition
 * 返 definition JSON 字符串，经防腐层 parseDefinition 解析为 FormSchema。
 */
export async function getFormDefinitionById(id: string): Promise<FormSchema> {
  const rawJson = await request<string>({
    method: 'GET',
    url: `/form/def/${id}/definition`,
  })
  return parseDefinition(rawJson)
}

/**
 * 发布表单定义。
 * POST /api/form/def/{id}/publish
 * 后端从库读 definition 做校验 → 建表 DDL → status 改 PUBLISHED → 存快照。
 * 返更新后的 FormDefDTO（status=PUBLISHED）。
 *
 * 红线：后端不接前端传的 definition，所以调用方必须先调 saveFormConfig 再调本接口。
 */
export async function publishFormDef(id: string): Promise<FormDefDTO> {
  return request<FormDefDTO>({
    method: 'POST',
    url: `/form/def/${id}/publish`,
  })
}
