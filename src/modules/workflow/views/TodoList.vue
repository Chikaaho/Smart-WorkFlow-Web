<script setup lang="ts">
/**
 * TodoList — 我的待办列表页（页型 B）。
 *
 * 展示当前用户待审批任务，提供「审批通过」按钮。
 * 后端返回平铺数组（不分页），前端直接渲染。
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StandardListTemplate } from '@/components/page-layout'
import { queryTodoTasks, completeTask } from '@/modules/workflow/api'
import { ApiError } from '@/foundation/request'
import type { TodoTask } from '@/contracts/bpm'

// ─── 列表状态 ───

const list = ref<TodoTask[]>([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const approvingId = ref<string | null>(null) // 当前正在审批的任务 ID（loading 态）

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// 后端返回平铺数组（不分页），传 pageSize=9999 使分页组件只显示「共 N 条」
const pageNum = ref(1)
const pageSize = ref(9999)

function formatTaskId(taskId: string): string {
  // 短显示：取后 8 字符
  return taskId.length > 8 ? `...${taskId.slice(-8)}` : taskId
}

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const tasks = await queryTodoTasks()
    list.value = tasks
    total.value = tasks.length
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载待办任务失败'
    }
  } finally {
    loading.value = false
  }
}

// el-table row slot 的 DefaultRow 类型不兼容，桥接函数
function approveRow(r: unknown) {
  void handleApprove(r as TodoTask)
}

async function handleApprove(row: TodoTask) {
  // 防重复点击：在显示确认框前锁定，阻止快速点击创建多个对话框
  if (approvingId.value) return
  approvingId.value = row.taskId

  let confirmed = false
  try {
    await ElMessageBox.confirm('确认审批通过此任务？', '审批确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })
    confirmed = true
  } catch {
    return // 用户取消
  } finally {
    if (!confirmed) approvingId.value = null
  }
  try {
    await completeTask(row.taskId)
    ElMessage.success('审批通过')
    // 从列表中移除已审批的任务
    list.value = list.value.filter((t) => t.taskId !== row.taskId)
    total.value = list.value.length
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('审批操作失败')
    }
  } finally {
    approvingId.value = null
  }
}

onMounted(loadList)
</script>

<template>
  <StandardListTemplate
    title="我的待办"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
  >
    <!-- 空态（无需操作按钮） -->
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
    <el-table v-loading="loading" :data="list" stripe style="width: 100%">
      <el-table-column label="任务编号" min-width="140">
        <template #default="{ row }">
          <span :title="row.taskId">{{ formatTaskId(row.taskId) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="formKey" label="表单标识" min-width="140" />
      <el-table-column prop="businessKey" label="业务单号" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="170" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            :loading="approvingId === row.taskId"
            :disabled="approvingId !== null"
            @click="approveRow(row)"
          >
            审批通过
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>
</template>

<style scoped>
:deep(.list-pagination) {
  display: none;
}
</style>
