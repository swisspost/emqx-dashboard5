<template>
  <el-drawer
    v-model="showDrawer"
    :custom-class="`node-drawer drawer-with-divider ${showTabs ? 'with-tabs' : ''}`"
    :size="width"
    :title="title"
    :z-index="1999"
    :before-close="cancel"
    :destroy-on-close="true"
    :close-on-press-escape="false"
  >
    <el-alert v-if="pwdErrorWhenCoping" :title="pwdErrorWhenCoping" type="error" />
    <RemovedBridgeTip v-if="isRemovedBridge" />
    <template v-else-if="getFormComponent(type)">
      <el-tabs v-if="showTabs" v-model="activeTab">
        <el-tab-pane :label="t('Base.setting')" :name="DetailTab.Setting" />
        <el-tab-pane :label="tl('overview')" :name="DetailTab.Overview" />
      </el-tabs>
      <component
        v-if="activeTab === DetailTab.Setting"
        ref="FormCom"
        :is="getFormComponent(type)"
        v-model="record"
        v-bind="getFormComponentProps(type)"
        :readonly="readonly"
        :edit="isEdit"
        :class="{ 'in-tab': showTabs }"
        @save="save"
        @init="resetRawRecord"
      />
      <NodeMetrics v-else-if="activeTab === DetailTab.Overview" :node="node" />
    </template>
    <template #footer>
      <div class="space-between" v-if="!readonly">
        <div>
          <el-button
            v-if="node?.type === FlowNodeType.Default && record.editedWay !== undefined"
            link
            type="primary"
            @click="toggleEditedWay"
          >
            {{ t(`Flow.${record.editedWay === EditedWay.Form ? 'switchToSql' : 'switchToForm'}`) }}
          </el-button>
        </div>
        <div>
          <el-button @click="cancel">{{ tl('cancel') }}</el-button>
          <el-button v-if="isBridgeSelected" type="primary" plain @click="saveAsNew">
            {{ t('Flow.saveAsDuplication', { target: targetForSaveAsNew }) }}
          </el-button>
          <el-button
            :disabled="isSaveDisabled"
            :type="isSaveDisabled ? 'info' : 'primary'"
            @click="save"
          >
            {{ tl('save') }}
          </el-button>
        </div>
      </div>
      <el-button v-else type="primary" @click="edit">
        {{ tl('edit') }}
      </el-button>
    </template>
  </el-drawer>
  <NameInputForCopyBridgeDialog v-model="showNameInputDialog" @save="handleNameSave" />
</template>

<script setup lang="ts">
import { customValidate } from '@/common/tools'
import useFlowNode, {
  EditedWay,
  FlowNodeType,
  ProcessingType,
  SinkType,
  SourceType,
} from '@/hooks/Flow/useFlowNode'
import useGenerateFlowDataUtils from '@/hooks/Flow/useGenerateFlowDataUtils'
import useNodeDrawer from '@/hooks/Flow/useNodeDrawer'
import useNodeForm from '@/hooks/Flow/useNodeForm'
import useCheckBeforeSaveAsCopy from '@/hooks/Rule/bridge/useCheckBeforeSaveAsCopy'
import useI18nTl from '@/hooks/useI18nTl'
import { BridgeDirection } from '@/types/enum'
import RemovedBridgeTip from '@/views/RuleEngine/components/RemovedBridgeTip.vue'
import { Node } from '@vue-flow/core'
import { ElMessageBox } from 'element-plus'
import { cloneDeep, isEqual, isFunction, isObject, lowerCase } from 'lodash'
import { PropType, Ref, computed, defineEmits, defineProps, ref, watch } from 'vue'
import NameInputForCopyBridgeDialog from './NameInputForCopyBridgeDialog.vue'
import NodeMetrics from './metrics/NodeMetrics.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  node: {
    type: Object as PropType<Node>,
  },
  nodes: {
    type: Array as PropType<Array<Node>>,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel', 'close', 'edit', 'saveAsNew'])

const showDrawer = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    emit('update:modelValue', val)
  },
})

const { t, tl } = useI18nTl('Base')

/**
 * is specific type, no general type
 * eg. SourceType.Message etc.
 */
const type = computed(() => props.node?.data?.specificType)
const isEdit = computed(() => props.node?.data?.isCreated)

