<template>
  <div class="left-bar" :style="{ width: leftBarCollapse ? '80px' : '200px' }">
    <el-scrollbar>
      <el-menu
        :default-active="defaultSelectedKeys"
        :collapse="leftBarCollapse"
        router
        :collapse-transition="false"
      >
        <template v-for="(menu, i) in menus" :key="menu.title">
          <el-sub-menu
            v-if="menu.children"
            :index="'' + i"
            :key="i"
            :popper-class="needFixedHeight(menu) ? 'sub-menu-popper' : ''"
          >
            <template #title>
              <i v-show="leftBarCollapse" :class="['iconfont', menu.icon]"></i>
              <p class="menu-item-title first-level">
                {{ $t(`components.${menu.title}`) }}
              </p>
            </template>
            <el-scrollbar>
              <template v-for="item in menu.children" :key="item.title">
                <el-menu-item v-if="!item.children" :index="item.path">
                  <template #title>
                    <p class="menu-item-title">
                      {{ $t(`components.${item.title}`) }}
                    </p>
                  </template>
                </el-menu-item>
                <el-menu-item-group v-else>
                  <template #title>
                    <p class="menu-item-title group-name">{{ $t(`components.${item.title}`) }}</p>
                  </template>
                  <el-menu-item
                    v-for="level3Item in item.children"
                    :index="level3Item.path"
                    :key="level3Item.title"
                  >
                    <template #title>
                      <p class="menu-item-title">
                        {{ $t(`components.${level3Item.title}`) }}
                      </p>
                    </template>
                  </el-menu-item>
                </el-menu-item-group>
              </template>
            </el-scrollbar>
          </el-sub-menu>
          <el-menu-item v-else :key="menu.title" :index="menu.path">
            <i v-show="leftBarCollapse" :class="['iconfont', menu.icon]"></i>
            <p class="menu-item-title first-level">
              {{ $t(`components.${menu.title}`) }}
            </p>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

interface Menu {
  title: string
  path?: string
  icon?: string
  children?: Menu[]
}

export default defineComponent({
  name: 'Leftbar',
  setup() {
    const menus = ref<Menu[]>([])
    const store = useStore()
    const route = useRoute()
    const leftBarCollapse = computed(() => {
      return store.state.leftBarCollapse
    })
    const theme = computed(() => {
      return store.state.theme
    })
    const defaultSelectedKeys = computed(() => {
      const { path } = route
      return `/${path.split('/')[1]}`
    })

    const headerHeight = 62
    const menuItemHeight = 56
    const needFixedHeight = ({ children }: Menu) => {
      const totalH =
        children?.reduce((totalHeight, { children }) => {
          if (children) {
            return (totalHeight += headerHeight + children.length * menuItemHeight)
          }
          return (totalHeight += menuItemHeight)
        }, 0) || 0
      // 740 is the max height of window to fixed height
      return totalH > 740
    }

    const monitoring = [
      { title: 'dashboard', path: '/dashboard' },
      { title: 'clients', path: '/clients' },
      { title: 'subscriptions', path: '/subscriptions' },
      { title: 'retained', path: '/retained' },
      { title: 'delayed-pub', path: '/delayed-pub' },
      { title: 'alarm', path: '/alarm' },
    ]

    const accessControl = [
      { title: 'authentication', path: '/authentication' },
      { title: 'authorization', path: '/authorization' },
      { title: 'banned-clients', path: '/banned-clients' },
      { title: 'flapping-detect', path: '/flapping-detect' },
    ]

    const management = [
      {
        title: 'clusterSettings',
        children: [
          { title: 'mqtt', path: '/mqtt' },
          { title: 'listener', path: '/listener' },
          { title: 'log', path: '/log' },
          { title: 'monitoring', path: '/monitoring' },
          // { title: 'limiter', path: '/limiter' },
        ],
      },
      {
        title: 'advancedMQTT',
        children: [
          { title: 'topic-rewrite', path: '/topic-rewrite' },
          { title: 'auto-sub', path: '/auto-sub' },
          { title: 'delayed-pub', path: '/delayed-pub-configuration' },
        ],
      },
      {
        title: 'extensions',
        children: [
          { title: 'gateway', path: '/gateway' },
          { title: 'exhook', path: '/exhook' },
          { title: 'plugins', path: '/plugins' },
        ],
      },
    ]

    const integration = [
      { title: 'webhook', path: '/webhook' },
      { title: 'flowDesigner', path: '/flow' },
      { title: 'rules', path: '/rule' },
      { title: 'connector', path: '/connector' },
    ]

    const diagnose = [
      { title: 'websocket', path: '/websocket' },
      { title: 'topic-metrics', path: '/topic-metrics' },
      { title: 'slow-sub', path: '/slow-sub' },
      { title: 'log-trace', path: '/log-trace' },
    ]

    const system = [
      { title: 'users', path: '/users' },
      { title: 'api-key', path: '/api-key' },
    ]

    menus.value = [
      {
        title: 'monitoring',
        icon: 'icon-monitoring',
        children: monitoring,
      },
      {
        title: 'auth',
        icon: 'icon-authentication',
        children: accessControl,
      },
      {
        title: 'ruleengine',
        icon: 'icon-integration',
        children: integration,
      },
      {
        title: 'management',
        icon: 'icon-configuration',
        children: management,
      },
      {
        title: 'diagnose',
        icon: 'icon-diagnosis',
        children: diagnose,
      },
      {
        title: 'system',
        icon: 'icon-system',
        children: system,
      },
    ]
    return {
      store,
      theme,
      leftBarCollapse,
      defaultSelectedKeys,
      menus,
      needFixedHeight,
    }
  },
})
</script>

<style lang="scss">
.left-bar {
  transition: all 0.3s;
  height: 100%;
  padding: 64px 0;
  background-color: var(--color-bg);
  // border-right: 1px solid var(--color-border-card);
  .el-menu:not(.el-menu--horizontal, .el-menu--popup) .menu-item-title {
    white-space: nowrap;
  }
  .menu-item-title.group-name {
    position: relative;
    left: -23px;
  }
  .el-menu.el-menu--collapse {
    width: 80px;
    .menu-item-title {
      padding-left: 26px;
      opacity: 0;
      left: 0;
    }
    .el-sub-menu {
      .menu-item-title {
        padding-left: 26px;
      }
    }
    & i {
      margin-left: 6px;
    }
  }
  .el-scrollbar {
    .el-scrollbar__wrap {
      overflow-x: hidden;
    }
    .el-scrollbar__bar.is-horizontal {
      display: none;
    }
  }
  .icon.menu-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
}
.sub-menu-popper {
  // set padding right when collapsing
  .el-menu-item-group__title {
    padding-right: 20px;
  }
}
@media screen and (max-height: 740px) {
  .sub-menu-popper {
    .el-menu {
      height: 90vh;
    }
  }
}
</style>
