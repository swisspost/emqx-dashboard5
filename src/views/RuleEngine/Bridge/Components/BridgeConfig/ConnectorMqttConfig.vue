<template>
  <div>
    <div class="connector-mqtt-config form-sub-block">
      <!-- <div class="part-header">{{ tl('connParams') }}</div> -->
      <el-row :gutter="30">
        <el-col :span="colSpan">
          <CustomFormItem
            :label="tl('brokerAddress')"
            required
            :prop="getFormItemProp('server')"
            :readonly="readonly"
          >
            <el-input v-model="connectorVal.server" placeholder="broker.emqx.io:1883" />
          </CustomFormItem>
        </el-col>
        <el-col :span="colSpan">
          <CustomFormItem :label="tl('username')" :readonly="readonly">
            <el-input v-model="connectorVal.username" />
          </CustomFormItem>
        </el-col>
        <el-col :span="colSpan">
          <CustomFormItem
            :label="tl('password')"
            :prop="getFormItemProp('password')"
            :readonly="readonly"
          >
            <el-input
              type="password"
              autocomplete="one-time-code"
              v-model="connectorVal.password"
              show-password
            />
          </CustomFormItem>
        </el-col>
        <el-col :span="colSpan">
          <CustomFormItem :label="'Keep Alive'" :readonly="readonly">
            <TimeInputWithUnitSelect
              v-model="connectorVal.keepalive"
              number-placeholder="60"
              :enabled-units="['s']"
            />
          </CustomFormItem>
        </el-col>
        <el-col :span="colSpan">
          <el-form-item :label="tl('mqttVer')">
            <el-select v-model="connectorVal.proto_ver" v-if="!readonly">
              <el-option
                v-for="{ label, value } in MQTT_VERSION_LIST"
                :key="value"
                :value="value"
                :label="label"
              />
            </el-select>
            <p class="value" v-else>
              {{ getLabelFromValueInOptionList(connectorVal.proto_ver, MQTT_VERSION_LIST) }}
            </p>
          </el-form-item>
        </el-col>
        <el-col :span="colSpan">
          <CustomFormItem :readonly="readonly">
            <template #label>
              <label>{{ tl('cleanStart') }}</label>
              <InfoTooltip :content="tl('cleanStartDesc')" />
            </template>
            <el-switch v-model="connectorVal.clean_start" />
          </CustomFormItem>
        </el-col>
      </el-row>
    </div>
    <CustomFormItem label-width="0px">
      <CommonTLSConfig
        class="tls-config-form"
        v-model="connectorVal.ssl"
        :readonly="readonly"
        :is-edit="edit || copy"
      />
    </CustomFormItem>

    <!-- <el-divider /> -->
  </div>
</template>

<script lang="ts">
import { MQTT_VERSION_LIST } from '@/common/constants'
import { getLabelFromValueInOptionList } from '@/common/tools'
import CustomFormItem from '@/components/CustomFormItem.vue'
import InfoTooltip from '@/components/InfoTooltip.vue'
import CommonTLSConfig from '@/components/TLSConfig/CommonTLSConfig.vue'
import TimeInputWithUnitSelect from '@/components/TimeInputWithUnitSelect.vue'
import { cloneDeep } from 'lodash'
import { computed, defineComponent, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'ConnectorMqttConfig',
  components: { TimeInputWithUnitSelect, CommonTLSConfig, InfoTooltip, CustomFormItem },
  props: {
    modelValue: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    edit: {
      type: Boolean,
      required: false,
      default: false,
    },
    copy: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * for form rules
     */
    connectorField: {
      type: String,
    },
    colSpan: {
      type: Number,
      default: 12,
    },
    readonly: {
      type: Boolean,
    },
  },
  setup(prop, context) {
    const { t } = useI18n()

    let connectorValCache = ''
    const connectorVal = computed({
      get() {
        return prop.modelValue
      },
      set(val) {
        connectorValCache = JSON.stringify(val)
        context.emit('update:modelValue', val)
      },
    })

    watch(
      () => prop.modelValue,
      (val) => {
        if (JSON.stringify(val) !== connectorValCache) {
          initConnectorVal()
        }
      },
    )

    const getFormItemProp = (rawProp: string) => {
      const { connectorField } = prop
      return connectorField ? `${connectorField}.${rawProp}` : rawProp
    }

    const initConnectorVal = () => {
      connectorVal.value = cloneDeep(prop.modelValue)
    }

    onMounted(() => {
      initConnectorVal()
    })

    return {
      tl: (key: string) => t('RuleEngine.' + key),
      MQTT_VERSION_LIST,
      getLabelFromValueInOptionList,
      connectorVal,
      getFormItemProp,
    }
  },
})
</script>

<style lang="scss" scoped>
.tls-config-form {
  width: 100%;
  :deep(.TLS-base-config) {
    margin-bottom: 0px;
  }
  :deep(.TLS-base-config) .TLS-base-config-title {
    font-size: 14px;
    font-weight: normal;
  }
  :deep(.TLS-enable-config) {
    .TLS-input {
      width: 100%;
    }
  }
}
</style>
