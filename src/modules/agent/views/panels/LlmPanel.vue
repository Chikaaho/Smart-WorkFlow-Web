<script setup lang="ts">
/**
 * LLM 节点属性面板：模型配置下拉 + 输入/输出变量名。
 * 写回统一 emit 上行：updateNodeData（模型配置）/ varNameChange（变量名，留空删键语义
 * 在 GraphDesigner.handleVarNameChange）。
 */
import {
  DEFAULT_VARIABLE_NAME,
  NODE_CONFIG_KEY_INPUT_VAR,
  NODE_CONFIG_KEY_MODEL_ID,
  NODE_CONFIG_KEY_OUTPUT_VAR,
} from '@/modules/agent/utils/graphAdapter'
import type { NodePanelProps } from './node-panel-registry'

defineProps<NodePanelProps>()

defineEmits<{
  updateNodeData: [key: string, value: unknown]
  varNameChange: [key: string, value: unknown]
}>()
</script>

<template>
  <div class="field-row">
    <div class="field-label">模型配置</div>
    <el-select
      :model-value="(node.data?.[NODE_CONFIG_KEY_MODEL_ID] as number | undefined) ?? null"
      placeholder="选择模型配置"
      style="width: 100%"
      @change="(v) => $emit('updateNodeData', NODE_CONFIG_KEY_MODEL_ID, v)"
    >
      <el-option
        v-for="m in modelOptions"
        :key="m.id"
        :label="`${m.name}（${m.modelName}）`"
        :value="m.id"
      />
    </el-select>
  </div>
  <div class="field-row">
    <div class="field-label">输入变量名</div>
    <el-input
      :model-value="(node.data?.[NODE_CONFIG_KEY_INPUT_VAR] as string | undefined) ?? ''"
      :placeholder="`留空 = 默认变量 ${DEFAULT_VARIABLE_NAME}`"
      @change="(v) => $emit('varNameChange', NODE_CONFIG_KEY_INPUT_VAR, v)"
    />
  </div>
  <div class="field-row">
    <div class="field-label">输出变量名</div>
    <el-input
      :model-value="(node.data?.[NODE_CONFIG_KEY_OUTPUT_VAR] as string | undefined) ?? ''"
      :placeholder="`留空 = 默认变量 ${DEFAULT_VARIABLE_NAME}`"
      @change="(v) => $emit('varNameChange', NODE_CONFIG_KEY_OUTPUT_VAR, v)"
    />
  </div>
</template>

<style scoped>
.field-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.field-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
