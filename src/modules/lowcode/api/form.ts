import { request } from '@/foundation/request'
import type { PageQuery, PageResult } from '@/contracts/common'
import { parseDefinition } from '@/adapters/form-designer'
import type { FormSchema } from '@/contracts/form-schema'

export interface FormDefDTO {
  formKey: string
  formName: string
}

/** 后端分页响应原始形状:字段名为 records(区别于前端契约的 list)。 */
interface BackendPageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

/** 直连: GET /api/form/def/by-key/{formKey} */
export async function getFormDef(formKey: string): Promise<FormDefDTO> {
  return request<FormDefDTO>({
    method: 'GET',
    url: `/form/def/by-key/${formKey}`,
  })
}

/** 直连: GET /api/form/def/by-key/{formKey}/definition → 裸 JSON 字符串经防腐层解析为 FormSchema */
export async function getFormDefinition(formKey: string): Promise<FormSchema> {
  const rawJson = await request<string>({
    method: 'GET',
    url: `/form/def/by-key/${formKey}/definition`,
  })
  return parseDefinition(rawJson)
}

/**
 * seam: 后端端点未就绪,形状已锁,上线即通。
 * POST /api/form/submit/{formKey}
 * 请求体: Record<string, unknown>  返回: recordId(string)
 */
export async function submitForm(formKey: string, data: Record<string, unknown>): Promise<string> {
  return request<string>({
    method: 'POST',
    url: `/form/submit/${formKey}`,
    data,
  })
}

/**
 * seam: 后端端点未就绪,形状已锁,上线即通。
 * GET /api/form/submit/by-key/{formKey}/list  query: pageNum, pageSize
 * 返回: PageResult<Record<string, unknown>>
 */
export async function listSubmissions(
  formKey: string,
  page: PageQuery,
): Promise<PageResult<Record<string, unknown>>> {
  const raw = await request<BackendPageResult<Record<string, unknown>>>({
    method: 'GET',
    url: `/form/submit/by-key/${formKey}/list`,
    params: page,
  })
  return {
    list: raw.records,
    total: raw.total,
    pageNum: raw.pageNum,
    pageSize: raw.pageSize,
  }
}
