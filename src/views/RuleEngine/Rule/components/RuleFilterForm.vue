<template>
  <el-form
    label-position="left"
    label-width="0px"
    class="rule-filter-form"
    @keyup.enter="searchRule"
  >
    <el-row :gutter="20" class="" :class="{ 'multiple-rows': showMoreQuery }">
      <el-col v-bind="colProps">
        <el-form-item>
          <el-input
            type="text"
            v-model="filterParams.like_id"
            placeholder="ID"
            clearable
            @clear="searchRule"
          />
        </el-form-item>
      </el-col>
      <el-col v-bind="colProps">
        <el-form-item>
          <el-input
            type="text"
            v-model="filterParams[keyForSearchTopic]"
            :placeholder="$t('Base.topic')"
            clearable
            @clear="searchRule"
          >
            <template #prepend>
              <el-select class="select-topic-type" v-model="keyForSearchTopic">
                <el-option
                  v-for="{ label, value } in KEYS_FOR_SEARCH_TOPIC"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </el-col>
      <el-col v-bind="colProps">
        <el-form-item>
          <el-select
            class="select-status"
            v-model="filterParams.enable"
            clearable
            @clear="searchRule"
            :placeholder="$t('Base.isEnabled')"
          >
            <el-option :label="$t('Base.enabled')" :value="true" />
            <el-option :label="$t('Base.disabled')" :value="false" />
          </el-select>
        </el-form-item>
      </el-col>
      <template v-if="showMoreQuery">
        <el-col v-bind="colProps">
          <el-form-item>
            <el-input
              type="text"
              v-model="filterParams.like_description"
              clearable
              @clear="searchRule"
              :placeholder="tl('note')"
            />
          </el-form-item>
        </el-col>
        <el-col :ms="12" :md="12" :lg="18" />
      </template>
      <el-col v-bind="colProps" class="col-oper">
        <el-button plain type="primary" :icon="Search" @click="searchRule">
          {{ $t('Base.search') }}
        </el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">
          {{ $t('Base.reset') }}
        </el-button>
        <el-tooltip
          :content="!showMoreQuery ? $t('Base.showMore') : $t('Base.lessMore')"
          placement="top"
        >
          <el-button
            class="icon-button"
            plain
            :icon="showMoreQuery ? ArrowUp : ArrowDown"
            @click="showMoreQuery = !showMoreQuery"
          >
          </el-button>
        </el-tooltip>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { SEARCH_FORM_RES_PROPS as colProps } from '@/common/constants'
import useI18nTl from '@/hooks/useI18nTl'
import { FilterParamsForQueryRules } from '@/types/rule'
import { ArrowDown, ArrowUp, RefreshLeft, Search } from '@element-plus/icons-vue'
import { omit } from 'lodash'
import { Ref, defineEmits, defineProps, ref } from 'vue'

const props = defineProps({
  initialValue: {
    type: Object,
    default: () => ({}),
  },
})

const createRawFilterParams = () => ({
  like_id: undefined,

  like_from: undefined,
  match_from: undefined,

  enable: undefined,
  like_description: undefined,
})
const { tl, t } = useI18nTl('RuleEngine')
const KEYS_FOR_SEARCH_TOPIC: Array<{ value: 'like_from' | 'match_from'; label: string }> = [
  { value: 'like_from', label: t('Base.topic') },
  { value: 'match_from', label: t('Clients.wildcard') },
]

const emit = defineEmits(['search', 'refresh'])

const showMoreQuery = ref(false)

const filterParams: Ref<FilterParamsForQueryRules> = ref(createRawFilterParams())
const keyForSearchTopic: Ref<'like_from' | 'match_from'> = ref(KEYS_FOR_SEARCH_TOPIC[0].value)

const handleInitialValue = () => {
  filterParams.value = { ...filterParams.value, ...props.initialValue }
  if (filterParams.value.like_from || filterParams.value.match_from) {
    keyForSearchTopic.value = filterParams.value.like_from ? 'like_from' : 'match_from'
  }
  if (filterParams.value.like_description) {
    showMoreQuery.value = true
  }
}
handleInitialValue()

const getFilterParams = () => {
  const filterParamsData = omit(filterParams.value, ['like_from', 'match_from'])
  const ret: FilterParamsForQueryRules = (
    Object.keys(filterParamsData) as Array<keyof typeof filterParamsData>
  ).reduce((obj, currentKey) => {
    const currentVal = filterParamsData[currentKey]
    if (currentVal !== undefined && currentVal !== '') {
      return { ...obj, [currentKey]: currentVal }
    }
    return obj
  }, {})
  if (filterParams.value[keyForSearchTopic.value]) {
    ret[keyForSearchTopic.value] = filterParams.value[keyForSearchTopic.value]
  }
  return ret
}

const searchRule = () => {
  emit('search', getFilterParams())
}

const handleReset = () => {
  filterParams.value = createRawFilterParams()
  searchRule()
}
</script>

<style lang="scss">
@import '~@/style/management.scss';
.rule-filter-form {
  .col-oper {
    float: right;
  }
  // when show more query
  .el-col-24 {
    margin-top: 16px;
  }
  .el-form-item {
    margin-bottom: 0;
  }
  .select-topic-type {
    .el-input {
      width: 100%;
    }
  }
}
</style>
