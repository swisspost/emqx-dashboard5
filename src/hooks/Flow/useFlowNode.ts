import useBridgeTypeValue, {
  typesWithProducerAndConsumer,
  useBridgeTypeIcon,
} from '@/hooks/Rule/bridge/useBridgeTypeValue'
import { BridgeDirection, BridgeType, FilterLogicalOperator } from '@/types/enum'
import { RuleEvent } from '@/types/rule'
import { Edge, Node, Position } from '@vue-flow/core'
import { startCase } from 'lodash'
import useRuleEvents from '../Rule/rule/useRuleEvents'
import useRuleSourceEvents from '../Rule/rule/useRuleSourceEvents'
import useI18nTl from '../useI18nTl'

export type FlowData = Array<Node | Edge>

export const enum NodeType {
  Source,
  Processing,
  Sink,
}

export const SOURCE_SUFFIX = '_source'
export const SINK_SUFFIX = '_sink'

export const getSpecificTypeWithDirection = (
  type: BridgeType,
  direction: BridgeDirection,
): string => `${type}${direction === BridgeDirection.Ingress ? SOURCE_SUFFIX : SINK_SUFFIX}`

export const SourceType = {
  Message: 'message',
  Event: 'event',
  MQTTBroker: getSpecificTypeWithDirection(BridgeType.MQTT, BridgeDirection.Ingress),
}

export const enum ProcessingType {
  Filter = 'filter',
  Function = 'function',
}

export const SinkType = {
  HTTP: BridgeType.Webhook,
  MQTTBroker: getSpecificTypeWithDirection(BridgeType.MQTT, BridgeDirection.Egress),
  Console: 'console',
  RePub: 'republish',
}

export const enum FlowNodeType {
  Input = 'custom_input',
  Default = 'custom_default',
  Output = 'custom_output',
}

export interface FilterItem {
  field: string
  operator: string
  valueForComparison: string | number
}

export interface FunctionItem {
  id: string
  field: string
  func: {
    name: string
    args: Array<string | number>
  }
  alias: string
}

export const enum EditedWay {
  Form,
  SQL,
}

export type FunctionForm = {
  editedWay: EditedWay
  form: Array<FunctionItem>
  sql: string
}

export interface FilterFormData {
  groupOperator: FilterLogicalOperator
  // It can be used as the ID attribute for list elements, and can be used to
  // identify the source list and target list after a drag-and-drop operation.
  id: string
  items: Array<FilterItem | FilterFormData>
}

export interface FilterForm {
  editedWay: EditedWay
  sql: string
  form: FilterFormData
}

type PositionData =
  | { sourcePosition: Position; targetPosition?: undefined }
  | { targetPosition: Position; sourcePosition?: undefined }
  | { sourcePosition: Position; targetPosition: Position }

