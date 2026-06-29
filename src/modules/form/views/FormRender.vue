<script setup lang="ts">
/**
 * FormRender — 低代码表单渲染页（页型 A）。
 *
 * ## 三种模式
 * | recordId | mode   | 行为                                |
 * |----------|--------|-------------------------------------|
 * | 无       | —      | 新建空表单，可填可提交              |
 * | 有       | view   | 只读回显，隐藏提交按钮              |
 * | 有       | edit   | 可编辑回显（保存走 seam「待上线」） |
 *
 * ## 记录加载
 * - 进页若带 recordId：调 queryFormData(filters:[id EQ recordId]) 取单记录
 * - TABLE 字段：JSON 串 → 数组
 * - REFERENCE 字段：后端物理列 ref_{name}_id → formData.{name}（存 id）
 * - REFERENCE 显示名：resolveReferenceDisplay → referenceLabels[name]
 *   显示名单独注入 DynamicField 的 referenceLabel prop，不污染 v-model
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getFormDefinition, submitForm, queryFormData } from '@/modules/form/api/form'
import { ApiError } from '@/foundation/request'
import DynamicField from '@/components/DynamicField.vue'
import { resolveReferenceDisplay } from '@/modules/form/utils/resolve-reference-display'
import type { FormSchema, FormSchemaField } from '@/contracts/form-schema'

/* ── 路由参数 ── */

const route = useRoute()
const formKey = String(route.params.formKey)
const recordId = route.query.recordId ? String(route.query.recordId) : ''
const mode = route.query.mode === 'edit' ? 'edit' : 'view'

/* ── 状态 ── */

const schema = ref<FormSchema | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const formData = reactive<Record<string, unknown>>({})
/** REFERENCE 字段显示名映射：{ fieldName: displayName } */
const referenceLabels = reactive<Record<string, string>>({})

// 查看只读模式：有 recordId 且 mode=view；无 recordId 时永远是新建（可编辑）
const isViewMode = computed(() => !!recordId && mode === 'view')
const pageTitle = computed(() => {
  if (!schema.value) return `表单 — ${formKey}`
  const modeLabel = isViewMode.value ? '（查看）' : recordId ? '（编辑）' : ''
  return `${schema.value.title}${modeLabel}`
})

/* ── 字段默认值初始化 ── */

function initField(field: FormSchemaField) {
  switch (field.type) {
    case 'TABLE':
      formData[field.name] = []
      break
    case 'BOOL':
      formData[field.name] = false
      break
    case 'NUMBER':
      formData[field.name] = 0
      break
    default:
      formData[field.name] = ''
  }
}

function tryParseJSON(str: string, fallback: unknown): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/* ── schema 加载 + 记录加载 ── */

async function loadSchema() {
  loading.value = true
  errorMsg.value = ''
  try {
    schema.value = await getFormDefinition(formKey)
    if (!schema.value) return

    if (recordId) {
      await loadRecord(schema.value)
    } else {
      for (const field of schema.value.fields) initField(field)
    }
  } catch {
    errorMsg.value = '表单定义加载失败，请检查 formKey 是否正确'
  } finally {
    loading.value = false
  }
}

/**
 * 按 recordId 加载已有记录并回填 formData。
 * - TABLE 字段: JSON 串 → 数组
 * - REFERENCE 字段: 物理列 ref_{name}_id → formData.{name}
 * - REFERENCE 显示名: 并发解析后写入 referenceLabels
 */
