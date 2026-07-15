<script setup lang="ts">
/**
 * NotifyHome — 通知消息列表页（页型 B）。
 *
 * 展示当前用户的通知消息，支持标记已读操作。
 * 后端返回平铺数组（不分页），前端直接渲染。
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { StandardListTemplate } from '@/components/page-layout'
import { queryNotifyMessages, markAsRead } from '@/modules/notify/api'
import { ApiError } from '@/foundation/request'
import type { NotifyMessage } from '@/contracts/notify'

// ─── 列表状态 ───

const list = ref<NotifyMessage[]>([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const readingId = ref<number | null>(null) // 当前正在标记已读的 ID（loading 态）

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// 后端返回平铺数组（不分页），传 pageSize=9999 使分页组件只显示「共 N 条」
const pageNum = ref(1)
const pageSize = ref(9999)

/** bizType → { label, type } 映射 */
const BIZ_TYPE_MAP: Record<
  string,
  { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }
> = {
  WF_TODO: { label: '流程待办', type: 'warning' },
  WF_APPROVED: { label: '审批结果', type: 'success' },
}

function getBizTypeTag(bizType: string): {
  label: string
  type: 'primary' | 'success' | 'warning' | 'info' | 'danger'
} {
  return BIZ_TYPE_MAP[bizType] ?? { label: bizType, type: 'info' }
}

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const messages = await queryNotifyMessages()
    list.value = messages
    total.value = messages.length
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
      ElMessage.error(err.msg)
    } else {
      errorMsg.value = '加载通知列表失败'
      ElMessage.error('加载通知列表失败')
    }
  } finally {
    loading.value = false
  }
}

function markRow(r: unknown) {
  void handleMarkRead(r as NotifyMessage)
}

async function handleMarkRead(row: NotifyMessage) {
  if (readingId.value !== null) return // 防重复点击
  readingId.value = row.id

  try {
    await markAsRead(row.id)
    // 替换数组项以触发响应式更新（el-table slot scope 中的 row 可能不是响应式代理）
    list.value = list.value.map((item) => (item.id === row.id ? { ...item, read: true } : item))
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('操作失败')
    }
  } finally {
    readingId.value = null
  }
}

onMounted(loadList)
</script>

<template>
  <StandardListTemplate
    title="通知消息"
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
      <el-table-column label="" width="40">
        <template #default="{ row }">
          <span v-if="!row.read" class="unread-dot" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column label="内容预览" min-width="300">
        <template #default="{ row }">
          <span class="content-preview">{{ row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getBizTypeTag(row.bizType).type" size="small" disable-transitions>
            {{ getBizTypeTag(row.bizType).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="!row.read"
            size="small"
            text
            type="primary"
            :loading="readingId === row.id"
            :disabled="readingId !== null"
            @click="markRow(row)"
          >
            标记已读
          </el-button>
          <span v-else class="read-label">已读</span>
        </template>
      </el-table-column>
    </el-table>
  </StandardListTemplate>
</template>

<style scoped>
.unread-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--el-color-primary, #7e306b);
}
.content-preview {
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 100%;
}
.read-label {
  color: #c0c4cc;
  font-size: 14px;
}
:deep(.list-pagination) {
  display: none;
}
</style>
