<script setup lang="ts">
/**
 * DynamicField — 低代码字段渲染原子。
 * 按 field.type 判别式渲染对应 Element Plus 控件，不含布局壳。
 * 数据外部进（modelValue），更新通过 emit 出——零 onMounted 拉数据。
 *
 * 8 类渲染链提炼自 FormRender.vue（demo 保留不修改）：
 *   TEXT→el-input / RICH_TEXT→el-input textarea / NUMBER→el-input-number
 *   DATE→el-date-picker(valueFormat YYYY-MM-DD) / BOOL→el-switch
 *   DICT→DictSelect(注入 dictType) / REFERENCE→ReferenceSelector(只读输入框+弹窗选择器) / TABLE→原生 table
 */
import { computed, ref } from 'vue'
import type { FormSchemaField, IdValueProperty } from '@/contracts/form-schema'
import DictSelect from '@/foundation/dict/DictSelect.vue'
import ReferenceSelector from '@/modules/form/components/ReferenceSelector.vue'

const props = withDefaults(
  defineProps<{
    field: FormSchemaField
    modelValue: unknown
    /**
     * 只读模式：
     * - TEXT / RICH_TEXT → readonly
     * - NUMBER / DATE / BOOL / DICT → disabled
     * - REFERENCE → 只读输入框，禁用「选择」按钮
     * - TABLE → 隐藏添加/删除按钮，子控件 disabled
     */
    readonly?: boolean
    /**
     * REFERENCE 字段回显标签（显示名）。
     * 记录加载时由父页面 resolveReferenceDisplay 解析后传入，
     * 覆盖内置的 referenceDisplayValue。
     * 只影响「显示」，底层 v-model 仍为 id。
     */
    referenceLabel?: string
  }>(),
  {
    readonly: false,
    referenceLabel: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

/* ── 类型适配：将 unknown modelValue 转为各控件所需的类型 ── */
const strVal = computed(() => String(props.modelValue ?? ''))
const numVal = computed(() => Number(props.modelValue ?? 0))
const boolVal = computed(() => Boolean(props.modelValue))

/* ── TABLE 行操作 ── */
type Row = Record<string, unknown> & {
  _rowAction?: 'ADD' | 'UPDATE' | 'DELETE' | 'UNCHANGED'
  _rowId?: string
}
const tableRows = computed<Row[]>(() => {
  const v = props.modelValue
  return Array.isArray(v) ? (v as Row[]) : []
})

function addRow() {
  if (props.field.type !== 'TABLE') return
  const row: Row = { _rowAction: 'ADD' }
  for (const sf of props.field.subFields) row[sf.name] = ''
  emit('update:modelValue', [...tableRows.value, row])
}

function removeRow(idx: number) {
  const rows = [...tableRows.value]
  const row = rows[idx] as Row
  if (row._rowAction === 'ADD') {
    rows.splice(idx, 1)
  } else {
    rows[idx] = { ...row, _rowAction: 'DELETE' as const }
  }
  emit('update:modelValue', rows)
}

function updateCell(rowIdx: number, subName: string, value: unknown) {
  emit(
    'update:modelValue',
    tableRows.value.map((r, i) => {
      if (i !== rowIdx) return r
      const row = r as Row
      const nextAction: Row['_rowAction'] =
        row._rowAction === 'UNCHANGED' ? 'UPDATE' : (row._rowAction ?? 'ADD')
      return { ...row, [subName]: value, _rowAction: nextAction }
    }),
  )
}

/* ── REFERENCE 选择器状态 ── */
const referenceSelectorVisible = ref(false)
/** 从选择器回填的显示值（UI 用），v1 编辑回显无法反查时仍显示原始 ID。 */
const referenceDisplayValue = ref('')

const referenceDisplayText = computed(
  () => props.referenceLabel || referenceDisplayValue.value || strVal.value,
)

function onReferenceSelect(payload: IdValueProperty) {
  referenceDisplayValue.value = payload.value
  emit('update:modelValue', payload.id)
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
      :readonly="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- RICH_TEXT（降级 textarea） -->
    <el-input
      v-else-if="field.type === 'RICH_TEXT'"
      type="textarea"
      :rows="4"
      :model-value="strVal"
      :readonly="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- NUMBER -->
    <el-input-number
      v-else-if="field.type === 'NUMBER'"
      :model-value="numVal"
      :disabled="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- DATE -->
    <el-date-picker
      v-else-if="field.type === 'DATE'"
      value-format="YYYY-MM-DD"
      :model-value="strVal"
      :disabled="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- BOOL -->
    <el-switch
      v-else-if="field.type === 'BOOL'"
      :model-value="boolVal"
      :disabled="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- DICT（走 DictSelect 通道，支持 select/radio 变体） -->
    <DictSelect
      v-else-if="field.type === 'DICT'"
      :type="field.dictType"
      :render-as="field.renderAs"
      :model-value="strVal"
      :disabled="readonly"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <!-- REFERENCE（关联选择器） -->
    <div v-else-if="field.type === 'REFERENCE'" class="dynamic-field__reference">
      <el-input :model-value="referenceDisplayText" placeholder="请选择关联记录" readonly>
        <template #append>
          <el-button
            :disabled="readonly || !field.targetFormId"
            @click="referenceSelectorVisible = true"
          >
            选择
          </el-button>
        </template>
      </el-input>
      <ReferenceSelector
        v-if="referenceSelectorVisible"
        v-model:visible="referenceSelectorVisible"
        :target-form-key="field.targetFormId ?? ''"
        :selected-id="strVal"
        @select="onReferenceSelect"
      />
    </div>

    <!-- TABLE（内嵌子表，可增删行） -->
    <div v-else-if="field.type === 'TABLE'" class="dynamic-field__table">
      <table class="dynamic-field__table-inner">
        <thead>
          <tr>
            <th v-for="sf in field.subFields" :key="sf.name">{{ sf.name }}</th>
            <th v-if="!readonly">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, rowIdx) in tableRows" :key="rowIdx">
            <tr v-if="(row as Row)._rowAction !== 'DELETE'">
              <td v-for="sf in field.subFields" :key="sf.name">
                <!-- TEXT -->
                <el-input
                  v-if="sf.type === 'TEXT'"
                  size="small"
                  :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                  :readonly="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- RICH_TEXT（降级 textarea） -->
                <el-input
                  v-else-if="sf.type === 'RICH_TEXT'"
                  size="small"
                  type="textarea"
                  :rows="3"
                  :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                  :readonly="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- NUMBER -->
                <el-input-number
                  v-else-if="sf.type === 'NUMBER'"
                  size="small"
                  :model-value="Number(tableRows[rowIdx]?.[sf.name] ?? 0)"
                  :disabled="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- DATE -->
                <el-date-picker
                  v-else-if="sf.type === 'DATE'"
                  size="small"
                  value-format="YYYY-MM-DD"
                  :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                  :disabled="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- BOOL -->
                <el-switch
                  v-else-if="sf.type === 'BOOL'"
                  size="small"
                  :model-value="Boolean(tableRows[rowIdx]?.[sf.name])"
                  :disabled="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- DICT（透传子字段 dictType + renderAs） -->
                <DictSelect
                  v-else-if="sf.type === 'DICT'"
                  size="small"
                  :type="sf.dictType ?? ''"
                  :render-as="sf.renderAs"
                  :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                  :disabled="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
                <!-- REFERENCE（降级 input 占位）/ TABLE（不递归）/ fallback -->
                <el-input
                  v-else
                  size="small"
                  :model-value="String(tableRows[rowIdx]?.[sf.name] ?? '')"
                  placeholder="引用类型（文本占位）"
                  :readonly="readonly"
                  @update:model-value="updateCell(rowIdx, sf.name, $event)"
                />
              </td>
              <td v-if="!readonly">
                <el-button size="small" type="danger" @click="removeRow(rowIdx)">删除</el-button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <el-button v-if="!readonly" size="small" @click="addRow">+ 添加行</el-button>
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

/* ── REFERENCE 选择器 ── */
.dynamic-field__reference {
  width: 100%;
}
</style>
