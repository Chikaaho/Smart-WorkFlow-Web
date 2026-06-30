<script setup lang="ts">
/**
 * 控件库（设计器左栏）。
 *
 * 渲染字段类型注册表（FIELD_TYPE_REGISTRY），每条 = 一个可拖拽的控件。
 * 拖入画布时经 :clone 把「描述符」转成「画布项」（DesignerItem），完成默认字段装配
 * 与列名生成。**这里禁止写死 8 类**——加类型只动注册表。
 *
 * 与画布共享 SortableJS group 'designer-fields'，pull:'clone' + put:false + sort:false：
 * 控件库本身永不被改动，只作为克隆来源。
 */
import type { Component } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import {
  EditPen,
  Document,
  Histogram,
  Calendar,
  Switch,
  List,
  Connection,
  Grid,
} from '@element-plus/icons-vue'
import { FIELD_TYPE_REGISTRY, type FieldTypeDescriptor } from './field-types'
import { generateColumnName } from './column-name'
import { nextDesignerItemId, type DesignerItem } from './types'

const props = withDefaults(
  defineProps<{
    /** 画布现有列名，用于克隆时生成唯一列名建议（前端 UX 提示，真校验在后端发布）。 */
    existingNames: string[]
    /** 已发布表单：禁止从控件库拖入新字段。 */
    disabled?: boolean
  }>(),
  { disabled: false },
)

/** 图标白名单（本地解析，注册表只存字符串键，不直引图标组件）。 */
const ICON_MAP: Record<string, Component> = {
  EditPen,
  Document,
  Histogram,
  Calendar,
  Switch,
  List,
  Connection,
  Grid,
}

/**
 * 克隆钩子：描述符 → 画布项。
 * SortableJS 在 pull:'clone' 时调用，返回值即插入画布 v-model 的对象。
 */
function cloneToItem(descriptor: FieldTypeDescriptor): DesignerItem {
  const name = generateColumnName(
    descriptor.label,
    props.existingNames,
    props.existingNames.length + 1,
  )
  return { id: nextDesignerItemId(), field: descriptor.createDefault(name) }
}
</script>

<template>
  <aside class="palette" :class="{ 'palette--disabled': disabled }">
    <h2 class="palette__title">控件库</h2>
    <VueDraggable
      :model-value="[...FIELD_TYPE_REGISTRY]"
      :group="{ name: 'designer-fields', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneToItem"
      :animation="150"
      item-key="type"
      class="palette__list"
      :disabled="disabled"
    >
      <div v-for="d in FIELD_TYPE_REGISTRY" :key="d.type" class="palette__item">
        <el-icon v-if="ICON_MAP[d.icon]" class="palette__icon">
          <component :is="ICON_MAP[d.icon]" />
        </el-icon>
        <span class="palette__label">{{ d.label }}</span>
      </div>
    </VueDraggable>
  </aside>
</template>

<style scoped>
.palette {
  width: 200px;
  flex: 0 0 200px;
  border-right: 1px solid var(--sw-border-light);
  padding: var(--sw-space-16);
  overflow-y: auto;
}

.palette__title {
  margin: 0 0 var(--sw-space-12);
  font-size: var(--sw-font-h2);
  font-weight: var(--sw-font-weight-h2);
  color: var(--sw-text-primary);
}

.palette__list {
  display: flex;
  flex-direction: column;
  gap: var(--sw-space-8);
}

.palette__item {
  display: flex;
  align-items: center;
  gap: var(--sw-space-8);
  height: var(--sw-control-height);
  padding: 0 var(--sw-space-12);
  border: 1px solid var(--sw-border-base);
  border-radius: var(--sw-radius-base);
  background: #fff;
  color: var(--sw-text-regular);
  font-size: var(--sw-font-body);
  cursor: grab;
  user-select: none;
}

.palette__item:hover {
  border-color: var(--sw-color-primary);
  color: var(--sw-color-primary);
}

.palette__icon {
  color: var(--sw-text-secondary);
}

.palette__item:hover .palette__icon {
  color: var(--sw-color-primary);
}

.palette--disabled .palette__item {
  cursor: not-allowed;
  opacity: 0.5;
}

.palette--disabled .palette__item:hover {
  border-color: var(--sw-border-base);
  color: var(--sw-text-regular);
}

.palette--disabled .palette__item:hover .palette__icon {
  color: var(--sw-text-secondary);
}
</style>
