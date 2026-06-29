<script setup lang="ts">
/**
 * 表单设计器（外壳刀 · 第一刀）。
 *
 * 三栏：控件库（左）→ 画布（中）→ 配置面板（右），底部保存草稿 / 发布。
 * 本刀只做「外壳 + 控件库 + 画布拖拽 + 字段类型注册表 + 空跑的保存/发布」：
 *  - 配置面板内容、实时预览、保存/发布真接线一律不做，留插槽。
 *
 * 内存模型 = @/contracts/form-schema 的 FormSchema（{ title, fields }）。
 * 契约里没有 status 键，故「草稿/已发布」是 UI 动作概念（保存草稿 vs 发布两个按钮），
 * 不作为 definition 的存储键——避免自造后端没有的键。本刀也不真存任何数据。
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormSchema } from '@/contracts/form-schema'
import FieldPalette from '../designer/FieldPalette.vue'
import DesignerCanvas from '../designer/DesignerCanvas.vue'
import FieldConfigPanel from '../designer/FieldConfigPanel.vue'
import { saveDraftDefinition, publishDefinition } from '../designer/draft-actions'
import { applyFieldPatch, type FieldPatch } from '../designer/field-config'
import type { DesignerItem } from '../designer/types'

const title = ref('未命名表单')
const items = ref<DesignerItem[]>([])
const selectedId = ref<string | null>(null)

const existingNames = computed(() => items.value.map((it) => it.field.name))
const selectedItem = computed(() => items.value.find((it) => it.id === selectedId.value) ?? null)
/** 选中字段之外的列名集合，供配置面板做同表单重名校验（排除自身，避免自我误报）。 */
const otherNames = computed(() =>
  items.value.filter((it) => it.id !== selectedId.value).map((it) => it.field.name),
)

/**
 * 配置面板回写：就地把补丁合并进选中字段（单一数据源，画布卡片随之更新）。
 * 补丁受 FieldPatch 约束（仅契约已有键），不可能写入脏键。
 */
function patchSelectedField(patch: FieldPatch) {
  const item = items.value.find((it) => it.id === selectedId.value)
  if (item) applyFieldPatch(item.field, patch)
}

/**
 * 从画布项导出表单定义。
 * 红线：只取 field（纯 FormSchemaField），丢弃 DesignerItem.id —— 导出的 JSON 与后端契约同形，
 * 不带任何 UI-only 键。
 */
function buildDefinition(): FormSchema {
  return {
    title: title.value.trim() || '未命名表单',
    fields: items.value.map((it) => it.field),
  }
}

/** 保存草稿：本刀空跑（接口待接，第四刀）。绝不触发任何建表/DDL。 */
function saveDraft() {
  saveDraftDefinition(buildDefinition())
  ElMessage.success('草稿已记录（接口待接，见控制台）')
}

/** 发布：先二次确认，确认后空跑（接口待接，第五刀）。 */
async function publish() {
  try {
    await ElMessageBox.confirm('发布后表单将对外可用并可能触发后端建表，确认发布？', '发布确认', {
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 用户取消
  }
  publishDefinition(buildDefinition())
  ElMessage.success('发布动作已记录（接口待接，见控制台）')
}
</script>

<template>
  <div class="designer">
    <header class="designer__header">
      <el-input v-model="title" class="designer__title" placeholder="表单名称" />
      <div class="designer__actions">
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="publish">发布</el-button>
      </div>
    </header>

    <div class="designer__body">
      <FieldPalette :existing-names="existingNames" />
      <DesignerCanvas v-model:items="items" v-model:selected-id="selectedId" />
      <FieldConfigPanel
        :field="selectedItem"
        :other-names="otherNames"
        @update="patchSelectedField"
      />
    </div>
  </div>
</template>

<style scoped>
.designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.designer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sw-space-16);
  padding: var(--sw-space-12) var(--sw-space-24);
  border-bottom: 1px solid var(--sw-border-light);
}

.designer__title {
  max-width: 320px;
}

.designer__actions {
  display: flex;
  gap: var(--sw-space-8);
}

.designer__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
