<template>
  <div :id="chartId" :style="{ height: height, width: '100%' }"></div>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'

export default defineComponent({
  name: 'PolylineChart',
})
</script>

<script setup lang="ts">
import { defineProps, ref, watch, onMounted, PropType, Ref } from 'vue'
import * as echarts from 'echarts/lib/echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/grid'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/title'
import useEchartResize from '@/hooks/useEchartResize'
import Moment from 'moment'

const props = defineProps({
  chartId: {
    type: String,
    required: true,
  },
  yTitle: {
    type: Array as PropType<Array<string>>,
    default: () => [''],
  },
  chartColors: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  axisColor: {
    type: Object,
    default: () => ({
      colorAxisLine: '#757575',
      colorAxisLabel: '#757575',
    }),
  },
  chartData: {
    type: Array as PropType<Array<{ xData: Array<string>; yData: Array<number> }>>,
    default: () => [
      {
        xData: [],
        yData: [],
      },
    ],
  },
  height: {
    type: String,
    default: '190px',
  },
})

const seriesConfig: Ref<Array<any>> = ref([])
const chart: Ref<undefined | any> = shallowRef(undefined)
const { addListener } = useEchartResize()

watch(
  () => props.chartData,
  () => {
    drawChart()
  },
)

onMounted(() => {
  drawChart()
})

const NO_DATA_VALUE = -1
let noYAxisDataMap: Record<string, Array<string>> = {}

const storeNoDataXAxis = (yData: Array<number>, xData: Array<string>, title: string) => {
  yData.forEach((item, index) => {
    if (item === NO_DATA_VALUE) {
      if (!noYAxisDataMap[title]) {
        noYAxisDataMap[title] = []
      }
      noYAxisDataMap[title].push(xData[index])
    }
  })
}

const handleYAxisData = (arr: Array<number>) =>
  arr.map((item) => (item === NO_DATA_VALUE ? 0 : item))

const setSeriesConfig = () => {
  seriesConfig.value = []
  noYAxisDataMap = {}
  for (let i = 0; i < props.yTitle.length; i += 1) {
    let areaColor = i % 6 === 0 && i !== 0 ? props.chartColors[6] : props.chartColors[i % 6]
    storeNoDataXAxis(props.chartData[i].yData, props.chartData[i].xData, props.yTitle[i])
    seriesConfig.value.push({
      name: props.yTitle[i],
      type: 'line',
      smooth: true,
      symbolSize: 5,
      showSymbol: false,
      data: handleYAxisData(props.chartData[i].yData),
      step: false,
      lineStyle: {
        width: 2,
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: areaColor,
          },
          {
            offset: 1,
            color: `${areaColor}00`,
          },
        ]),
        opacity: 0.2,
      },
    })
  }
}

const _formatTime = (time: string, format = 'YYYY/MM/DD HH:mm') => {
  return Moment(parseInt(time)).format(format)
}

const createTooltip = (xAxis: string, title: string, val: number, color: string) => {
  const container = document.createElement('div')
  container.innerHTML = `
  <div class="polyline-chart-tooltip">
    <p class="x-value">${_formatTime(xAxis, 'MM/DD HH:mm:ss')}</p>
    <div class="tooltip-body">
      <div>
        <i class="badge" style="background-color:${color}"></i>
        <span>${title}</span>
      </div>
      <p class="num">${val}</p>
    </div>
  </div>
  `
  return container
}

const drawChart = () => {
  setSeriesConfig()
  let Dom = document.getElementById(props.chartId)

  if (!chart.value) {
    chart.value = echarts.init(Dom)
    addListener(chart.value)
  }
  const option = {
    color: props.chartColors,
    grid: {
      top: '5%',
      right: 30,
      bottom: '3%',
      left: 24,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params: Array<any>) => {
        if (!params[0]) {
          return ''
        }
        const { axisValue, color, seriesName, value } = params[0]
        let valueShowInTooltip = value
        if (noYAxisDataMap[seriesName]?.includes(axisValue)) {
          valueShowInTooltip = 'NaN'
        }
        return createTooltip(axisValue, seriesName, valueShowInTooltip, color)
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.chartData[0].xData,
      axisLine: {
        lineStyle: {
          color: props.axisColor.colorAxisLine,
        },
      },
      axisLabel: {
        hideOverlap: true,
        showMinLabel: true,
        color: props.axisColor.colorAxisLabel,
        formatter(value: string) {
          return `${_formatTime(value, 'MM/DD')} ${_formatTime(value, 'HH:mm')}`
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: props.axisColor.colorAxisLine,
        },
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        color: props.axisColor.colorAxisLabel,
      },
      minInterval: 1,
    },
    series: seriesConfig.value,
  }
  chart.value?.setOption(option)
}
</script>

<style lang="scss">
.polyline-chart-tooltip {
  min-width: 120px;
  p {
    margin-top: 0;
    margin-bottom: 0;
  }
  .x-value {
    margin-bottom: 4px;
  }
  .tooltip-body {
    display: flex;
    justify-content: space-between;
    .badge {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: #bbb;
    }
    .num {
      padding-left: 12px;
      font-weight: 500;
    }
  }
}
</style>
