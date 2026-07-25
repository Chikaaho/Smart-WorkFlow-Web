<script setup lang="ts">
/* global Element, HTMLElement */
/**
 * ProcessDefList — 流程定义列表页（页型 B）。
 *
 * 只读分页列表，套 StandardListTemplate。
 * 不提供创建/编辑/删除/发布操作（非本功能范围）。
 */
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { StandardListTemplate } from '@/components/page-layout'
import { pageProcessDefs, getProcessDefGraph } from '@/modules/workflow/api'
import type { ProcessDef } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
import { ApiError } from '@/foundation/request'
import { mountBpmnViewer } from '@/adapters/bpmn'
import type { BpmnViewerInstance } from '@/adapters/bpmn'

// ─── 状态映射（与 FormDefStatus 完全对称） ───

const PROCESS_DEF_STATUS_MAP: Record<
  ProcessDef['status'],
  { label: string; type: 'success' | 'warning' | 'info' | 'danger' }
> = {
  DRAFT: { label: '草稿', type: 'info' },
  PUBLISHED: { label: '已发布', type: 'success' },
}

function getStatusLabel(status: ProcessDef['status']): string {
  return PROCESS_DEF_STATUS_MAP[status]?.label ?? status
}

function getStatusType(status: ProcessDef['status']): 'success' | 'warning' | 'info' | 'danger' {
  return PROCESS_DEF_STATUS_MAP[status]?.type ?? 'info'
}

// ─── 列表状态 ───

const list = ref<ProcessDef[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// ─── 查看流程图对话框 ───
const viewerVisible = ref(false)
const viewerLoading = ref(false)
const viewerError = ref('')
const currentDefName = ref('')
const bpmnContainerRef = ref<Element | null>(null)
let viewerInstance: BpmnViewerInstance | null = null

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const pageQuery: PageQuery = { pageNum: pageNum.value, pageSize: pageSize.value }
    const result = await pageProcessDefs(pageQuery)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载流程定义列表失败'
    }
  } finally {
    loading.value = false
  }
}

function handlePageNumChange(p: number) {
  pageNum.value = p
  void loadList()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  pageNum.value = 1
  void loadList()
}

// el-table row slot 的 DefaultRow 类型不兼容，桥接函数
function statusRow(r: unknown) {
  return r as ProcessDef
}

// ─── 查看流程图 ───

/** 打开查看流程图对话框 */
async function openViewer(row: ProcessDef) {
  currentDefName.value = row.name
  viewerVisible.value = true
  viewerLoading.value = true
  viewerError.value = ''

  // 等待 DOM 更新后容器元素就位
  await nextTick()

  try {
    const xml = await getProcessDefGraph(row.id)
    if (!bpmnContainerRef.value) {
      viewerError.value = '渲染容器未找到'
      return
    }
    viewerInstance = await mountBpmnViewer(bpmnContainerRef.value as HTMLElement, xml)
    // bpmn-js 渲染完成后自适应画布（try-fit：即使尺寸未就位也不影响外层错误态）
    await nextTick()
    try {
      viewerInstance.fitViewport()
    } catch {
      // 对话框动画可能尚未完成 → 由 @opened 事件重试
    }
  } catch (e: unknown) {
    viewerError.value =
      (e as Record<string, string>)?.msg || (e as Error)?.message || '流程图加载失败'
  } finally {
    viewerLoading.value = false
  }
}

/** 对话框打开动画完成后重试 fitViewport（容器在动画结束前可能尺寸为 0） */
function onDialogOpened() {
  if (viewerInstance) {
    try {
      viewerInstance.fitViewport()
    } catch {
      // 静默忽略：初始渲染位置已由 mountBpmnViewer 确定
    }
  }
}

/** 关闭对话框并清理 bpmn viewer 实例 */
function closeViewer() {
  if (viewerInstance) {
    viewerInstance.destroy()
    viewerInstance = null
  }
  viewerVisible.value = false
  viewerError.value = ''
  viewerLoading.value = false
}

// 组件卸载时防御性清理
onBeforeUnmount(() => {
  if (viewerInstance) {
    viewerInstance.destroy()
    viewerInstance = null
  }
})

onMounted(loadList)
</script>

<template>
  <StandardListTemplate
    title="流程定义"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 空态操作（无操作按钮） -->
    <template #empty-action>
      <span />
    </template>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="name" label="流程名称" min-width="160" />
      <el-table-column prop="processKey" label="流程标识" min-width="160" />
      <el-table-column prop="formKey" label="关联表单" min-width="140" />
      <el-table-column prop="defVersion" label="版本" width="80" align="center" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(statusRow(row).status)" size="small">
            {{ getStatusLabel(statusRow(row).status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="primary"
            :disabled="(row as ProcessDef).status === 'DRAFT'"
            @click="openViewer(row as ProcessDef)"
          >
            查看流程图
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 查看流程图对话框 -->
    <el-dialog
      v-model="viewerVisible"
      :title="`流程图 - ${currentDefName}`"
      :close-on-click-modal="false"
      destroy-on-close
      width="900px"
      @opened="onDialogOpened"
      @closed="closeViewer"
    >
      <div
        v-loading="viewerLoading"
        style="min-height: 400px; display: flex; align-items: center; justify-content: center"
      >
        <!-- 错误提示 -->
        <el-result
          v-if="viewerError"
          icon="error"
          :title="viewerError"
          :sub-title="'请确认流程定义已发布且 BPMN XML 有效'"
        />
        <!-- BPMN 渲染容器（始终渲染，v-loading 遮罩已遮盖加载态） -->
        <div ref="bpmnContainerRef" style="width: 100%; min-height: 500px" />
      </div>
    </el-dialog>
  </StandardListTemplate>
</template>
