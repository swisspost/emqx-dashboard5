/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import http from '@/common/http'
import { pick } from 'lodash'

export function listClients(params = {}) {
  return http.get('/clients', { params })
}

export function searchClients(clientId: string) {
  return http.get(`/clients/${encodeURIComponent(clientId)}`)
}

// 搜索单个节点的连接
export function searchNodeClients(nodeName: string, clientId: string) {
  return http.get(`/nodes/${nodeName}/clients/${encodeURIComponent(clientId)}`)
}

export function disconnectClient(clientId: string) {
  return http.delete(`/clients/${encodeURIComponent(clientId)}`)
}

export function batchDisconnectClients(clientIds: string[]) {
  return http.post('/clients/kickout/bulk', clientIds)
}

export async function loadClientDetail(clientId: string) {
  return http.get(`/clients/${encodeURIComponent(clientId)}`, { errorsHandleCustom: [404] })
}

export function loadSubscriptions(clientId: string) {
  return http.get(`/clients/${encodeURIComponent(clientId)}/subscriptions`)
}

export function unsubscribe(clientId: string, topic: string) {
  if (null == topic) return
  return http.post(`/clients/${encodeURIComponent(clientId)}/unsubscribe`, { topic })
}

export function subscribe(
  clientId: string,
  topic: { qos: number; topic: string; nl?: 1 | 0; rap?: 1 | 0; rh?: 2 | 1 | 0 },
) {
  const topicData = pick(topic, ['qos', 'topic', 'nl', 'rap', 'rh'])
  return http.post(`/clients/${encodeURIComponent(clientId)}/subscribe`, topicData)
}