export default (): {
  nodeWidth: number
  nodeHeight: number
  getNodeClass: (type: NodeType) => string
  getFlowNodeHookPosition: (nodeType: FlowNodeType) => PositionData
  getTypeCommonData: (type: NodeType) => { type: FlowNodeType; class: string } & PositionData
  isBridgerNode: (node: Partial<Node>) => boolean
  removeDirectionFromSpecificType: (type: string) => string
  isBridgeType: (type: string) => boolean
  getTypeLabel: (specificType: string) => string
  getNodeInfo: (node: Node) => string
  getNodeIcon: (type: string, disabled?: boolean) => string
  getIconClass: (type: string) => string
} => {
  const { t, tl } = useI18nTl('Flow')

  /**
   * just record, not for setting
   */
  const nodeWidth = 200
  const nodeHeight = 60

  const nodeClassMap: Record<NodeType, string> = {
    [NodeType.Source]: 'node-source',
    [NodeType.Processing]: 'node-processing',
    [NodeType.Sink]: 'node-sink',
  }
  const getNodeClass = (type: NodeType) => nodeClassMap[type]

  const getFlowNodeHookPosition = (nodeType: FlowNodeType) => {
    if (nodeType === FlowNodeType.Input) {
      return { sourcePosition: Position.Right }
    }
    if (nodeType === FlowNodeType.Output) {
      return { targetPosition: Position.Left }
    }
    return { sourcePosition: Position.Right, targetPosition: Position.Left }
  }

  const typeMap = {
    [NodeType.Source]: FlowNodeType.Input,
    [NodeType.Processing]: FlowNodeType.Default,
    [NodeType.Sink]: FlowNodeType.Output,
  }
  const getTypeCommonData = (type: NodeType) => {
    const flowNodeType = typeMap[type]
    return {
      class: `node-item ${getNodeClass(type)}`,
      type: flowNodeType,
      ...getFlowNodeHookPosition(flowNodeType),
    }
  }

  const typeLabelMap = {
    [SourceType.Message]: t('RuleEngine.messages'),
    [SourceType.Event]: t('RuleEngine.event'),
    [SourceType.MQTTBroker]: t('RuleEngine.mqttBroker'),
    [ProcessingType.Function]: t('RuleEngine.dataProcessing'),
    [ProcessingType.Filter]: tl('filter'),
    [SinkType.HTTP]: t('RuleEngine.HTTPServer'),
    [SinkType.MQTTBroker]: t('RuleEngine.mqttBroker'),
    [SinkType.Console]: t('RuleEngine.consoleOutput'),
    [SinkType.RePub]: t('RuleEngine.republish'),
  }
  const { getBridgeLabelByTypeValue } = useBridgeTypeValue()
  const getTypeLabel = (specificType: string): string => {
    let ret: string | undefined = typeLabelMap[specificType]
    if (!ret && isBridgeType(specificType)) {
      ret = getBridgeLabelByTypeValue(removeDirectionFromSpecificType(specificType) as BridgeType)
    }
    return ret || specificType
  }

  const countFiltersNum = (filter: FilterFormData) => {
    return filter.items.reduce((count, item) => {
      if ('items' in item) {
        count += countFiltersNum(item)
      } else {
        count += 1
      }
      return count
    }, 0)
  }

  const { getEventLabel } = useRuleSourceEvents()
  const { getEventList } = useRuleEvents()
  let eventList: Array<RuleEvent> = []

  const initEventList = async () => {
    eventList = await getEventList()
  }
  initEventList()

  const isBridgerNode = ({ type, data }: Partial<Node>): boolean => {
    const { specificType } = data || {}
    return (
      (type === FlowNodeType.Input &&
        specificType !== SourceType.Message &&
        specificType !== SourceType.Event) ||
      (type === FlowNodeType.Output &&
        specificType !== SinkType.Console &&
        specificType !== SinkType.RePub)
    )
  }

  const removeDirectionFromSpecificType = (type: string) =>
    type.replace(new RegExp(`${SOURCE_SUFFIX}|${SINK_SUFFIX}`), '')

  const isNotBridgeTypes = [
    SourceType.Event,
    SourceType.Message,
    ProcessingType.Filter,
    ProcessingType.Function,
    SinkType.RePub,
    SinkType.Console,
  ]
  const isBridgeType = (type: string) => {
    const typeRemovedDirection = removeDirectionFromSpecificType(type)
    const isBridge = Object.entries(BridgeType).some(([, value]) => value === typeRemovedDirection)
    return !isNotBridgeTypes.includes(typeRemovedDirection) && isBridge
  }

  const getEventLabelFromVal = (val: string) => {
    if (!val || !eventList.length) {
      return ''
    }
    const target = eventList.find(({ event }) => event === val)
    return target ? startCase(getEventLabel(target.title)) : ''
  }

  const getFilterInfo = (filter: FilterForm) => {
    const num = countFiltersNum(filter.form)
    return `${num} ${t('Flow.condition', num)}`
  }

  // const getFunctionInfo = (func: FunctionForm) => {
  //   const num = func?.form?.length
  //   return num ? `${num} ${t('Flow.functionNum', num)}` : ''
  // }

  const getNodeInfo = (node: Node): string => {
    const { specificType, formData } = node.data
    if (!specificType || !formData) {
      return ''
    }
    switch (specificType) {
      case SourceType.Message:
        return `${t('Base.topic')}: ${formData.topic}`
      case SourceType.Event:
        return `${t('RuleEngine.event')}: ${getEventLabelFromVal(formData.event)}`
      case ProcessingType.Function:
        return ''
      case ProcessingType.Filter:
        return getFilterInfo(formData)
      case SinkType.Console:
        return ''
      case SinkType.RePub:
        return `${t('Base.topic')}: ${formData.args?.topic}`
      default:
        return `${t('Base.name')}: ${formData.name}`
    }
  }

  const adjustTypeForSpecialCases = (type: string): string => {
    if ([SourceType.MQTTBroker, SinkType.MQTTBroker].includes(type)) {
      return BridgeType.MQTT
    }

    const match = typesWithProducerAndConsumer.find((item) => type.includes(item))
    return match || type
  }
  /**
   * these types icon in @/assets/flowIcon
   * others in @/assets/img
   */
  const typesIconNew: Array<string> = [
    SourceType.Event,
    SourceType.Message,
    BridgeType.MQTT,
    ProcessingType.Filter,
    ProcessingType.Function,
    SinkType.Console,
    SinkType.RePub,
    SinkType.HTTP,
  ]
  const isTypeUsingNewIcon = (type: string) => typesIconNew.includes(type)
  const { getBridgeIcon } = useBridgeTypeIcon()
  const getNodeIcon = (type: string, disabled = false): string => {
    try {
      if (!type) {
        return ''
      }
      const adjustedType = adjustTypeForSpecialCases(type)
      const iconSuffix = disabled ? '-disabled' : ''

      if (isTypeUsingNewIcon(adjustedType)) {
        return require(`@/assets/flowIcon/${adjustedType}${iconSuffix}.png`)
      }
      if (isBridgeType(type)) {
        return getBridgeIcon(type)
      }
      return require(`@/assets/img/${adjustedType}${iconSuffix}.png`)
    } catch (error) {
      return ''
    }
  }

  // zoom in old icon for clip space padding
  const getIconClass = (type: string): string => {
    if (!type) {
      return ''
    }
    const adjustedType = adjustTypeForSpecialCases(type)
    return isTypeUsingNewIcon(adjustedType) ? '' : 'is-scaled-up'
  }

  return {
    nodeWidth,
    nodeHeight,
    getNodeClass,
    getFlowNodeHookPosition,
    getTypeCommonData,
    isBridgerNode,
    isBridgeType,
    removeDirectionFromSpecificType,
    getTypeLabel,
    getNodeInfo,
    getNodeIcon,
    getIconClass,
  }
}
