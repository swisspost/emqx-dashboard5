<template>
  <div class="monitoring-integration app-wrapper">
    <el-card class="app-card allow-overflow" v-loading="isDataLoading">
      <div class="schema-form">
        <el-form
          class="configuration-form"
          label-position="right"
          require-asterisk-position="left"
          :label-width="store.state.lang === 'zh' ? 176 : 190"
        >
          <el-row>
            <el-col :xs="24" :sm="24" :md="24" :lg="14" :xl="12">
              <el-form-item class="radio-form-item">
                <template #label>
                  <FormItemLabel
                    :label="tl('monitoringPlatform')"
                    :desc="tl('monitoringPlatformFormItemLabel')"
                  />
                </template>
                <el-radio-group class="platform-radio-group" v-model="selectedPlatform">
                  <el-row :gutter="28">
                    <el-col v-for="item in platformOpts" :key="item.label" :span="12">
                      <el-radio class="platform-radio" :label="item.label" border>
                        <img class="img-platform" height="52" :src="item.img" :alt="item.label" />
                        <span class="platform-name"> {{ item.label }} </span>
                      </el-radio>
                    </el-col>
                  </el-row>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <!-- Prometheus -->
          <template v-if="selectedPlatform === 'Prometheus'">
            <el-row>
              <el-col :span="21" class="custom-col">
                <el-form-item>
                  <template #label>
                    <FormItemLabel
                      :label="tl('enableBasicAuth')"
                      :desc="tl('enableBasicAuthDesc')"
                    />
                  </template>
                  <el-switch v-model="prometheusFormData.enable_basic_auth" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="21" class="custom-col">
                <el-form-item>
                  <template #label>
                    <FormItemLabel
                      :label="tl('enablePushgateway')"
                      :desc="tl('enablePushgatewayDesc')"
                    />
                  </template>
                  <el-switch v-model="prometheusFormData.push_gateway.enable" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-collapse-transition>
              <el-row v-show="prometheusFormData.push_gateway.enable">
                <el-col :span="21" class="custom-col">
                  <el-form-item>
                    <template #label>
                      <FormItemLabel :label="tl('interval')" :desc="tl('dataReportingInterval')" />
                    </template>
                    <TimeInputWithUnitSelect v-model="prometheusFormData.push_gateway.interval" />
                  </el-form-item>
                </el-col>
                <el-col :span="21" class="custom-col">
                  <el-form-item>
                    <template #label>
                      <span>{{ tl('pushgatewayServer') }}</span>
                      <InfoTooltip>
                        <template #content>
                          {{ tl('pushgatewayDesc') }} <span>{{ tl('learn') }}</span>
                          <a
                            href="https://prometheus.io/docs/practices/pushing/#when-to-use-the-pushgateway"
                            target="_blank"
                            rel="noopener"
                          >
                            {{ tl('whenToUsePushgateway') }}
                          </a>
                        </template>
                      </InfoTooltip>
                    </template>
                    <el-input v-model="prometheusFormData.push_gateway.url" />
                  </el-form-item>
                </el-col>
                <el-col :span="21" class="custom-col">
                  <el-form-item>
                    <template #label>
                      <FormItemLabel :label="tl('jobName')" :desc="tl('jobNameDesc')" desc-marked />
                    </template>
                    <el-input v-model="prometheusFormData.push_gateway.job_name" />
                  </el-form-item>
                </el-col>
                <el-col :span="21" class="custom-col">
                  <el-form-item>
                    <template #label>
                      <FormItemLabel
                        :label="t('RuleEngine.headers')"
                        :desc="tl('headersDesc')"
                        desc-marked
                      />
                    </template>
                    <KeyAndValueEditor v-model="prometheusFormData.push_gateway.headers" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-transition>
          </template>
          <!-- OpenTelemetry -->
          <template v-if="selectedPlatform === 'OpenTelemetry'">
            <el-row>
              <el-col :span="21" class="custom-col">
                <el-form-item :label="tl('featureSelection')">
                  <el-checkbox
                    v-if="opentelemetryFormData.metrics"
                    v-model="opentelemetryFormData.metrics.enable"
                    :label="tl('metricsEnable')"
                    size="large"
                    border
                  />
                  <el-checkbox
                    v-if="opentelemetryFormData.traces"
                    v-model="opentelemetryFormData.traces.enable"
                    :label="tl('tracesEnable')"
                    size="large"
                    border
                  />
                  <el-checkbox
                    v-if="opentelemetryFormData.logs"
                    v-model="opentelemetryFormData.logs.enable"
                    :label="tl('logsEnable')"
                    size="large"
                    border
                  />
                </el-form-item>
              </el-col>
              <!-- Exporter -->
              <el-col v-if="opentelemetryFormData.exporter" :span="21" class="custom-col">
                <el-form-item :label="tl('endpoint')">
                  <el-input v-model="opentelemetryFormData.exporter.endpoint" />
                </el-form-item>
              </el-col>
              <!-- Exporter SSL Options -->
              <el-col v-if="opentelemetryFormData.exporter" :span="21" class="custom-col">
                <!-- Setting the key is to refresh the certificate content to the certificate path after updating the configuration. -->
                <CommonTLSConfig
                  :key="isDataLoading.toString()"
                  v-model="opentelemetryFormData.exporter.ssl_options"
                  :show-sni="false"
                  is-edit
                />
              </el-col>
              <!-- Metrics -->
              <el-col :span="21" v-if="opentelemetryFormData.metrics?.enable">
                <el-form-item :label="`${tl('metricsEnable')}${tl('exportInterval')}`">
                  <TimeInputWithUnitSelect v-model="opentelemetryFormData.metrics.interval" />
                </el-form-item>
              </el-col>
              <!-- Traces -->
              <template v-if="opentelemetryFormData.traces?.enable">
                <el-col :span="21">
                  <el-form-item>
                    <template #label>
                      <FormItemLabel
                        :label="tl('tracesFilterTracesAll')"
                        :desc="tl('tracesFilterTracesAllDesc')"
                      >
                      </FormItemLabel>
                    </template>
                    <el-switch
                      v-if="opentelemetryFormData.traces?.filter"
                      v-model="opentelemetryFormData.traces.filter.trace_all"
                    ></el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="21">
                  <el-form-item :label="`${tl('tracesEnable')}${tl('exportInterval')}`">
                    <TimeInputWithUnitSelect
                      v-model="opentelemetryFormData.traces.scheduled_delay"
                    />
                  </el-form-item>
                </el-col>
              </template>
              <!-- Logs -->
              <template v-if="opentelemetryFormData.logs?.enable">
                <el-col :span="21">
                  <el-form-item :label="tl('logsLevel')">
                    <el-select v-model="opentelemetryFormData.logs.level">
                      <el-option
                        v-for="level in openTelemetryLogLevels"
                        :key="level"
                        :label="level"
                        :value="level"
                      >
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="21">
                  <el-form-item :label="`${tl('logsEnable')}${tl('exportInterval')}`">
                    <TimeInputWithUnitSelect v-model="opentelemetryFormData.logs.scheduled_delay" />
                  </el-form-item>
                </el-col>
              </template>
            </el-row>
          </template>
          <el-col class="btn-col" :span="24">
            <el-button type="primary" :loading="isSubmitting" @click="submit">
              {{ $t('Base.saveChanges') }}
            </el-button>
            <el-button v-if="selectedPlatform === 'Prometheus'" @click="showPromSetup = true">
              {{ $t('Base.help') }}
            </el-button>
          </el-col>
        </el-form>
      </div>
    </el-card>
    <HelpDrawer v-model="showPromSetup" />
  </div>
