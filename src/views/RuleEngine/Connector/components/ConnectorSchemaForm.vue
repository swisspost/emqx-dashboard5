<template>
  <div class="schema-form-integration connector-config">
    <schema-form
      v-if="getRefKey"
      ref="formCom"
      type="connector"
      need-rules
      schema-file-path="api/v5/schemas/connectors"
      :need-footer="false"
      :need-record="!edit && !copy"
      :form="connectorRecord"
      :according-to="{ ref: `#/components/schemas/${getRefKey}` }"
      :readonly="readonly"
      :btn-loading="saveLoading"
      :record-loading="isLoading"
      :form-item-span="colSpan"
      :use-tooltip-show-desc="true"
      :props-order-map="propsOrderMap"
      :custom-col-class="customColClass"
      :form-props="formBindProps"
      :advanced-fields="advancedFields"
      :data-handler="getComponentsHandler()"
      @update="handleRecordChanged"
      @component-change="handleComponentChange"
      @init="handleRecordInit"
    />
  </div>
</template>

<script setup lang="ts">
import { waitAMoment } from '@/common/tools'
import SchemaForm from '@/components/SchemaForm'
import useReuseBridgeInFlow from '@/hooks/Flow/useReuseBridgeInFlow'
import useSyncConfiguration from '@/hooks/Rule/bridge/useSyncConfiguration'
import useComponentsHandlers from '@/hooks/Rule/connector/useComponentsHandlers'
import useSchemaPropsLayout from '@/hooks/Rule/connector/useSchemaConnectorPropsLayout'
import useFillNewRecord from '@/hooks/useFillNewRecord'
import { BridgeType } from '@/types/enum'
import { OtherBridge } from '@/types/rule'
import { Properties } from '@/types/schemaForm'
import { cloneDeep } from 'lodash'
import { computed, defineEmits, defineExpose, defineProps, ref, watch, withDefaults } from 'vue'

const typeRefKeyMap = {
  [BridgeType.Webhook]: 'bridge_http.post_connector',
}

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>
    /**
     * in fact, type is UseConnectorBridgeType, but use it will trigger
     * https://github.com/vuejs/core/issues/6252
     */
    type?: string
    edit?: boolean
    copy?: boolean
    isLoading?: boolean
    readonly?: boolean
    formProps?: Record<string, any>
    // for flow, hide `role`
    hiddenFields?: Array<string>
    isUsingInFlow?: boolean
  }>(),
  {
    modelValue: undefined,
    formProps: () => ({}),
  },
)
const emit = defineEmits(['update:modelValue', 'init'])

const connectorRecord = computed({
  get() {
    return props.modelValue || {}
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const colSpan = computed(() => (props.isUsingInFlow ? 24 : 12))

const { handleSyncEtcFormData } = useSyncConfiguration(connectorRecord)

const saveLoading = ref(false)

const formCom = ref()

const formBindProps = {
  labelWidth: undefined,
  labelPosition: 'top',
  requireAsteriskPosition: 'right',
  class: '',
  ...props.formProps,
}

const {
  propsOrderMap,
  customColClass: fixedCustomColClass,
  advancedFields,
} = useSchemaPropsLayout(props, connectorRecord)
const customColClass = computed(() => {
  const ret = fixedCustomColClass.value
  if (props.hiddenFields) {
    props.hiddenFields.forEach((key) => (ret[key] = 'col-hidden'))
  }
  return ret
})

const { isBridgeSelected } = useReuseBridgeInFlow(props.type as BridgeType, props, connectorRecord)

watch(isBridgeSelected, async (nVal, oVal) => {
  if (!nVal && oVal && formCom.value?.getInitRecord) {
    connectorRecord.value = formCom.value.getInitRecord()
    await waitAMoment()
    formCom.value.clearValidate?.()
  }
})

const getRefKey = computed(() => {
  if (!props.type) {
    return
  }
  return typeRefKeyMap[props.type as keyof typeof typeRefKeyMap] || undefined
})

const { getComponentsHandler } = useComponentsHandlers(props)

const { fillNewRecord } = useFillNewRecord()
const handleComponentChange = ({
  newVal,
  oldVal,
}: Record<'oldVal' | 'newVal', { components: Properties; record: Record<string, any> }>) => {
  if (props.edit || newVal.record?.type === oldVal.record?.type) {
    return
  }
  connectorRecord.value = { ...fillNewRecord(newVal, oldVal), type: newVal.record.type }
}

const handleRecordChanged = (formData: OtherBridge) => {
  if (Object.keys(formData).length > 0) {
    connectorRecord.value = formData
  }
}

const handleRecordInit = (record: OtherBridge) => {
  emit('init', record)
}

const validate = () => {
  if (formCom.value?.validate) {
    return formCom.value.validate()
  }
  return Promise.resolve()
}

const getFormRecord = () => handleSyncEtcFormData(cloneDeep(formCom.value.configForm))

defineExpose({ getFormRecord, validate })
</script>
