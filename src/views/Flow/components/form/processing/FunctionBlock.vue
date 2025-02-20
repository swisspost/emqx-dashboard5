<template>
  <el-form
    ref="FormCom"
    label-width="80px"
    class="function-block"
    label-position="right"
    :rules="rules"
    :model="record"
    :validate-on-rule-change="false"
    :hide-required-asterisk="readonly"
  >
    <CustomFormItem :readonly="readonly" :label="t('components.field')" prop="field">
      <CommonFields v-model="record.field" @change="handleFieldChanged" />
    </CustomFormItem>
    <CustomFormItem :readonly="readonly" :label="t('Flow.transform')" prop="func.name">
      <el-select
        filterable
        clearable
        v-model="record.func.name"
        class="select-func"
        @change="handleSelectFunc"
      >
        <el-option-group
          v-for="group in funcOptList"
          :key="group.groupLabel"
          :label="tl(group.groupLabel)"
        >
          <el-option
            v-for="item in group.list"
            :key="item.name"
            :label="item.name"
            :value="item.name"
          />
        </el-option-group>
      </el-select>
    </CustomFormItem>
    <div class="args-block" v-if="showArgsBlock">
      <CustomFormItem
        v-for="(item, $index) in args"
        :readonly="readonly"
        :label="tl(item.name)"
        :prop="`func.args.${$index}`"
        :key="`${record.func.name}-${item.name}`"
        label-width="120px"
      >
        <el-select
          v-if="item.type === ArgumentType.Enum"
          clearable
          filterable
          allow-create
          v-model="record.func.args[$index]"
          @change="handleSelectFunc"
        >
          <el-option
            v-for="value in item.optionalValues"
            :key="value"
            :label="value"
            :value="value"
          />
        </el-select>
        <el-input
          v-else
          v-model="record.func.args[$index]"
          @change="handleArgChanged($event, $index, item.type)"
        />
      </CustomFormItem>
    </div>
    <CustomFormItem :readonly="readonly" :label="t('Flow.alias')" prop="alias">
      <el-input v-model="record.alias" />
    </CustomFormItem>
  </el-form>
</template>

<script setup lang="ts">
import CustomFormItem from '@/components/CustomFormItem.vue'
import useFormRules from '@/hooks/useFormRules'
import useI18nTl from '@/hooks/useI18nTl'
import useRuleFunc, { ArgumentType, FuncItem } from '@/hooks/useRuleFunc'
import { FormRules } from '@/types/common'
import { computed, defineEmits, defineExpose, defineProps, ref } from 'vue'
import CommonFields from '../CommonFields.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue'])

const { t, tl } = useI18nTl('Function')

const { funcOptList, getFuncItemByName, getFuncGroupByName, getArgIndex } = useRuleFunc()

const FormCom = ref()

const record = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const fillParams = (
  field: string,
  { groupLabel, func }: { groupLabel: string; func: FuncItem },
) => {
  let targetIndex = getArgIndex(func, groupLabel)
  return func.args.map((_, index) => (index === targetIndex ? field : ''))
}

const selectedFunc = computed(() => {
  const funcName = record.value?.func?.name
  return funcName ? getFuncItemByName(funcName) : null
})

const args = computed(() => (selectedFunc.value ? selectedFunc.value.args : []))

const showArgsBlock = computed(() => {
  return !(args.value.length === 0 || (args.value.length === 1 && args.value[0].required))
})

const handleSelectFunc = (funcName: string) => {
  if (!funcName) {
    record.value.func.args = []
    return
  }
  const groupLabel = getFuncGroupByName(funcName)
  if (!groupLabel || !selectedFunc.value) {
    return
  }
  if (showArgsBlock.value) {
    record.value.func.args = fillParams(record.value.field, {
      groupLabel,
      func: selectedFunc.value,
    })
  } else {
    record.value.func.args = [record.value.field]
  }
}

const handleFieldChanged = (val: string) => {
  if (args.value.length && !showArgsBlock.value) {
    record.value.func.args = [val]
  }
}

const numberTypes = [ArgumentType.Number, ArgumentType.Float, ArgumentType.Integer]
/**
 * When the type of the parameter is a number type and
 * no placeholder is used, convert the type of its value
 */
const handleArgChanged = (val: string, index: number, type: ArgumentType) => {
  if (numberTypes.includes(type) && val !== '' && !Number.isNaN(Number(val))) {
    record.value.func.args[index] = Number(val)
  }
}

const { createRequiredRule } = useFormRules()
const rules = computed(() => {
  const { func = {} } = record.value || {}
  const ret: FormRules = {
    field: [
      ...createRequiredRule(t('components.field')),
      {
        validator(rules: any, value: string, callback) {
          if (showArgsBlock.value && Array.isArray(func.args) && !func.args.includes(value)) {
            callback(new Error(t('Flow.unusedField')))
          }
          callback()
        },
      },
    ],
  }
  if (func.name) {
    ret.alias = [
      {
        required: true,
        validator(rules, value, cb) {
          if (func.name && !value) {
            cb(new Error(t('Flow.aliasRequired')))
          }
          cb()
        },
      },
    ]
  }
  args.value.forEach((item, index) => {
    if (item.required) {
      // TODO:replace name to label
      ret[`func.args.${index}`] = createRequiredRule(tl(item.name))
    }
  })
  return ret
})

const validate = () => FormCom.value.validate()

defineExpose({ validate })
</script>

<style lang="scss">
.function-block {
  padding: 24px;
  border-radius: 8px;
  background-color: var(--color-bg-split);

  .args-block {
    // same as label width
    margin-left: 80px;
    margin-right: 40px;
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--color-bg-table-hd);
  }

  .common-fields {
    width: 100%;
  }
  .select-func {
    width: 50%;
  }
}
</style>
