<!-- 
  Different from src/components/Oneof.vue, src/components/Oneof.vue handles simple oneof
  - item of oneof is not an object
  - there are only two options for oneof
 -->
<template>
  <el-col :span="colSpan" v-bind="$attrs">
    <CustomFormItem
      :label="getLabel(property)"
      :readonly="readonly"
      :value="getLabelFromValueInOptionList(typeIndex, typeOpts)"
    >
      <el-select v-model="typeIndex" @change="handleTypeChanged">
        <el-option
          v-for="{ value, label } in typeOpts"
          :key="value"
          :value="value"
          :label="label"
        />
      </el-select>
    </CustomFormItem>
  </el-col>
  <template v-for="(oneOfItem, $index) in items" :key="$index">
    <template v-if="oneOfItem.$ref && typeIndex === $index">
      <el-col
        v-for="(item, $key) in oneOfItem.properties"
        :span="colSpan"
        :key="$key"
        v-bind="$attrs"
      >
        <CustomFormItem :prop="getFormItemProp($key)" :readonly="readonly">
          <template #label>
            <FormItemLabel :label="getLabel(item)" :desc="getDesc(item)" desc-marked />
          </template>
          <SchemaFormItem
            v-model="(fieldValue as any)[$key]"
            :type="(item.type as any)"
            :symbols="item.symbols"
            :format="item.format"
          />
        </CustomFormItem>
      </el-col>
    </template>
  </template>
</template>

<script setup lang="ts">
import { getLabelFromValueInOptionList } from '@/common/tools'
import { useSymbolLabel } from '@/hooks/Schema/useItemLabelAndDesc'
import useSchemaRecord from '@/hooks/Schema/useSchemaRecord'
import { Properties, Property } from '@/types/schemaForm'
import { get, isEqual, isFunction, snakeCase } from 'lodash'
import { PropType, Ref, computed, defineEmits, defineProps, ref, watch } from 'vue'
import CustomFormItem from './CustomFormItem.vue'
import FormItemLabel from './FormItemLabel.vue'
import SchemaFormItem from './SchemaFormItem'

type OneOfItem = Property | Properties
type FieldValue = string | number | boolean | Record<string, any>
type Symbols = Array<string>

const props = defineProps({
  modelValue: {
    type: [String, Number, Object] as PropType<string | number | Record<string, any> | undefined>,
  },
  property: {
    type: Object as PropType<Property>,
    required: true,
  },
  items: {
    type: Array as PropType<Array<OneOfItem>>,
    required: true,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  colSpan: {
    type: Number,
    default: 12,
  },
  readonly: {
    type: Boolean,
  },
  getText: {
    type: Function as PropType<(property: Property) => { label: string; desc: string }>,
  },
})
const emit = defineEmits(['update:modelValue'])

const isFixedEnum = (item: OneOfItem) => Array.isArray(item.symbols) && item.symbols.length === 1

const typeIndex: Ref<undefined | number> = ref(undefined)

const propertyPath = computed(() => props.property.path || '')

const nameReg = /^.*\.([^.]+)$/

const { getOptLabel } = useSymbolLabel()
const getLabelKey = (item: OneOfItem) => {
  let end = ''
  if (isFixedEnum(item)) {
    end = (item.symbols as Symbols)[0]
  } else if (typeof item.$ref === 'string') {
    const name = item.$ref.match(nameReg)?.[1]
    end = name || item.$ref
  } else {
    end = getOptLabel(item?.toString?.())
  }
  return snakeCase(`${propertyPath.value || ''}${propertyPath.value && '_'}${end}`)
}
const typeOpts = computed(() => {
  return props.items.map((item, $index) => ({
    value: $index,
    label: getOptLabel(getLabelKey(item)),
  }))
})
const { initRecordByComponents } = useSchemaRecord()
const handleTypeChanged = (value: number) => {
  const newProps = props.items[value]
  if (newProps.$ref) {
    const newRecord = initRecordByComponents(newProps.properties as Properties)
    fieldValue.value = get(newRecord, propertyPath.value)
  } else if (isFixedEnum(newProps)) {
    fieldValue.value = (newProps.symbols as Symbols)[0]
  }
}
const getFormItemProp = (key: string) =>
  `${propertyPath.value}${propertyPath.value ? '.' : ''}${key}`

const fieldValue: Ref<string | number | boolean | Record<string, any>> = ref('')

const judgeTypeIndexByValue = (value: FieldValue, items: Array<OneOfItem>): number => {
  if (!value) {
    return 0
  }
  const ret = items.findIndex((item) => {
    if (typeof value === 'string') {
      return item.$ref ? false : isFixedEnum(item) && (item.symbols as Symbols)[0] === value
    }
    if (!item.$ref || !item.properties) {
      return false
    }
    const propKeys = Object.keys(item.properties)
    return Object.keys(value).every((key) => propKeys.includes(key))
  })
  return ret < -1 ? 0 : ret
}
const init = () => {
  if (props.modelValue) {
    fieldValue.value = props.modelValue
    typeIndex.value = judgeTypeIndexByValue(props.modelValue, props.items)
  }
}

const getLocalizedValue = (property: Property, field: 'label' | 'desc') => {
  const { key } = property
  if (isFunction(props.getText)) {
    const localizedText = props.getText(property)
    return localizedText ? localizedText[field] || key : key
  }
  return key
}

const getLabel = (property: Property) => getLocalizedValue(property, 'label')
const getDesc = (property: Property) => getLocalizedValue(property, 'desc')

watch(
  () => props.modelValue,
  (nV, oV) => {
    if (!isEqual(nV, oV)) {
      init()
    }
  },
)

watch(
  () => fieldValue.value,
  (v) => {
    emit('update:modelValue', v)
  },
)

init()
</script>

<style lang="scss"></style>
