<template>
  <el-button ref="ButtonCom" class="advanced-settings-btn" type="primary" link @click="toggle">
    {{ tl('advancedSettings') }}
    <el-icon :class="{ 'is-rotate': modelValue }"><ArrowRight /></el-icon>
  </el-button>
</template>

<script setup lang="ts">
import useI18nTl from '@/hooks/useI18nTl'
import { ArrowRight } from '@element-plus/icons-vue'
import { defineEmits, defineProps, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue'])

const { tl } = useI18nTl('RuleEngine')

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}

/**
 * for remove disabled prop inherit from form component...
 */
const ButtonCom = ref()
onMounted(() => {
  try {
    const el = ButtonCom.value.$el
    el?.removeAttribute('disabled')
    el?.removeAttribute('aria-disabled')
    el?.classList?.remove?.('is-disabled')
  } catch (error) {
    console.error(error)
  }
})
</script>

<style lang="scss">
.advanced-settings-btn {
  &.el-button.is-link {
    padding-left: 0;
    padding-right: 0;
  }
  margin-top: 8px;
  margin-bottom: 24px;
  .el-icon {
    margin-left: 4px;
    transition: transform 0.3s;
    color: var(--color-text-placeholder);
    &.is-rotate {
      transform: rotate(90deg);
    }
  }
}
</style>
