<template>
  <div class="rule-metrics">
    <el-tooltip :content="t('Base.refresh')" placement="top">
      <el-button class="icon-button" type="primary" :icon="Refresh" @click="handleRefresh">
      </el-button>
    </el-tooltip>
  </div>
  <h1><pre>RULE METRICS</pre></h1>
</template>

<script setup lang="ts">
import useI18nTl from '@/hooks/useI18nTl'
import { Refresh } from '@element-plus/icons-vue'
import {} from 'vue'

const { t, tl } = useI18nTl('RuleEngine')

const handleRefresh = () => {
  // TODO:
}
</script>

<style lang="scss"></style>
