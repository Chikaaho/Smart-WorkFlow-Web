<script setup lang="ts">
/**
 * DynamicField — 低代码字段渲染原子。
 * 按 field.type 判别式渲染对应 Element Plus 控件，不含布局壳。
 * 数据外部进（modelValue），更新通过 emit 出——零 onMounted 拉数据。
 *
 * 8 类渲染链提炼自 LowcodeFormRender.vue（demo 保留不修改）：
 *   TEXT→el-input / RICH_TEXT→el-input textarea / NUMBER→el-input-number
 *   DATE→el-date-picker(valueFormat YYYY-MM-DD) / BOOL→el-switch
 *   DICT→DictSelect(注入 dictType) / REFERENCE→el-input 降级 / TABLE→原生 table
 */
import { computed } from 'vue'
import type { FormSchemaField } from '@/contracts/form-schema'
import DictSelect from '@/foundation/dict/DictSelect.vue'

const props = defineProps<{
  field: FormSchemaField
  modelValue: unknown
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

/* ── 类型适配：将 unknown modelValue 转为各控件所需的类型 ── */
const strVal = computed(() => String(props.modelValue ?? ''))
const numVal = computed(() => Number(props.modelValue ?? 0))
const boolVal = computed(() => Boolean(props.modelValue))

/* ── TABLE 行操作 ── */
type Row = Record<string, unknown>
const tableRows = computed<Row[]>(() => {
  const v = props.modelValue
  return Array.isArray(v) ? (v as Row[]) : []
})

function addRow() {
  if (props.field.type !== 'TABLE') return
  const row: Row = {}
  for (const sf of props.field.subFields) row[sf.name] = ''
  emit('update:modelValue', [...tableRows.value, row])
}

function removeRow(idx: number) {
  const rows = [...tableRows.value]
  rows.splice(idx, 1)
  emit('update:modelValue', rows)
}

function updateCell(rowIdx: number, subName: string, value: unknown) {
  emit(
    'update:modelValue',
    tableRows.value.map((r, i) => (i === rowIdx ? { ...r, [subName]: value } : r)),
  )
}
</script>

<template>
  <div class="dynamic-field">
    <!-- 标签 + 必填红星（页型A 规范） -->
    <label class="dynamic-field__label">
      <span v-if="field.required" class="dynamic-field__required">*</span>
      {{ field.label ?? field.name }}
    </label>

    <!-- TEXT -->
    <el-input
      v-if="field.type === 'TEXT'"
      :model-value="strVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- RICH_TEXT（降级 textarea） -->
    <el-input
      v-else-if="field.type === 'RICH_TEXT'"
      type="textarea"
      :rows="4"
      :model-value="strVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- NUMBER -->
    <el-input-number
      v-else-if="field.type === 'NUMBER'"
      :model-value="numVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- DATE -->
    <el-date-picker
      v-else-if="field.type === 'DATE'"
      value-format="YYYY-MM-DD"
      :model-value="strVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- BOOL -->
    <el-switch
      v-else-if="field.type === 'BOOL'"
      :model-value="boolVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- DICT（走 DictSelect 通道） -->
    <DictSelect
      v-else-if="field.type === 'DICT'"
      :type="field.dictType"
      :model-value="strVal"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- REFERENCE（降级 input 占位） -->
    <el-input
      v-else-if="field.type === 'REFERENCE'"
      :model-value="strVal"
      placeholder="引用类型（文本占位）"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- TABLE（内嵌子表，可增删行） -->
    <div v-else-if="field.type === 'TABLE'" class="dynamic-field__table">
      <table class="dynamic-field__table-inner">
        <thead>
          <tr>
            <th v-for="sf in field.subFields" :key="sf.name">{{ sf.name }}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_, rowIdx) in tableRows" :key="rowIdx">
            <td v-for="sf in field.subFields" :key="sf.name">
              <el-input
                size="small"
                :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                @update:model-value="updateCell(rowIdx, sf.name, $event)"
              />
            </td>
            <td>
              <el-button size="small" type="danger" @click="removeRow(rowIdx)">删除</el-button>
            </td>
          </tr>
        </tbody>
      </table>
      <el-button size="small" @click="addRow">+ 添加行</el-button>
    </div>
  </div>
</template>

<style scoped>
/* ── 所有视觉值仅引用 --sw-* token，零硬编码 px/hex ── */

.dynamic-field {
  width: 100%;
}

.dynamic-field__label {
  display: block;
  margin-bottom: var(--sw-space-8);
  font-size: var(--sw-font-emphasis);
  font-weight: var(--sw-font-weight-emphasis);
  color: var(--sw-text-primary);
}

.dynamic-field__required {
  color: var(--sw-danger);
  margin-right: var(--sw-space-4);
}

/* 控件高度统一 */
.dynamic-field :deep(.el-input__wrapper),
.dynamic-field :deep(.el-input-number__wrapper),
.dynamic-field :deep(.el-select__wrapper) {
  min-height: var(--sw-control-height);
}

/* focus 态：边框主色 + 光晕（页型A 规范） */
.dynamic-field :deep(.el-input.is-focus .el-input__wrapper),
.dynamic-field :deep(.el-input-number.is-focus .el-input-number__wrapper),
.dynamic-field :deep(.el-select.is-focus .el-select__wrapper),
.dynamic-field :deep(.el-date-editor.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px var(--sw-color-primary); /* focus 光晕 fallback */
}

/* 圆角 */
.dynamic-field :deep(.el-input__wrapper),
.dynamic-field :deep(.el-input-number__wrapper),
.dynamic-field :deep(.el-select__wrapper),
.dynamic-field :deep(.el-button) {
  border-radius: var(--sw-radius-base);
}

/* ── 内嵌子表 ── */
.dynamic-field__table {
  width: 100%;
}

.dynamic-field__table-inner {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: var(--sw-space-8);
  border: 1px solid var(--sw-border-base);
}

.dynamic-field__table-inner th,
.dynamic-field__table-inner td {
  padding: var(--sw-space-4) var(--sw-space-8);
  text-align: left;
  border: 1px solid var(--sw-border-light);
}

.dynamic-field__table-inner th {
  font-size: var(--sw-font-caption);
  font-weight: var(--sw-font-weight-caption);
  background: var(--sw-fill-base);
}
</style>