</template>

<script setup lang="ts">
import { getOpenTelemetry, getPrometheus, setOpenTelemetry, setPrometheus } from '@/api/common'
import opentelemetryImg from '@/assets/img/opentelemetry.png'
import promImg from '@/assets/img/prom.png'
import { checkNOmitFromObj } from '@/common/tools'
import FormItemLabel from '@/components/FormItemLabel.vue'
import InfoTooltip from '@/components/InfoTooltip.vue'
import KeyAndValueEditor from '@/components/KeyAndValueEditor.vue'
import TimeInputWithUnitSelect from '@/components/TimeInputWithUnitSelect.vue'
import useConfFooterStyle from '@/hooks/useConfFooterStyle'
import useDataNotSaveConfirm from '@/hooks/useDataNotSaveConfirm'
import useI18nTl from '@/hooks/useI18nTl'
import { OpenTelemetry, Prometheus } from '@/types/dashboard'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEqual } from 'lodash'
import { Ref, computed, ref } from 'vue'
import { useStore } from 'vuex'
import HelpDrawer from './components/HelpDrawer.vue'
import useSSL from '@/hooks/useSSL'
import CommonTLSConfig from '@/components/TLSConfig/CommonTLSConfig.vue'

const PROMETHEUS = 'Prometheus'
const OPENTELEMETRY = 'OpenTelemetry'

