<template>
  <div class="authn-manager">
    <div class="section-header">
      <div class="searchbar">
        <el-space wrap :size="20">
          <el-input
            v-model="searchVal.user_id"
            clearable
            :placeholder="getFiledLabel(field)"
            @keyup.enter="resetPageAndLoadData"
            @clear="resetPageAndLoadData"
          />
          <el-select
            v-model="searchVal.is_superuser"
            clearable
            :placeholder="$t('Auth.isSuperuser')"
            @clear="resetIsSuperuser(), resetPageAndLoadData()"
          >
            <el-option :value="true" :label="$t('Base.yes')" />
            <el-option :value="false" :label="$t('Base.no')" />
          </el-select>
          <el-tooltip :content="$t('Base.search')" placement="top">
            <el-button type="primary" plain :icon="Search" @click="resetPageAndLoadData">
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('Base.refresh')" placement="top">
            <el-button class="icon-button" type="primary" :icon="Refresh" @click="loadData">
            </el-button>
          </el-tooltip>
        </el-space>
      </div>
      <div class="add-funcs-container">
        <template v-if="mechanism === 'password_based'">
          <el-tooltip :content="$t('Base.downloadTemplate')" placement="top">
            <el-button class="icon-button" :icon="Document" @click="downloadTemplate"> </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('Base.import')" placement="top">
            <el-upload
              ref="upload"
              class="file-upload"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleUsersFileChange"
            >
              <el-button class="icon-button" type="primary" plain :icon="Upload"> </el-button>
            </el-upload>
          </el-tooltip>
        </template>
        <el-tooltip :content="$t('Base.add')" placement="top">
          <el-button class="icon-button" type="primary" :icon="Plus" @click="addCommand">
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-table :data="tableData" v-loading.lock="lockTable">
      <el-table-column prop="user_id" :label="getFiledLabel(field)">
        <template #default="{ row }">
          {{ replaceSpaceForHTML(row.user_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="is_superuser" :label="$t('Auth.isSuperuser')">
        <template #default="{ row }">
          {{ row.is_superuser ? $t('Base.yes') : $t('Base.no') }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('Base.operation')">
        <template #default="{ row }">
          <el-button @click="handleEdit(row)" size="small">
            {{ $t('Base.edit') }}
          </el-button>
          <el-button plain @click="handleDelete(row)" size="small">
            {{ $t('Base.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="emq-table-footer">
      <common-pagination v-model:metaData="pageMeta" @loadPage="loadData" />
    </div>

    <el-dialog
      :title="isEdit ? $t('Base.edit') : $t('Base.add')"
      width="480px"
      v-model="dialogVisible"
      destroy-on-close
    >
      <el-form
        ref="recordForm"
        :model="record"
        :rules="getRules()"
        label-position="top"
        require-asterisk-position="right"
      >
        <el-form-item prop="user_id" :label="getFiledLabel(field)">
          <el-input v-model="record.user_id" :disabled="isEdit" />
        </el-form-item>
        <el-form-item prop="password" :label="$t('General.password')">
          <el-input
            v-model="record.password"
            type="password"
            show-password
            autocomplete="one-time-code"
          />
        </el-form-item>
        <el-form-item>
          <div class="border-checkbox">
            <el-checkbox v-model="record.is_superuser" :label="$t('Auth.isSuperuser')" />
            <p class="checkbox-note">
              {{ $t('Auth.isSuperuserDesc') }}
            </p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-align-footer">
          <el-button @click="dialogVisible = false">
            {{ $t('Base.cancel') }}
          </el-button>

          <el-button type="primary" :loading="saveLoading" @click="save">
            {{ isEdit ? $t('Base.update') : $t('Base.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {
  createAuthnUsers,
  deleteAuthnUser,
  loadAuthnUsers,
  updateAuthnUser,
  uploadUsers,
} from '@/api/auth'
import {
  addGatewayUserManagement,
  deleteGatewayUser,
  getGatewayUserManagement,
  updateGatewayUser,
} from '@/api/gateway'
import { replaceSpaceForHTML } from '@/common/tools'
import { downloadByURL } from '@/common/tools'
import commonPagination from '@/components/commonPagination.vue'
import usePaginationWithHasNext from '@/hooks/usePaginationWithHasNext'
import { DataManagerItem } from '@/types/auth'
import { Document, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue'
import { ElMessage as M, ElMessageBox as MB } from 'element-plus'
import { computed, defineProps, onMounted, PropType, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const createRawUserForm = () => ({
  user_id: '',
  password: '',
  is_superuser: false,
})

const prop = defineProps({
  field: {
    type: String as PropType<'username' | 'clientid'>,
    required: true,
    default: 'username',
  },
  gateway: {
    type: String,
    required: false,
    default: '',
  },
})

const { t } = useI18n()
let record = ref<DataManagerItem>(createRawUserForm())
const tableData = ref([])
const lockTable = ref(false)
const dialogVisible = ref(false)
const route = useRoute()
const recordForm = ref()
const isEdit = ref(false)
const saveLoading = ref(false)
const searchVal = reactive({
  user_id: '',
  is_superuser: null,
})
const { pageMeta, pageParams, initPageMeta, setPageMeta } = usePaginationWithHasNext()

const id = computed(function (): string {
  return route.params.id as string
})

const reg = /^(?<mechanism>.+):.+$/
const mechanism = computed(() => {
  const matchRes = id.value?.match(reg)
  return matchRes ? matchRes.groups?.mechanism : ''
})

const loadData = async () => {
  const { user_id, is_superuser } = searchVal
  const sendParams = {
    ...pageParams.value,
    like_user_id: searchVal.user_id === '' ? null : user_id,
    is_superuser: is_superuser,
  }

  lockTable.value = true
  let res
  try {
    if (prop.gateway) {
      res = await getGatewayUserManagement(prop.gateway, sendParams)
    } else {
      res = await loadAuthnUsers(id.value, sendParams)
    }
    if (res) {
      tableData.value = res.data
      setPageMeta(res?.meta)
    }
  } catch (error) {
    tableData.value = []
    initPageMeta()
  }

  lockTable.value = false
}

onMounted(loadData)

const getRules = function () {
  let message = t('Auth.pleaseEnterUsername')
  if (prop.field === 'clientid') {
    message = t('Auth.pleaseEnterClientID')
  }
  const rules = {
    user_id: [{ required: true, message, trigger: 'blur' }],
    password: [{ required: true, message: t('General.pleaseEnterPassword') }],
  }
  if (isEdit.value) {
    Reflect.deleteProperty(rules, 'user_id')
  }
  return rules
}

const addCommand = () => {
  isEdit.value = false
  record.value = createRawUserForm()
  dialogVisible.value = true
}

const handleEdit = (row: DataManagerItem) => {
  dialogVisible.value = true
  isEdit.value = true
  record.value = {
    user_id: row.user_id,
    is_superuser: row.is_superuser,
    password: '',
  }
}

const handleDelete = (row: DataManagerItem) => {
  MB.confirm(t('Base.confirmDelete'), {
    confirmButtonText: t('Base.confirm'),
    cancelButtonText: t('Base.cancel'),
    confirmButtonClass: 'confirm-danger',
    type: 'warning',
  })
    .then(async () => {
      if (prop.gateway) {
        await deleteGatewayUser(prop.gateway, row.user_id)
      } else {
        await deleteAuthnUser(id.value, row.user_id)
      }
      resetPageAndLoadData()
    })
    .catch(() => {
      // cancel
    })
}

const save = async () => {
  let validation = await recordForm.value.validate()
  if (!validation) {
    return
  }
  saveLoading.value = true
  if (isEdit.value) {
    handleUpdate()
  } else {
    handleAdd()
  }
}

const handleAdd = async function () {
  let res
  try {
    if (prop.gateway) {
      res = await addGatewayUserManagement(prop.gateway, record.value)
    } else {
      res = await createAuthnUsers(id.value, record.value)
    }
    if (res) {
      dialogVisible.value = false
      M.success(t('Base.createSuccess'))
      record.value = {
        user_id: '',
        password: '',
        is_superuser: false,
      }
    }
    loadData()
  } catch (error) {
    //
  } finally {
    saveLoading.value = false
  }
}

const handleUpdate = async function () {
  const { password, is_superuser, user_id } = record.value
  const data = {
    password: password,
    is_superuser: is_superuser,
  }
  let res
  if (prop.gateway) {
    res = await updateGatewayUser(prop.gateway, user_id, data)
  } else {
    res = await updateAuthnUser(id.value, user_id, data)
  }
  if (res) {
    dialogVisible.value = false
    saveLoading.value = false
    M.success(t('Base.updateSuccess'))
    loadData()
  }
}

const downloadTemplate = async () => {
  downloadByURL('static/templates/user-import-template.csv')
}

const handleUsersFileChange = async (file: { raw: File; name: string }) => {
  try {
    await uploadUsers(id.value, file)
    M.success(t('Base.importSuc'))
    loadData()
  } catch (error) {
    // error
  }
  return Promise.reject()
}

const getFiledLabel = (field: 'clientid' | 'username') => {
  const fieldMap = {
    clientid: t('Base.clientid'),
    username: t('Base.username'),
  }
  return fieldMap[field]
}

const resetPageAndLoadData = () => {
  pageMeta.value.page = 1
  loadData()
}

const resetIsSuperuser = () => {
  searchVal.is_superuser = null
}
</script>

<style lang="scss" scoped>
.authn-manager {
  .searchbar {
    height: 36px;
    .el-input {
      width: 260px;
    }
  }
  .border-checkbox {
    margin-top: 16px;
  }

  .add-funcs-container {
    > .el-button,
    > .file-upload {
      margin-left: 16px;
    }
  }

  .file-upload {
    display: inline-block;
    vertical-align: top;
  }
}
</style>
