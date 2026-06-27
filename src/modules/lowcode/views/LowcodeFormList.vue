<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listSubmissions } from '@/modules/lowcode/api/form'
import type { PageResult } from '@/contracts/common'

const route = useRoute()
const formKey = String(route.params.formKey)

const loading = ref(false)
const errorMsg = ref('')
const result = ref<PageResult<Record<string, unknown>> | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)

const columns = computed(() => {
  const rows = result.value?.list
  if (!rows?.length) return []
  return Object.keys(rows[0])
})

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    result.value = await listSubmissions(formKey, {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
  } catch {
    errorMsg.value = '提交记录加载失败：后端查询端点待上线'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pageNum.value = page
  void loadList()
}

onMounted(loadList)
</script>

<template>
  <div style="padding: 32px">
    <h2>表单提交记录 — {{ formKey }}</h2>
    <el-skeleton v-if="loading" :rows="5" animated />
    <el-alert
      v-else-if="errorMsg"
      type="warning"
      :title="errorMsg"
      :closable="false"
      style="margin: 16px 0"
    />
    <template v-else-if="result">
      <el-table :data="result.list" style="width: 100%; margin-bottom: 16px">
        <el-table-column v-for="col in columns" :key="col" :prop="col" :label="col" />
      </el-table>
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :total="result.total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </template>
    <el-empty v-else description="暂无提交记录" />
  </div>
</template>