const FormCom = ref()

const isRemovedBridge = computed(() => {
  if (!props.node || !props.node.data) {
    return false
  }
  return props.node.data.isRemoved
})

const { getDrawerTitle, drawerDefaultWidth, getDrawerWidth, getFormComponent } = useNodeDrawer()
const title = computed(() => (type.value ? getDrawerTitle(type.value) : ''))
const width = computed(() => (type.value ? getDrawerWidth(type.value) : drawerDefaultWidth))

const selectedEvents = computed(() => {
  if (!props.nodes?.length) {
    return []
  }
  return props.nodes.reduce((arr: Array<string>, node) => {
    if (node.data.specificType === SourceType.Event && node.data.formData?.event) {
      arr.push(node.data.formData.event)
    }
    return arr
  }, [])
})

const existedTopics = computed(() => {
  if (!props.nodes?.length) {
    return []
  }
  const currentNodeID = props.node?.id
  return props.nodes.reduce((arr: Array<string>, node) => {
    if (
      node.data.specificType === SourceType.Message &&
      node.data.formData?.topic &&
      node.id !== currentNodeID
    ) {
      arr.push(node.data.formData.topic)
    }
    return arr
  }, [])
})

const { isBridgerNode, removeDirectionFromSpecificType } = useFlowNode()
const { getFormDataByType, isUsingSchemaBridgeType, checkFormIsEmpty } = useNodeForm()
const withOutMetricsTypes: Record<FlowNodeType, Array<string>> = {
  [FlowNodeType.Input]: [SourceType.Event, SourceType.Message],
  [FlowNodeType.Default]: [ProcessingType.Filter, ProcessingType.Function],
  [FlowNodeType.Output]: [SinkType.Console, SinkType.RePub],
}
const withMetrics = computed(() => {
  const { node } = props
  if (!node || !node.type || !node.data.specificType) {
    return false
  }
  const withOutMetricsTypesArr = withOutMetricsTypes[node.type as FlowNodeType] || []
  return !withOutMetricsTypesArr.includes(node.data.specificType)
})
const showTabs = computed(() => withMetrics.value && props.readonly)
const enum DetailTab {
  Setting,
  Overview,
}
const activeTab = ref(DetailTab.Setting)

const bridgeFormProps = {
  colSpan: 24,
  labelPosition: 'right',
  requireAsteriskPosition: 'left',
  isUsingInFlow: true,
}
const schemaProps = {
  formProps: {
    labelWidth: '180px',
    labelPosition: 'right',
    requireAsteriskPosition: 'left',
  },
}

const getSchemaBridgeProps = (type: string) => ({
  ...bridgeFormProps,
  ...schemaProps,
  isUsingInFlow: true,
  labelWidth: '180px',
  hiddenFields: ['role'],
  type: removeDirectionFromSpecificType(type),
})

const formComponentPropsMap = computed(() => ({
  [SourceType.Message]: { existedTopics: existedTopics.value },
  [SourceType.Event]: { selectedEvents: selectedEvents.value },
  [SourceType.MQTTBroker]: { direction: BridgeDirection.Ingress },
  [SinkType.RePub]: { isUsingInFlow: true },
  [SinkType.MQTTBroker]: { direction: BridgeDirection.Egress },
}))
const getFormComponentProps = (type: string) => {
  const ret = formComponentPropsMap.value[type]
  if (!ret && isUsingSchemaBridgeType(type)) {
    return getSchemaBridgeProps(type)
  }
  return ret || {}
}

const record: Ref<Record<string, any>> = ref({})

const isSaveDisabled = computed(() => checkFormIsEmpty(type.value, record.value))

const { detectFieldsExpressionsEditedWay, detectWhereDataEditedWay } = useGenerateFlowDataUtils()
const toggleEditedWay = async () => {
  try {
    if (![ProcessingType.Filter, ProcessingType.Function].includes(type.value)) {
      return
    }
    if (record.value.editedWay === EditedWay.SQL) {
      const detectFunc =
        type.value === ProcessingType.Filter
          ? detectWhereDataEditedWay
          : detectFieldsExpressionsEditedWay
      const defaultEditedWay = detectFunc(record.value.form)
      if (defaultEditedWay === EditedWay.SQL) {
        await ElMessageBox.confirm(t('Flow.editedWayToggleTip'), {
          confirmButtonText: tl('confirm'),
          cancelButtonText: tl('cancel'),
          type: 'warning',
        })
      }
    }
    record.value.editedWay =
      record.value.editedWay === EditedWay.SQL ? EditedWay.Form : EditedWay.SQL
  } catch (error) {
    //
  }
}

