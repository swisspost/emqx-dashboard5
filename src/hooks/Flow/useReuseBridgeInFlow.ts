import { useBridgeDirection, useBridgeTypeValue } from '@/hooks/Rule/bridge/useBridgeTypeValue'
import { BridgeDirection, BridgeType } from '@/types/enum'
import { BridgeItem } from '@/types/rule'
import { groupBy } from 'lodash'
import { ComputedRef, Ref, computed, ref } from 'vue'
import useHandleActionItem from '../Rule/action/useHandleActionItem'
import useMixedActionList from '../Rule/action/useMixedActionList'

type GroupedBridgeMap = { [key in BridgeType]?: Array<BridgeItem> }

export default (
  type: BridgeType,
  props: any,
  record: any,
  direction?: BridgeDirection,
): {
  isCreateBridgeInFlow: ComputedRef<any>
  isBridgeSelected: Ref<boolean>
  getBridgesInSameType: () => BridgeItem[]
  handleNameChange: (name: string) => void
} => {
  let getBridgeRequest: undefined | Promise<Array<BridgeItem>> = undefined
  const groupedBridgeMap: Ref<GroupedBridgeMap> = ref({})

  const isCreateBridgeInFlow: ComputedRef<boolean> = computed(
    () => props.isUsingInFlow && !props.edit && !props.readonly,
  )

  const { getBridgeGeneralType } = useBridgeTypeValue()
  const { getMixedActionList } = useMixedActionList()
  const getBridges = async () => {
    try {
      getBridgeRequest = getMixedActionList()
      const bridges = await getBridgeRequest
      groupedBridgeMap.value = groupBy(bridges, ({ type }) => getBridgeGeneralType(type))
    } catch (error) {
      console.error(error)
    }
  }

  const { judgeBridgeDirection } = useBridgeDirection()
  /**
   * @param type For mqtt, the direction needs to be specified
   * For consumer and producer separate types, the direction needs to be specified
   * For types where versions are separate (e.g., redis and mongo), a generic type
   */
  const getBridgesInSameType = () => {
    if (!type) {
      return []
    }
    const list = groupedBridgeMap.value[type] || []

    if (type === BridgeType.MQTT && direction !== undefined) {
      return list.filter((item) => judgeBridgeDirection(item) === direction)
    }

    return list
  }

  const getBridgeByName = (name: string) => {
    const bridges = getBridgesInSameType()
    return bridges?.find((item) => item.name === name)
  }

  const isBridgeSelected = ref(false)

  const { handleActionDataAfterLoaded } = useHandleActionItem()

  const handleNameChange = (name: string) => {
    return
    // const bridge = !!name && getBridgeByName(name)
    // if (bridge) {
    //   isBridgeSelected.value = true
    //   record.value = handleActionDataAfterLoaded(cloneDeep(bridge))
    // } else {
    //   isBridgeSelected.value = false
    // }
  }

  if (isCreateBridgeInFlow.value) {
    getBridges()
  }

  return {
    isCreateBridgeInFlow,
    isBridgeSelected,
    getBridgesInSameType,
    handleNameChange,
  }
}
