<script setup lang="ts">
/**
 * 画布（设计器中栏）。
 *
 * 持有字段列表（DesignerItem[]，经 v-model 双向绑定），支持：
 *  - 从控件库拖入新字段（共享 group 'designer-fields'，put 接收克隆项）；
 *  - 画布内拖拽排序；
 *  - 点击选中（高亮 + 通知右栏配置面板）；
 *  - 删除。
 *
 * 字段卡片的类型徽标/图标一律读注册表派生（getFieldTypeDescriptor），**不写死 8 类**。
 * 本刀只做单列排序；双列/分组等高级排版是后面的刀。
 */
import { VueDraggable } from 'vue-draggable-plus'
import { Delete } from '@element-plus/icons-vue'
import { getFieldTypeDescriptor } from './field-types'
import type { DesignerItem } from './types'

const items = defineModel<DesignerItem[]>('items', { required: true })
const selectedId = defineModel<string | null>('selectedId', { required: true })

function typeLabel(item: DesignerItem): string {
  return getFieldTypeDescriptor(item.field.type)?.label ?? item.field.type
}

function select(id: string) {
  selectedId.value = id
}

function remove(id: string) {
  items.value = items.value.filter((it) => it.id !== id)
  if (selectedId.value === id) selectedId.value = null
}
</script>

<template>
  <section class="canvas">
    <VueDraggable
      v-model="items"
      :group="{ name: 'designer-fields', pull: true, put: true }"
      :animation="150"
      item-key="id"
      handle=".field-card"
      class="canvas__list"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="field-card"
        :class="{ 'field-card--active': item.id === selectedId }"
        @click="select(item.id)"
      >
        <div class="field-card__main">
          <span class="field-card__label">{{ item.field.label || '(未命名)' }}</span>
          <span class="field-card__name">{{ item.field.name }}</span>
        </div>
        <span class="field-card__type">{{ typeLabel(item) }}</span>
        <el-button
          class="field-card__del"
          link
          type="danger"
          :icon="Delete"
          @click.stop="remove(item.id)"
        />
      </div>
    </VueDraggable>

    <p v-if="items.length === 0" class="canvas__empty">从左侧控件库拖入字段开始设计</p>
  </section>
</template>

<style scoped>
.canvas {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--sw-space-20) var(--sw-space-24);
  background: var(--sw-fill-base);
  overflow-y: auto;
}

.canvas__list {
  display: flex;
  flex-direction: column;
  gap: var(--sw-space-12);
  min-height: 120px;
}

.field-card {
  display: flex;
  align-items: center;
  gap: var(--sw-space-12);
  padding: var(--sw-space-12) var(--sw-space-16);
  background: #fff;
  border: 1px solid var(--sw-border-base);
  border-radius: var(--sw-radius-card);
  box-shadow: var(--sw-shadow-card);
  cursor: pointer;
}

.field-card--active {
  border-color: var(--sw-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.field-card__main {
  display: flex;
  flex-direction: column;
  gap: var(--sw-space-4);
  flex: 1 1 auto;
  min-width: 0;
}

.field-card__label {
  font-size: var(--sw-font-emphasis);
  font-weight: var(--sw-font-weight-emphasis);
  color: var(--sw-text-primary);
}

.field-card__name {
  font-size: var(--sw-font-caption);
  color: var(--sw-text-secondary);
  font-family: var(--el-font-family-mono, monospace);
}

.field-card__type {
  flex: 0 0 auto;
  padding: 0 var(--sw-space-8);
  height: 22px;
  line-height: 22px;
  font-size: var(--sw-font-caption);
  color: var(--sw-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: var(--sw-radius-sm);
}

.canvas__empty {
  margin-top: var(--sw-space-32);
  text-align: center;
  color: var(--sw-text-placeholder);
  font-size: var(--sw-font-body);
}
</style>