async function loadRecord(schema: FormSchema) {
  try {
    const result = await queryFormData(formKey, {
      pageNum: 1,
      pageSize: 1,
      filters: [{ field: 'id', op: 'EQ', value: recordId }],
    })
    const record = result.list?.[0]
    if (!record) {
      errorMsg.value = '记录不存在或已被删除'
      return
    }

    const refPromises: Promise<void>[] = []

    for (const field of schema.fields) {
      switch (field.type) {
        case 'TABLE': {
          const raw = record[field.name]
          formData[field.name] = typeof raw === 'string' ? tryParseJSON(raw, []) : (raw ?? [])
          break
        }
        case 'REFERENCE': {
          const physCol = `ref_${field.name}_id`
          const refValue = record[physCol]
          formData[field.name] = refValue ?? ''

          if (refValue && field.targetFormId) {
            const p = resolveReferenceDisplay(field.targetFormId, String(refValue)).then(
              (display) => {
                referenceLabels[field.name] = display
              },
            )
            refPromises.push(p)
          }
          break
        }
        default: {
          const val = record[field.name]
          formData[field.name] = val !== null && val !== undefined ? val : ''
        }
      }
    }

    // 并发等待所有 REFERENCE 显示名解析
    if (refPromises.length > 0) {
      await Promise.all(refPromises)
    }
  } catch {
    errorMsg.value = '记录加载失败'
  }
}

/* ── 业务错误码映射 ── */

function businessError(code: number, fallback: string): string {
  const MAP: Record<number, string> = {
    1401: '必填字段缺失，请检查所有必填项',
    1403: '字段值超出字典允许范围，请重新选择',
  }
  return MAP[code] ?? fallback
}

/* ── 提交 / 保存 ── */

async function handleSubmit() {
  submitting.value = true
  errorMsg.value = ''
  successMsg.value = ''

  // 编辑保存 seam（更新端点待上线）
  if (recordId) {
    errorMsg.value = '编辑保存：更新端点待上线'
    submitting.value = false
    return
  }

  // 新建提交
  try {
    const id = await submitForm(formKey, { ...formData }, schema.value?.fields)
    successMsg.value = `提交成功，记录 ID：${id}`
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = businessError(err.code, err.msg)
    } else {
      errorMsg.value = '提交失败：后端提交端点待上线'
    }
  } finally {
    submitting.value = false
  }
}

// ── 挂载 ──
onMounted(loadSchema)
</script>

<template>
  <div class="form-render-page">
    <el-skeleton v-if="loading && !schema" :rows="4" animated />
    <template v-else>
      <!-- 提示条 -->
      <el-alert
        v-if="errorMsg"
        type="error"
        :title="errorMsg"
        show-icon
        :closable="false"
        class="form-render-page__alert"
      />
      <el-alert
        v-if="successMsg"
        type="success"
        :title="successMsg"
        show-icon
        :closable="false"
        class="form-render-page__alert"
      />

      <el-empty v-if="!schema && !errorMsg" description="表单不存在或加载失败" />

      <template v-else-if="schema">
        <!-- 页标题 -->
        <h1 class="form-render-page__title">{{ pageTitle }}</h1>
        <p v-if="!isViewMode" class="form-render-page__hint">带 * 为必填项</p>

        <!-- 字段渲染区 -->
        <div class="form-render-page__card">
          <div class="form-render-page__group">
            <div v-for="field in schema.fields" :key="field.name" class="form-render-page__field">
              <DynamicField
                :field="field"
                :model-value="formData[field.name]"
                :readonly="isViewMode"
                :reference-label="referenceLabels[field.name] ?? ''"
                @update:model-value="formData[field.name] = $event"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <template v-if="!isViewMode">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ recordId ? '保存' : '提交' }}
          </el-button>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
.form-render-page {
  max-width: 920px;
  margin: 0 auto;
  padding: var(--sw-space-24) var(--sw-space-24);
}

.form-render-page__alert {
  margin-bottom: var(--sw-space-16);
}

.form-render-page__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--sw-text-primary);
  margin: 0 0 var(--sw-space-8);
}

.form-render-page__hint {
  font-size: var(--sw-font-secondary);
  color: var(--sw-text-secondary);
  margin: 0 0 var(--sw-space-20);
}

.form-render-page__card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  padding: 22px 28px;
  margin-bottom: var(--sw-space-20);
}

.form-render-page__group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 28px;
}

.form-render-page__field {
  /* 多行文本/子表格跨整行 */
  :deep(.dynamic-field__table),
  :deep(.dynamic-field) > .el-textarea {
    grid-column: 1 / -1;
  }
}
</style>
