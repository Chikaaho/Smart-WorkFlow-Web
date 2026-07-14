<script setup lang="ts">
/**
 * ProcessDefList — 流程定义列表页（页型 B）。
 *
 * 只读分页列表，套 StandardListTemplate。
 * 不提供创建/编辑/删除/发布操作（非本功能范围）。
 */
import { ref, computed, onMounted } from 'vue'
import { StandardListTemplate } from '@/components/page-layout'
import { pageProcessDefs } from '@/modules/workflow/api'
import type { ProcessDef } from '@/contracts/bpm'
import type { PageQuery } from '@/contracts/common'
import { ApiError } from '@/foundation/request'

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
    </el-table>
  </StandardListTemplate>
</template>
