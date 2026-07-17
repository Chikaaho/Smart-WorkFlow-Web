<script setup lang="ts">
/**
 * RoleList — 角色管理列表页（页型B）。
 *
 * 使用 StandardListTemplate 槽位模板，数据外部进。
 * 筛选：name / code / status；操作：新建 / 编辑 / 删除。
 * 新建/编辑走 el-dialog 内嵌 StandardFormTemplate + 手写控件（高代码轨）。
 * 角色编码编辑时 disabled（不允许修改编码）。
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiError } from '@/foundation/request'
import { pageRoles, getRole, createRole, updateRole, deleteRole } from '@/modules/system/api/role'
import type { SysRole, RoleFilter } from '@/modules/system/types/role'
import type { PageQuery } from '@/contracts/common'
import {
  StandardListTemplate,
  StandardFormTemplate,
  FormSection,
  FormGrid,
} from '@/components/page-layout'

// ─── 列表状态 ───

const list = ref<SysRole[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMsg = ref('')

const filter = reactive<RoleFilter>({
  name: '',
  code: '',
  status: undefined,
})

const currentFilter = reactive<RoleFilter>({ ...filter })

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const pageQuery: PageQuery = { pageNum: pageNum.value, pageSize: pageSize.value }
    const result = await pageRoles(pageQuery, currentFilter)
    list.value = result.list
    total.value = result.total
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.msg
    } else {
      errorMsg.value = '加载角色列表失败'
    }
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  Object.assign(currentFilter, {
    name: filter.name || undefined,
    code: filter.code || undefined,
    status: filter.status,
  })
  pageNum.value = 1
  void loadList()
}

function handleReset() {
  filter.name = ''
  filter.code = ''
  filter.status = undefined
  currentFilter.name = undefined
  currentFilter.code = undefined
  currentFilter.status = undefined
  pageNum.value = 1
  void loadList()
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

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// ─── 弹窗状态 ───

const dialogVisible = ref(false)
const dialogTitle = computed(() => (editingId.value ? '编辑角色' : '新建角色'))
const editingId = ref<string | null>(null)
const submitting = ref(false)
const formError = ref('')

const form = reactive<SysRole>({
  name: '',
  code: '',
  sort: 0,
  status: 1,
  description: '',
})

function resetForm() {
  form.name = ''
  form.code = ''
  form.sort = 0
  form.status = 1
  form.description = ''
  editingId.value = null
  formError.value = ''
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

async function openEdit(row: SysRole) {
  resetForm()
  editingId.value = row.id ?? null
  try {
    const detail = await getRole(row.id!)
    form.name = detail.name
    form.code = detail.code
    form.sort = detail.sort ?? 0
    form.status = detail.status
    form.description = detail.description ?? ''
  } catch {
    formError.value = '加载角色详情失败'
    return
  }
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = '角色名称不能为空'
    return
  }
  if (!form.code.trim()) {
    formError.value = '角色编码不能为空'
    return
  }

  submitting.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await updateRole({ ...form, id: editingId.value })
      ElMessage.success('更新成功')
    } else {
      await createRole({ ...form })
      ElMessage.success('创建成功')
    }
    closeDialog()
    void loadList()
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

async function handleDelete(row: SysRole) {
  try {
    await ElMessageBox.confirm(`确定要删除角色"${row.name}"吗？删除后不可恢复。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 用户取消
  }
  try {
    await deleteRole(row.id!)
    ElMessage.success('删除成功')
    void loadList()
  } catch (err) {
    if (err instanceof ApiError) {
      ElMessage.error(err.msg)
    } else {
      ElMessage.error('删除失败')
    }
  }
}

// el-table row slot 的 DefaultRow 类型不与 SysRole 兼容，通过包装函数桥接。
function editRow(r: unknown) {
  openEdit(r as SysRole)
}
function deleteRow(r: unknown) {
  handleDelete(r as SysRole)
}

onMounted(loadList)
</script>

<template>
  <StandardListTemplate
    title="角色管理"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    :empty="isEmpty"
    @update:page-num="handlePageNumChange"
    @update:page-size="handlePageSizeChange"
  >
    <!-- 工具栏：新建按钮 -->
    <template #toolbar-actions>
      <el-button type="primary" @click="openCreate">新建角色</el-button>
    </template>

    <!-- 筛选区 -->
    <template #filter>
      <el-input
        v-model="filter.name"
        placeholder="角色名称"
        clearable
        style="width: 180px"
        @keyup.enter="handleQuery"
      />
      <el-input
        v-model="filter.code"
        placeholder="角色编码"
        clearable
        style="width: 180px"
        @keyup.enter="handleQuery"
      />
      <el-select v-model="filter.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="正常" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
    </template>
    <template #filter-actions>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </template>

    <!-- 表格区 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="name" label="角色名称" min-width="140" />
      <el-table-column prop="code" label="角色编码" min-width="120" />
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="builtIn" label="内置" width="70">
        <template #default="{ row }">
          <el-tag :type="row.builtIn ? 'danger' : 'info'" size="small">
            {{ row.builtIn ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="editRow(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空态操作 -->
    <template #empty-action>
      <el-button type="primary" @click="openCreate">新建角色</el-button>
    </template>
  </StandardListTemplate>

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
          <div class="form-field form-field--required">
            <label class="form-field__label">角色名称</label>
            <el-input
              v-model="form.name"
              placeholder="请输入角色名称"
              maxlength="64"
              show-word-limit
            />
          </div>
          <div class="form-field form-field--required">
            <label class="form-field__label">角色编码</label>
            <el-input
              v-model="form.code"
              placeholder="请输入角色编码"
              :disabled="!!editingId"
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
        <FormGrid :columns="1" style="margin-top: 0">
          <div class="form-field">
            <label class="form-field__label">备注</label>
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
              maxlength="256"
              show-word-limit
            />
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
