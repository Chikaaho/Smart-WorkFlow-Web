<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formKey = ref('')

function goRender() {
  const key = formKey.value.trim()
  if (key) void router.push(`/lowcode/form-render/${key}`)
}

function goList() {
  const key = formKey.value.trim()
  if (key) void router.push(`/lowcode/form-list/${key}`)
}
</script>

<template>
  <div style="padding: 32px">
    <h2>低代码表单</h2>
    <p style="color: #666; margin-bottom: 20px">输入表单 Key，进入渲染页或查看提交记录。</p>
    <div style="display: flex; gap: 12px; align-items: center">
      <el-input v-model="formKey" placeholder="请输入 formKey" style="width: 280px" />
      <el-button type="primary" :disabled="!formKey.trim()" @click="goRender">渲染表单</el-button>
      <el-button :disabled="!formKey.trim()" @click="goList">提交记录</el-button>
    </div>
  </div>
</template>
