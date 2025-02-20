<template>
  <div :id="`monaco-${id}`" class="monaco-view"></div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Monaco',
})
</script>

<script setup>
import * as monaco from 'monaco-editor'
import { defineProps, defineEmits, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useStore } from 'vuex'
import EditorDark from '@/assets/theme/editor-dark.json'

/**
 * for placeholder to show full desc
 */

const store = useStore()

const theme = computed(() => {
  return store.state.theme
})

const prop = defineProps({
  id: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
  },
  lang: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  hoverProvider: {
    type: Object,
  },
  completionProvider: {
    type: Object,
  },
  // warp: {
  //   type: Boolean,
  //   default: false,
  // },
  // provider: {
  //   type: Array,
  //   default: () => [],
  // },
  scrollLoading: {
    type: Boolean,
    default: false,
  },
  scrollFunc: {
    type: Function,
    default: () => () => ({}),
  },
  decorationFunc: {
    type: Function,
  },
  jsonWithoutValidate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'change'])

// ❗️ editor instance can not be reactive, otherwise it will cause the page to get stuck for unknown reasons
let editor = null

const setJSONValidate = () => {
  if (prop.lang === 'json') {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: !prop.jsonWithoutValidate,
    })
  }
}

const getTheme = () => {
  switch (theme.value) {
    case 'dark':
      return 'editor-dark'
    default:
      return 'vs'
  }
}

const defineTheme = () => {
  const dark = EditorDark
  monaco.editor.defineTheme('editor-dark', dark)
}

const registerProvider = () => {
  if (prop.hoverProvider) {
    monaco.languages.registerHoverProvider(prop.lang, prop.hoverProvider)
  }
  if (prop.completionProvider) {
    monaco.languages.registerCompletionItemProvider(prop.lang, prop.completionProvider)
  }
}

registerProvider()
defineTheme()

const initEditor = () => {
  const id = `monaco-${prop.id}`
  const ele = document.getElementById(id)
  if (!ele) {
    return
  }
  const defaultOptions = {
    value: prop.modelValue || '',
    language: prop.lang,
    readOnly: prop.disabled,
    fontSize: 13,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    theme: getTheme(),
    minimap: {
      enabled: false,
    },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
      alwaysConsumeMouseWheel: false,
    },
    // hover: {
    //   delay: 500,
    //   enabled: true,
    // },
  }
  setJSONValidate()
  editor = monaco.editor.create(ele, defaultOptions)
  editor.onDidChangeModelContent(async (event) => {
    const value = editor.getValue()
    if (value !== editor.modelValue) {
      emit('update:modelValue', value, event)
      emit('change', value)
    }
  })
  editor.onDidBlurEditorWidget(async (event) => {
    const value = editor.getValue()
    emit('blur', value)
  })
  // Update editor options
  const model = editor.getModel()
  if (model) {
    model.updateOptions({ tabSize: 2 })
  }
}

onMounted(() => {
  initEditor()
  if (prop.scrollLoading) editor.onDidScrollChange(prop.scrollFunc)
})

onUnmounted(() => {
  editor?.dispose()
})

watch(
  () => prop.modelValue,
  (val) => {
    if (val !== editor.getValue() && val) {
      editor.setValue(val)
    }
  },
)

watch(() => prop.completionProvider, registerProvider)

watch(
  () => prop.lang,
  async () => {
    editor?.dispose()
    await nextTick()
    initEditor()
  },
)
</script>

<style lang="scss">
.monaco-view {
  height: 100%;
  position: relative;
}
.my-inline-decoration {
  position: relative;
  left: 50px;
  color: #dadada !important;
  user-select: none;
}
.monaco-hover {
  z-index: 110;
}
.hover-contents {
  // Optional flag for function parameter explanation
  i {
    padding: 2px 4px;
    border: 1px solid var(--color-border-primary);
    margin-right: 2px;
    font-style: normal;
    white-space: nowrap;
    border-radius: 4px;
    background-color: var(--color-bg-split);
  }
}
</style>
