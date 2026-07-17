<script setup lang="ts">
/**
 * DeptList — 部门管理列表页（树形表格）。
 *
 * 部门列表使用 el-table 树形表格（row-key + tree-props），不分页。
 * 不使用 StandardListTemplate（因无分页、无筛选区，与模板差异大）。
 * 数据加载：listDeptTree() 返回 flat 数组 → 前端 buildTree() 转为嵌套结构。
 * 操作：新建 / 编辑 / 删除 + 上级部门选择（tree-select）。
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import {
  listDeptTree,
  getDept,
  createDept,
  updateDept,
  deleteDept,
} from '@/modules/system/api/dept'
import type { SysDept } from '@/modules/system/types/dept'
import { ListToolbar, StandardFormTemplate, FormSection, FormGrid } from '@/components/page-layout'

// ─── 列表状态 ───

const treeData = ref<SysDept[]>([])
const flatData = ref<SysDept[]>([])
const loading = ref(false)
const errorMsg = ref('')

/** flat 数组 → 嵌套树转换 */
function buildTree(list: SysDept[], parentId = '0'): SysDept[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.id!),
    }))
}

async function loadTree() {
  loading.value = true
  errorMsg.value = ''
  try {
    flatData.value = await listDeptTree()
    treeData.value = buildTree(flatData.value)
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载部门列表失败'
    }
  } finally {
    loading.value = false
  }
}

const isEmpty = computed(() => !loading.value && !errorMsg.value && treeData.value.length === 0)

// ─── 弹窗状态 ───

const dialogVisible = ref(false)
const dialogTitle = computed(() => (editingId.value ? '编辑部门' : '新建部门'))
const editingId = ref<string | null>(null)
const submitting = ref(false)
const formError = ref('')

const form = reactive<SysDept>({
  name: '',
  code: '',
  parentId: '0',
  sort: 0,
  status: 1,
})

function resetForm() {
  form.name = ''
  form.code = ''
  form.parentId = '0'
  form.sort = 0
  form.status = 1
  editingId.value = null
  formError.value = ''
}

function openCreate(parentId?: string) {
  resetForm()
  form.parentId = parentId ?? '0'
  dialogVisible.value = true
}

async function openEdit(row: SysDept) {
  resetForm()
  editingId.value = row.id ?? null
  try {
    const detail = await getDept(row.id!)
    form.name = detail.name
    form.code = detail.code
    form.parentId = detail.parentId ?? '0'
    form.sort = detail.sort ?? 0
    form.status = detail.status
  } catch {
    formError.value = '加载部门详情失败'
    return
  }
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

/** 收集当前编辑节点及其所有子孙 ID（用于上级部门选择器中过滤自身） */
function collectDescendantIds(list: SysDept[]): string[] {
  const ids: string[] = []
  for (const item of list) {
    ids.push(item.id!)
    if (item.children) {
      ids.push(...collectDescendantIds(item.children))
    }
  }
  return ids
}

/** 可供选择的上级部门列表（排除当前编辑节点及其子孙） */
const parentDeptOptions = computed(() => {
  const excludeIds = new Set<string>()
  if (editingId.value) {
    excludeIds.add(editingId.value)
    collectDescendantIds(treeData.value).forEach((id) => excludeIds.add(id))
  }
  return flatData.value.filter((item) => !excludeIds.has(item.id!))
})

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = '部门名称不能为空'
    return
  }
  if (!form.code.trim()) {
    formError.value = '部门编码不能为空'
    return
  }

  submitting.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await updateDept({ ...form, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createDept({ ...form })
      ElMessage.success('创建成功')
    }
    closeDialog()
    void loadTree()
  } catch (err) {
    if (err instanceof ApiError) {
      formError.value = err.msg
    } else {
      formError.value = '保存失败'
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: SysDept) {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门"${row.name}"吗？如有子部门将不允许删除。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return // 用户取消
  }
  try {
    await deleteDept(row.id!)
    ElMessage.success('删除成功')
    void loadTree()
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('删除失败')
    }
  }
}

// el-table row slot 的 DefaultRow 类型不与 SysDept 兼容，通过包装函数桥接。
function editRow(r: unknown) {
  openEdit(r as SysDept)
}
function deleteRow(r: unknown) {
  handleDelete(r as SysDept)
}
function addChildRow(r: unknown) {
  openCreate((r as SysDept).id)
}

onMounted(loadTree)
</script>

<template>
  <div class="dept-list">
    <!-- 工具栏（复用 ListToolbar） -->
    <ListToolbar title="部门管理" :total="treeData.length">
      <template #actions>
        <el-button type="primary" @click="openCreate()">新建部门</el-button>
      </template>
    </ListToolbar>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <!-- 表格区 -->
    <div class="dept-list__table-card">
      <el-table
        v-loading="loading"
        :data="treeData"
        row-key="id"
        stripe
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编码" min-width="120" />
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="addChildRow(row)"
              >新建子部门</el-button
            >
            <el-button size="small" link type="primary" @click="editRow(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="deleteRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空态 -->
      <div v-if="isEmpty" class="dept-list__empty">
        <el-button type="primary" @click="openCreate()">新建部门</el-button>
      </div>
    </div>
  </div>

  <!-- 新建/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    destroy-on-close
    width="680px"
    @closed="resetForm"
  >
    <StandardFormTemplate embedded>
      <template v-if="formError" #alert>
        <el-alert :title="formError" type="error" :closable="false" show-icon />
      </template>

      <FormSection title="基本信息">
        <FormGrid :columns="2">
          <div class="form-field">
            <label class="form-field__label">上级部门</label>
            <el-tree-select
              v-model="form.parentId"
              :data="parentDeptOptions"
              node-key="id"
              :props="{ label: 'name', children: 'children' }"
              placeholder="选择上级部门"
              clearable
              style="width: 100%"
              check-strictly
            />
          </div>
          <div class="form-field form-field--required">
            <label class="form-field__label">部门名称</label>
            <el-input
              v-model="form.name"
              placeholder="请输入部门名称"
              maxlength="64"
              show-word-limit
            />
          </div>
          <div class="form-field form-field--required">
            <label class="form-field__label">部门编码</label>
            <el-input
              v-model="form.code"
              placeholder="请输入部门编码"
              maxlength="64"
              show-word-limit
            />
          </div>
          <div class="form-field">
            <label class="form-field__label">排序</label>
            <el-input-number v-model="form.sort" :min="0" :max="9999" style="width: 100%" />
          </div>
          <div class="form-field">
            <label class="form-field__label">状态</label>
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </div>
        </FormGrid>
      </FormSection>

      <template #actions>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </StandardFormTemplate>
  </el-dialog>
</template>

<style scoped>
.dept-list {
  padding: var(--sw-space-24);
}

.dept-list__table-card {
  background: var(--sw-bg-white, #fff);
  border-radius: var(--sw-radius-card);
  box-shadow: var(--sw-shadow-card);
  padding: var(--sw-space-16);
}

.dept-list__empty {
  text-align: center;
  padding: var(--sw-space-40) 0;
  color: var(--sw-text-tertiary);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--sw-space-8);
}

.form-field__label {
  font-size: var(--sw-font-body);
  font-weight: var(--sw-font-weight-emphasis);
  color: var(--sw-text-primary);
}

.form-field--required .form-field__label::before {
  content: '* ';
  color: var(--sw-danger);
}
</style>
