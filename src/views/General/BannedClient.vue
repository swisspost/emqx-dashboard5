<template>
  <div class="banned-clients app-wrapper">
    <div class="section-header">
      <div></div>
      <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
        {{ $t('Base.create') }}
      </el-button>
      <el-button
        type="danger"
        plain
        :icon="Remove"
        :disabled="!tableData.length"
        @click="clearAllConfirm"
        :loading="clearLoading"
      >
        {{ tl('clearAll') }}
      </el-button>
    </div>
    <el-table :data="tableData" v-loading="tbLoading" row-key="who">
      <el-table-column prop="who" :label="tl('who')" />
      <el-table-column prop="as" :label="tl('as')">
        <template #default="{ row }">
          {{ getLabelFromValue(row.as) }}
        </template>
      </el-table-column>
      <el-table-column prop="reason" min-width="120px" :label="tl('reason')" />
      <el-table-column prop="until" :formatter="formatterUntil" :label="tl('until')" />
      <el-table-column prop="oper" :label="$t('Base.operation')">
        <template #default="{ row }">
          <el-button plain size="small" @click="deleteConfirm(row)">
            {{ $t('Base.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="emq-table-footer">
      <common-pagination @loadPage="listBlackList" v-model:metaData="pageMeta"></common-pagination>
    </div>
  </div>
  <BannedDialog v-model="dialogVisible" @submitted="refreshListData" />
</template>

<script setup lang="ts">
import { deleteBannedClient, loadBannedClient, clearAllBannedClients } from '@/api/function'
import { dateFormat } from '@/common/tools'
import useBannedType from '@/hooks/Auth/useBannedType'
import useI18nTl from '@/hooks/useI18nTl'
import usePaginationWithHasNext from '@/hooks/usePaginationWithHasNext'
import { Plus, Remove } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Banned } from 'src/types/auth'
import { ref } from 'vue'
import CommonPagination from '../../components/commonPagination.vue'
import BannedDialog from './components/BannedDialog.vue'
import { BannedItem } from '@/types/systemModule'

const { t, tl } = useI18nTl('General')

const dialogVisible = ref(false)
const clearLoading = ref(false)
const tableData = ref<BannedItem[]>([])
const tbLoading = ref(false)
const { pageMeta, pageParams, initPageMeta, setPageMeta } = usePaginationWithHasNext()

const listBlackList = async (params = {}) => {
  tbLoading.value = true
  const sendParams = { ...pageParams.value, ...params }
  Reflect.deleteProperty(sendParams, 'count')
  try {
    const { data = [], meta = { limit: 20, page: 1 } } = await loadBannedClient(sendParams)
    tableData.value = data
    setPageMeta(meta)
  } catch (error) {
    tableData.value = []
    initPageMeta()
  } finally {
    tbLoading.value = false
  }
}

const refreshListData = () => {
  initPageMeta()
  listBlackList()
}

const { getLabelFromValue } = useBannedType()

const deleteConfirm = async (item: Banned) => {
  try {
    await ElMessageBox.confirm(tl('determineToDeleteTheBannedClient'), {
      confirmButtonText: t('Base.confirm'),
      cancelButtonText: t('Base.cancel'),
      confirmButtonClass: 'confirm-danger',
      type: 'warning',
    })
    const { who, as } = item
    await deleteBannedClient({ who, as })
    ElMessage.success(t('Base.deleteSuccess'))
    refreshListData()
  } catch (error) {
    //
  }
}

const clearAllConfirm = async () => {
  try {
    await ElMessageBox.confirm(tl('clearAllConfirm'), {
      confirmButtonText: t('Base.confirm'),
      cancelButtonText: t('Base.cancel'),
      type: 'warning',
    })
    clearLoading.value = true
    await clearAllBannedClients()
    ElMessage.success(t('Base.deleteSuccess'))
    refreshListData()
  } catch (error) {
    // ignore error
  } finally {
    clearLoading.value = false
  }
}

const formatterUntil = ({ until }: Banned) => {
  if (!until) {
    return tl('General.neverExpire')
  }
  return dateFormat(until)
}

listBlackList()
</script>
