/**
 * 业务错误码 → 中文映射（临时层）。
 *
 * ## 设计意图
 * 后端全局异常 + i18n 上线后以后端返回的 message 为准；
 * 当后端返回 code≠0 但 message 为空/未定义时，本映射提供兜底中文文案，
 * 避免用户看到原始 code 或空提示。
 *
 * ## 优先级
 * 1. 后端返回 message 非空 → 使用后端文案（为将来 i18n 留口）
 * 2. 后端 message 为空 → 查本映射
 * 3. 本映射无此 code → 降级文案 "业务错误({code})"
 *
 * ## 当前覆盖
 * - 1400–1403: 表单提交校验（对齐后端 FormDefinitionSchema 校验码）
 * - 1500–1505: 表单数据查询校验（对齐后端 FormDataQuery 校验码）
 */
export const ERROR_CODE_MAP: Record<number, string> = {
  1400: '未知字段',
  1401: '必填字段未填',
  1402: '字段类型不正确',
  1403: '字典值不在允许范围',
  1500: '表单不存在或未发布',
  1501: '字段未知',
  1502: '不可筛选',
  1503: '操作符与字段类型不匹配',
  1504: '操作符不支持',
  1505: '记录被其他表单引用，不能删除',
}

/**
 * 获取可读的错误提示文案。
 * @param code         业务错误码
 * @param backendMessage 后端返回的 message（可能为空）
 */
export function getErrorMessage(code: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  return ERROR_CODE_MAP[code] ?? `业务错误(${code})`
}