const isBridgeSelected = computed(() => {
  if (!props.node) {
    return false
  }
  return isBridgerNode(props.node) && !!record.value.id
})
const showNameInputDialog = ref(false)

/**
 * When clicking the cancel / close button, it's used to compare the
 * current record's value to determine whether to pop up a window or not.
 */
let rawRecord: Record<string, any> = {}

const resetRawRecord = (record: Record<string, any>) => {
  rawRecord = cloneDeep(record)
}

const recordHasNotChanged = () => {
  const ret = isEqual(record.value, rawRecord)
  return ret
}

const cancel = async () => {
  try {
    if (!recordHasNotChanged() && !props.readonly) {
      await ElMessageBox.confirm(
        t('Flow.nodeDrawerCancelTip', {
          type: lowerCase(props.node?.data?.formData ? tl('edit') : tl('create')),
        }),
        {
          confirmButtonText: tl('confirm'),
          cancelButtonText: tl('cancel'),
          type: 'warning',
        },
      )
    }
    emit('cancel')
    showDrawer.value = false
  } catch (error) {
    //
  }
}

const save = async () => {
  try {
    if (FormCom.value.validate && isFunction(FormCom.value.validate)) {
      await customValidate(FormCom.value)
    }
    emit('save', record.value)
  } catch (error) {
    console.error(error)
  }
}

const targetForSaveAsNew = computed(() =>
  props.node?.type === FlowNodeType.Input ? 'source' : 'sink',
)
const { pwdErrorWhenCoping, checkLikePwdField } = useCheckBeforeSaveAsCopy()
const saveAsNew = async () => {
  try {
    if (FormCom.value.validate && isFunction(FormCom.value.validate)) {
      await customValidate(FormCom.value)
    }
    await checkLikePwdField(
      record.value,
      t('Flow.saveAsNewWarning', { target: targetForSaveAsNew.value }),
    )
    showNameInputDialog.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleNameSave = (name: string) => {
  record.value.name = name
  Reflect.deleteProperty(record.value, 'id')
  emit(isEdit.value ? 'saveAsNew' : 'save', record.value)
}

const edit = () => emit('edit')

watch(showDrawer, (val) => {
  if (!val) {
    activeTab.value = DetailTab.Setting
    return
  }

  const { node } = props
  const { formData, specificType: type } = node?.data || {}
  record.value = formData && isObject(formData) ? cloneDeep(formData) : getFormDataByType(type)
  rawRecord = cloneDeep(record.value)
  pwdErrorWhenCoping.value = ''
})
</script>

<style lang="scss">
.node-drawer {
  &.with-tabs {
    .el-drawer__header {
      margin-bottom: 24px;
    }
    .el-drawer__body {
      padding-top: 0;
    }
  }
  .in-tab {
    padding-top: 24px;
  }
  .bridge-config {
    .el-form-item {
      margin-top: 0;
      margin-bottom: 24px;
    }
    .el-divider--horizontal {
      margin-top: 0;
    }
    .el-form-item__label {
      height: 32px;
      align-items: center;
      text-align: right;
      line-height: 1.2;
    }
    $input-append-width: 120px;
    .el-form-item__content,
    .oneof-item {
      > .el-input:not(.el-input-group--append),
      > .el-select,
      .connector-select {
        width: calc(100% - #{$input-append-width});
      }
    }
    .one-of {
      width: 100%;
    }
    .monaco-container {
      width: calc(100% - #{$input-append-width} / 2);
    }
  }
  .el-alert {
    margin-bottom: 16px;
  }
  .mqtt-bridge-trans-configuration {
    .monaco-container {
      margin-top: 0;
    }
  }
  .message-form,
  .event-form {
    width: 80%;
  }
  .TLS-enable-config .TLS-input {
    width: 100%;
  }
}
</style>
