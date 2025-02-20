<template>
  <div class="rule-outputs">
    <div class="sub-block-desc">
      <span>{{ tl('actionDesc') }}</span>
    </div>
    <el-row>
      <el-col :span="24">
        <template v-for="(item, index) in ruleValue.actions" :key="item">
          <div class="outputs-item">
            <img :src="getOutputImage(item)" />
            <div class="outputs-item-bd">
              <div v-if="judgeOutputType(item) === RuleOutput.DataBridge">
                {{ (item as string).split(BRIDGE_TYPE_ID_CONNECTOR)[1] }}
              </div>
              <div class="output-desc">
                {{ getOutputTypeLabel(item) }}
              </div>
            </div>

            <span class="output-op">
              <el-button size="small" @click="openOutputDialog(true, index)">
                {{ $t('Base.edit') }}
              </el-button>
              <el-button size="small" plain @click="deleteOutput(index)">
                {{ $t('Base.delete') }}
              </el-button>
            </span>
          </div>
        </template>
        <el-button class="btn-add" type="primary" @click="openOutputDialog(false)">
          <el-icon><plus /></el-icon>
          <span>{{ tl('addAction') }}</span>
        </el-button>
      </el-col>
    </el-row>
  </div>
  <RuleOutputsDrawer
    v-model="showOutputDrawer"
    :output="currentOutputItem"
    :output-disable-list="outputDisableList"
    :edit="isEdit"
    @submit="submitOutput"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'RuleOutputs',
})
</script>

<script setup lang="ts">
import { useBridgeTypeIcon, useBridgeTypeValue } from '@/hooks/Rule/bridge/useBridgeTypeValue'
import useI18nTl from '@/hooks/useI18nTl'
import { BridgeType, RuleOutput } from '@/types/enum'
import { BasicRule, OutputItem, OutputItemObj, RuleItem } from '@/types/rule'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox as MB } from 'element-plus'
import { computed, defineEmits, defineProps, PropType, ref, Ref, WritableComputedRef } from 'vue'
import RuleOutputsDrawer from './RuleOutputsDrawer.vue'

const BRIDGE_TYPE_ID_CONNECTOR = ':'