const { tl, t } = useI18nTl('MonitoringIntegration')
const store = useStore()
const { createSSLForm } = useSSL()

const platformOpts = [
  {
    label: PROMETHEUS,
    value: PROMETHEUS,
    img: promImg,
  },
  {
    label: OPENTELEMETRY,
    value: OPENTELEMETRY,
    img: opentelemetryImg,
  },
]

const selectedPlatform = ref(platformOpts[0].value)
const showPromSetup = ref(false)
const prometheusFormData: Ref<Prometheus> = ref({
  collectors: {
    mnesia: 'disabled',
    vm_dist: 'disabled',
    vm_memory: 'disabled',
    vm_msacc: 'disabled',
    vm_statistics: 'disabled',
    vm_system_info: 'disabled',
  },
  enable_basic_auth: false,
  push_gateway: {
    headers: {
      Authorization: '',
    },
    interval: '15s',
    job_name: '',
    url: '',
    enable: false,
  },
})
const opentelemetryFormData = ref<OpenTelemetry>({
  metrics: {
    enable: false,
    interval: '10s',
  },
  logs: {
    level: 'warning',
    enable: false,
    scheduled_delay: '1s',
  },
  traces: {
    enable: false,
    filter: {
      trace_all: false,
    },
    scheduled_delay: '5s',
  },
  exporter: {
    endpoint: 'http://localhost:4317',
    ssl_options: createSSLForm(),
  },
})

const openTelemetryLogLevels = [
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency',
  'all',
]

const isDataLoading = ref(false)

let rawData: any = undefined
const nowRecordData = computed(() => ({
  prometheus: prometheusFormData.value,
  openTelemetry: opentelemetryFormData.value,
}))
const checkDataIsChanged = () => !isEqual(nowRecordData.value, rawData)
useDataNotSaveConfirm(checkDataIsChanged)
const updateRawDataForCompare = () => {
  rawData = cloneDeep(nowRecordData.value)
}

const loadIntegration = async function () {
  try {
    isDataLoading.value = true
    prometheusFormData.value = await getPrometheus()
  } catch (error) {
    //
  } finally {
    isDataLoading.value = false
  }
}
const isSubmitting = ref(false)

const updatePrometheus = async function () {
  try {
    isSubmitting.value = true
    await setPrometheus(prometheusFormData.value)
    updateRawDataForCompare()
    ElMessage.success(t('Base.updateSuccess'))
  } catch (error) {
    //
  } finally {
    loadIntegration()
    isSubmitting.value = false
  }
}

const loadOpentelemetry = async function () {
  try {
    isDataLoading.value = true
    opentelemetryFormData.value = await getOpenTelemetry()
  } catch (error) {
    //
  } finally {
    isDataLoading.value = false
  }
}

const updateOpentelemetry = async function () {
  try {
    await setOpenTelemetry(checkNOmitFromObj(opentelemetryFormData.value))
    ElMessage.success(t('Base.updateSuccess'))
  } catch (error) {
    //
  } finally {
    loadOpentelemetry()
    isSubmitting.value = false
  }
}

const submit = async () => {
  if (selectedPlatform.value === 'Prometheus') {
    await updatePrometheus()
  } else if (selectedPlatform.value === 'OpenTelemetry') {
    await updateOpentelemetry()
  }
}

const { addObserverToFooter } = useConfFooterStyle()
;(async () => {
  await Promise.allSettled([loadIntegration(), loadOpentelemetry()])
  updateRawDataForCompare()
  addObserverToFooter()
})()
</script>

<style lang="scss">
.monitoring-integration {
  .radio-form-item {
    width: 100%;
  }
  .platform-radio-group {
    margin-top: 8px;
    width: 100%;
    .el-row {
      width: 100%;
    }
  }
  .platform-radio {
    width: 100%;
    height: auto;
    &.el-radio.is-bordered {
      padding: 12px;
    }
    .el-radio__label {
      display: flex;
      align-items: center;
      padding: 0px;
    }
    .img-platform {
      margin-right: 8px;
      border-radius: 8px;
    }
    .platform-name {
      overflow: hidden;
      word-break: break-all;
      text-overflow: ellipsis;
      padding-left: 8px;
    }
  }
  .key-and-value-editor {
    width: 55%;
  }
  .ft {
    padding: 12px 12px + 12px + 4px;
  }
}
</style>
