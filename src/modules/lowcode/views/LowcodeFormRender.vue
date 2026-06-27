<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getFormDefinition, submitForm } from '@/modules/lowcode/api/form'
import { ApiError } from '@/foundation/request'
import DictSelect from '@/foundation/dict/DictSelect.vue'
import type { FormSchema, FormSchemaField } from '@/contracts/form-schema'

const route = useRoute()
const formKey = String(route.params.formKey)

const schema = ref<FormSchema | null>(null)
const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const formData = reactive<Record<string, unknown>>({})

function strVal(name: string): string {
  return String(formData[name] ?? '')
}
function numVal(name: string): number {
  return Number(formData[name] ?? 0)
}
function boolVal(name: string): boolean {
  return Boolean(formData[name])
}
function tableRows(name: string): Record<string, unknown>[] {
  return (formData[name] as Record<string, unknown>[]) ?? []
}
function rowCellStr(name: string, rowIdx: number, sub: string): string {
  return String(tableRows(name)[rowIdx]?.[sub] ?? '')
}

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

async function loadSchema() {
  loading.value = true
  errorMsg.value = ''
  try {
    schema.value = await getFormDefinition(formKey)
    for (const field of schema.value.fields) initField(field)
  } catch {
    errorMsg.value = '表单定义加载失败，请检查 formKey 是否正确'
  } finally {
    loading.value = false
  }
}

function businessError(code: number, fallback: string): string {
  const MAP: Record<number, string> = {
    1401: '必填字段缺失，请检查所有必填项',
    1403: '字段值超出字典允许范围，请重新选择',
  }
  return MAP[code] ?? fallback
}

async function handleSubmit() {
  submitting.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const recordId = await submitForm(formKey, { ...formData })
    successMsg.value = `提交成功，记录 ID：${recordId}`
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

function addRow(field: FormSchemaField) {
  if (field.type !== 'TABLE') return
  const row: Record<string, unknown> = {}
  for (const sf of field.subFields) row[sf.name] = ''
  ;(formData[field.name] as Record<string, unknown>[]).push(row)
}

function removeRow(fieldName: string, idx: number) {
  ;(formData[fieldName] as Record<string, unknown>[]).splice(idx, 1)
}

onMounted(loadSchema)
</script>

<template>
  <div style="padding: 32px">
    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else>
      <!-- 加载失败或提交错误统一显示在顶部 -->
      <el-alert
        v-if="errorMsg"
        type="error"
        :title="errorMsg"
        style="margin-bottom: 16px"
        :closable="false"
      />
      <el-alert
        v-if="successMsg"
        type="success"
        :title="successMsg"
        style="margin-bottom: 16px"
        :closable="false"
      />
      <el-empty v-if="!schema && !errorMsg" description="表单不存在或加载失败" />
      <template v-else-if="schema">
        <h2>{{ schema.title }}</h2>
        <el-form label-position="top">
          <div v-for="field in schema.fields" :key="field.name" :data-field-name="field.name">
            <el-form-item :label="field.label ?? field.name" :required="field.required">
              <el-input
                v-if="field.type === 'TEXT'"
                :model-value="strVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <el-input
                v-else-if="field.type === 'RICH_TEXT'"
                type="textarea"
                :rows="4"
                :model-value="strVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <el-input-number
                v-else-if="field.type === 'NUMBER'"
                :model-value="numVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <el-date-picker
                v-else-if="field.type === 'DATE'"
                value-format="YYYY-MM-DD"
                :model-value="strVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <el-switch
                v-else-if="field.type === 'BOOL'"
                :model-value="boolVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <DictSelect
                v-else-if="field.type === 'DICT'"
                :type="field.dictType"
                :model-value="strVal(field.name)"
                @update:model-value="formData[field.name] = $event"
              />
              <el-input
                v-else-if="field.type === 'REFERENCE'"
                :model-value="strVal(field.name)"
                placeholder="引用类型（文本占位）"
                @update:model-value="formData[field.name] = $event"
              />
              <div v-else-if="field.type === 'TABLE'" class="table-field">
                <table
                  border="1"
                  style="border-collapse: collapse; width: 100%; margin-bottom: 8px"
                >
                  <thead>
                    <tr>
                      <th
                        v-for="sf in field.subFields"
                        :key="sf.name"
                        style="padding: 4px 8px; text-align: left"
                      >
                        {{ sf.name }}
                      </th>
                      <th style="padding: 4px 8px; text-align: left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(_, rowIdx) in tableRows(field.name)" :key="rowIdx">
                      <td v-for="sf in field.subFields" :key="sf.name" style="padding: 4px 8px">
                        <el-input
                          size="small"
                          :model-value="rowCellStr(field.name, rowIdx, sf.name)"
                          @update:model-value="tableRows(field.name)[rowIdx][sf.name] = $event"
                        />
                      </td>
                      <td style="padding: 4px 8px">
                        <el-button
                          size="small"
                          type="danger"
                          @click="removeRow(field.name, rowIdx)"
                        >
                          删除
                        </el-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <el-button size="small" @click="addRow(field)">+ 添加行</el-button>
              </div>
            </el-form-item>
          </div>
        </el-form>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </template>
  </div>
</template>