const props = defineProps({
  modelValue: {
    type: Object as PropType<RuleItem | BasicRule>,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const ruleValue: WritableComputedRef<RuleItem | BasicRule> = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const { tl, t } = useI18nTl('RuleEngine')
const showOutputDrawer = ref(false)
const outputDisableList: Ref<Array<string>> = ref([])
const isEdit = ref(false)
const editIndex: Ref<number | undefined> = ref(undefined)
const currentOutputItem: Ref<OutputItem | undefined> = ref(undefined)

const { getBridgeIconKey } = useBridgeTypeIcon()
const { getGeneralTypeLabel } = useBridgeTypeValue()

const calcDisableList = () => {
  outputDisableList.value = []
  if (!Array.isArray(ruleValue.value.actions)) {
    return
  }
  ruleValue.value.actions?.forEach((v: OutputItem) => {
    if (typeof v === 'string') {
      outputDisableList.value.push(v)
    } else if (typeof v === 'object') {
      //republish can be duplicated
      if (v.function === RuleOutput.Republish) return
      v.function && outputDisableList.value.push(v.function)
    }
  })
}

const openOutputDialog: (edit: boolean, itemIndex?: number | undefined) => void = async (
  edit = false,
  itemIndex,
) => {
  showOutputDrawer.value = true
  let item: OutputItem | undefined
  editIndex.value = itemIndex
  if (itemIndex !== undefined && Array.isArray(ruleValue.value.actions)) {
    item = ruleValue.value.actions?.[itemIndex]
  }
  if (edit) {
    isEdit.value = edit
    currentOutputItem.value = item
  } else {
    isEdit.value = false
    currentOutputItem.value = undefined
  }
  calcDisableList()
}

const deleteOutput = async (itemIndex: number | undefined) => {
  try {
    await MB.confirm(t('Base.confirmDelete'), {
      confirmButtonText: t('Base.confirm'),
      cancelButtonText: t('Base.cancel'),
      confirmButtonClass: 'confirm-danger',
      type: 'warning',
    })
    if (itemIndex !== undefined && Array.isArray(ruleValue.value.actions)) {
      ruleValue.value.actions?.splice(itemIndex, 1)
      calcDisableList()
    }
  } catch (error) {
    //
  }
}

const submitOutput = (opObj: OutputItem, isEdit: boolean) => {
  const output = ruleValue.value.actions || []
  if (Array.isArray(output)) {
    if (!currentOutputItem.value || !isEdit) {
      output.push(opObj)
    } else {
      editIndex.value !== undefined && output.splice(editIndex.value, 1, opObj)
    }
  }
  calcDisableList()
}

const judgeOutputType = (output: OutputItem) => {
  if (typeof output === 'string') {
    if (output.indexOf(BRIDGE_TYPE_ID_CONNECTOR) > -1) {
      // bridge
      return RuleOutput.DataBridge
    }
  } else if (
    typeof output === 'object' &&
    'function' in output &&
    (output.function === RuleOutput.Republish || output.function === RuleOutput.Console)
  ) {
    return output.function
  }
}

const getOutputImage = (item: OutputItem) => {
  if (!item) {
    return ''
  }
  const itemType = judgeOutputType(item)
  let keyForIcon = ''
  switch (itemType) {
    case RuleOutput.DataBridge:
      keyForIcon = getBridgeIconKey((item as string).split(BRIDGE_TYPE_ID_CONNECTOR)[0])
      break
    case RuleOutput.Console:
      keyForIcon = (item as OutputItemObj).function
      break
    case RuleOutput.Republish:
      keyForIcon = (item as OutputItemObj).function
      break
  }
  try {
    return require(`@/assets/img/${keyForIcon}.png`)
  } catch (e) {
    //May it be a user defined module
    console.log('ImgErr:', e)
  }
}

const getOutputTypeLabel = (item: OutputItem) => {
  // bridge - string; console - string; re pub - object
  if (!item) {
    return ''
  }
  const itemType = judgeOutputType(item)
  switch (itemType) {
    case RuleOutput.DataBridge:
      return getGeneralTypeLabel((item as string).split(BRIDGE_TYPE_ID_CONNECTOR)[0] as BridgeType)
    case RuleOutput.Console:
      return tl('consoleOutput')
    case RuleOutput.Republish:
      return tl('republish')
  }
}
</script>

<style lang="scss" scoped>
.outputs-item {
  height: 64px;
  border: 1px solid var(--color-border-primary);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-radius: var(--el-border-radius-base);
  padding: 0 6px;
  margin-bottom: 12px;
  $img-width: 48px;
  $img-margin-right: 12px;
  $op-width: 136px;
  img {
    width: $img-width;
    flex-shrink: 0;
    margin-right: $img-margin-right;
  }

  .outputs-item-bd {
    flex-grow: 1;
    max-width: calc(100% - $img-width - $img-margin-right - 12px);
    div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      line-height: 1.6;
    }
    .output-desc {
      color: var(--color-text-secondary);
    }
  }

  .output-op {
    display: none;
    flex-basis: $op-width;
    flex-shrink: 0;
    padding: 0 10px;
    text-align: right;
  }
  &:hover {
    border-color: var(--el-color-primary);
    cursor: pointer;
    .output-op {
      display: block;
      color: var(--el-color-primary);
    }
    .outputs-item-bd {
      max-width: calc(100% - $img-width - $img-margin-right - $op-width);
    }
  }
}

.btn-add {
  margin-top: 24px;
  :deep(span) {
    display: flex;
    align-items: center;
  }
  .el-icon {
    font-size: 16px;
  }
}

.edit-output {
  color: var(--el-color-primary);
  line-height: 50px;
  cursor: pointer;
}
</style>
