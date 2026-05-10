<script lang="ts" setup>
import type {
  DashboardLifecyclePlansDetail,
  DashboardShutdownPlanHistoryItem,
  DashboardShutdownPlanItem,
  DashboardShutdownPlanRunResult,
  DashboardShutdownPlanRunResultItem,
  DashboardUnattachedIpDeletePlan,
} from '#/api/admin';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  message,
  Modal,
  Space,
  Table,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDashboardLifecyclePlansApi,
  runDashboardOrphanAssetDeletePlanApi,
  runDashboardShutdownPlanOrderApi,
  runDashboardUnattachedIpDeletePlanApi,
} from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const runningOrderIds = reactive<Record<number, boolean>>({});
const runningIpAssetIds = reactive<Record<number, boolean>>({});
const detail = ref<DashboardLifecyclePlansDetail | null>(null);
const lastRunResult = ref<DashboardShutdownPlanRunResult | null>(null);
const failurePanelOpen = ref(false);
const expandedKeys = reactive<Record<string, boolean>>({});

const dueColumns = [
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  {
    title: '队列状态',
    dataIndex: 'queue_status_label',
    key: 'queue_status_label',
    width: 150,
  },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 180,
  },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 190 },
  {
    title: '服务到期',
    dataIndex: 'service_expires_at',
    key: 'service_expires_at',
    width: 180,
  },
  { title: '关机时间', dataIndex: 'suspend_at', key: 'suspend_at', width: 180 },
  { title: '删机时间', dataIndex: 'delete_at', key: 'delete_at', width: 180 },
  {
    title: '执行状态',
    dataIndex: 'execution_status',
    key: 'execution_status',
    width: 260,
  },
  {
    title: '云厂商',
    dataIndex: 'provider_label',
    key: 'provider_label',
    width: 140,
  },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' as const },
];

const historyColumns = [
  {
    title: '执行时间',
    dataIndex: 'executed_at',
    key: 'executed_at',
    width: 180,
  },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 180,
  },
  { title: '结果', dataIndex: 'result_label', key: 'result_label', width: 110 },
  {
    title: '删除来源',
    dataIndex: 'deletion_source_label',
    key: 'deletion_source_label',
    width: 140,
  },
  {
    title: '执行状态',
    dataIndex: 'execution_status',
    key: 'execution_status',
    width: 150,
  },
  {
    title: '失败原因',
    dataIndex: 'failure_reason',
    key: 'failure_reason',
    width: 320,
  },
  { title: '关机时间', dataIndex: 'suspend_at', key: 'suspend_at', width: 180 },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 190 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' as const },
];

const failureColumns = [
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 190 },
  {
    title: '队列状态',
    dataIndex: 'queue_status',
    key: 'queue_status',
    width: 140,
  },
  { title: '失败原因', dataIndex: 'error', key: 'error', width: 420 },
];

const ipDeleteColumns = [
  { title: 'IP', dataIndex: 'public_ip', key: 'public_ip', width: 150 },
  {
    title: '固定IP/资产',
    dataIndex: 'asset_name',
    key: 'asset_name',
    width: 220,
  },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'provider_status',
    key: 'provider_status',
    width: 150,
  },
  {
    title: '删除来源',
    dataIndex: 'deletion_source_label',
    key: 'deletion_source_label',
    width: 140,
  },
  { title: '计划释放', dataIndex: 'delete_at', key: 'delete_at', width: 180 },
  { title: '记录时间', dataIndex: 'logged_at', key: 'logged_at', width: 180 },
  {
    title: '执行状态',
    dataIndex: 'execution_status',
    key: 'execution_status',
    width: 420,
  },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' as const },
];

const summary = computed(() => detail.value);
const dueItems = computed(() => summary.value?.due_items || []);
const futurePlanItems = computed(() => summary.value?.future_plan_items || []);
const historyItems = computed(() =>
  (summary.value?.history_items || []).toSorted(
    (left, right) =>
      dayjs(right.executed_at || 0).valueOf() -
      dayjs(left.executed_at || 0).valueOf(),
  ),
);
const ipDeleteItems = computed(() => summary.value?.ip_delete_items || []);
function isIpDeletePending(item: DashboardUnattachedIpDeletePlan) {
  if (item.is_history) return false;
  if (item.is_overdue) return true;
  if (!item.delete_at) return false;
  const target = dayjs(item.delete_at);
  if (!target.isValid()) return false;
  return target.diff(dayjs(), 'day', true) <= 7;
}

const pendingIpDeleteItems = computed(() =>
  ipDeleteItems.value.filter((item: any) => isIpDeletePending(item)),
);
const futureIpDeleteItems = computed(() =>
  ipDeleteItems.value.filter(
    (item: any) => !item.is_history && !isIpDeletePending(item),
  ),
);
const ipDeleteHistoryItems = computed(() =>
  ipDeleteItems.value
    .filter((item: any) => item.is_history)
    .toSorted(
      (left: any, right: any) =>
        dayjs(right.logged_at || right.delete_at || 0).valueOf() -
        dayjs(left.logged_at || left.delete_at || 0).valueOf(),
    ),
);
const lastRunFailures = computed(() =>
  (lastRunResult.value?.items || []).filter((item) => !item.ok),
);
const lastRunFailureText = computed(() =>
  lastRunFailures.value
    .map(
      (item) =>
        `${item.ip || item.order_no}: ${item.error || '服务器删除失败'}`,
    )
    .join('\n'),
);

function fmtTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function fmtRecordTime(record: any, key: unknown) {
  return fmtTime(String(key || '') ? record[String(key)] : null);
}

function rowKey(
  record: { id: number | string; order_id?: null | number },
  index?: number,
) {
  return `${record.id || record.order_id || index || 0}`;
}

function isExpanded(key: string) {
  return Boolean(expandedKeys[key]);
}

function toggleExpanded(key: string) {
  expandedKeys[key] = !expandedKeys[key];
}

function shouldShowExpand(value?: null | string, threshold = 48) {
  return Boolean(value && value.length > threshold);
}

function queueColor(status?: string) {
  if (status === 'retry_failed') return 'error';
  if (status === 'due_now' || status === 'fallback_retry') return 'warning';
  if (status === 'within_window') return 'processing';
  return 'default';
}

function dueColor(value?: null | string, overdue?: boolean) {
  if (overdue) return 'error';
  if (!value) return 'default';
  const target = dayjs(value);
  if (!target.isValid()) return 'default';
  const hours = target.diff(dayjs(), 'hour');
  if (hours <= 0) return 'error';
  if (hours <= 24) return 'warning';
  if (hours <= 72) return 'processing';
  return 'default';
}

function resultColor(item: DashboardShutdownPlanHistoryItem) {
  return item.is_success ? 'success' : 'error';
}

function orderId(record: DashboardShutdownPlanItem) {
  return Number(record.order_id || 0) || 0;
}

function shutdownTargetId(record: DashboardShutdownPlanItem) {
  return record.item_type === 'orphan_asset'
    ? Number(record.asset_id || 0)
    : orderId(record);
}

function isRunning(record: DashboardShutdownPlanItem) {
  const id = shutdownTargetId(record);
  return id > 0 && Boolean(runningOrderIds[id]);
}

function executionText(record: { execution_status?: string; note?: string }) {
  return record.execution_status || record.note || '-';
}

function executionPlan(record: { execution_plan?: string }) {
  return record.execution_plan || '-';
}

function openPath(path?: string) {
  if (path) router.push(path).catch(() => {});
}

function goBack() {
  router.push('/admin/cloud-assets').catch(() => {});
}

async function loadData(options?: { silent?: boolean }) {
  if (!options?.silent) loading.value = true;
  try {
    detail.value = await getDashboardLifecyclePlansApi({ limit: 1000 });
  } catch (error: any) {
    message.error(error?.message || '计划加载失败');
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

function assetId(record: DashboardUnattachedIpDeletePlan) {
  return Number(record.id || 0) || 0;
}

function isRunningIp(record: DashboardUnattachedIpDeletePlan) {
  const id = assetId(record);
  return id > 0 && Boolean(runningIpAssetIds[id]);
}

async function runSingleIpDelete(record: DashboardUnattachedIpDeletePlan) {
  const id = assetId(record);
  if (!id || runningIpAssetIds[id]) return;
  runningIpAssetIds[id] = true;
  message.loading({
    content: `正在精准删除 IP ${record.public_ip || record.asset_name}...`,
    key: `ip-delete-run-${id}`,
    duration: 0,
  });
  try {
    const result = await runDashboardUnattachedIpDeletePlanApi(id);
    lastRunResult.value = result;
    if (result.failure_count > 0) {
      failurePanelOpen.value = true;
      message.error({
        content: result.items[0]?.error || 'IP 删除失败，请查看失败面板',
        key: `ip-delete-run-${id}`,
      });
    } else {
      message.success({ content: 'IP 删除完成', key: `ip-delete-run-${id}` });
    }
    await loadData({ silent: true });
  } catch (error: any) {
    message.error({
      content: error?.message || '执行 IP 删除失败',
      key: `ip-delete-run-${id}`,
    });
  } finally {
    runningIpAssetIds[id] = false;
  }
}

async function runSingleShutdown(record: DashboardShutdownPlanItem) {
  const id = shutdownTargetId(record);
  if (!id || runningOrderIds[id]) return;
  runningOrderIds[id] = true;
  message.loading({
    content: `正在删除服务器 ${record.ip || record.order_no || record.asset_name}...`,
    key: `shutdown-run-${id}`,
    duration: 0,
  });
  try {
    const result =
      record.item_type === 'orphan_asset'
        ? await runDashboardOrphanAssetDeletePlanApi(id)
        : await runDashboardShutdownPlanOrderApi(id);
    lastRunResult.value = result;
    if (result.failure_count > 0) {
      failurePanelOpen.value = true;
      message.error({
        content: result.items[0]?.error || '服务器删除失败，请查看失败面板',
        key: `shutdown-run-${id}`,
      });
    } else {
      message.success({ content: '服务器删除完成', key: `shutdown-run-${id}` });
    }
    await loadData({ silent: true });
  } catch (error: any) {
    message.error({
      content: error?.message || '执行服务器删除失败',
      key: `shutdown-run-${id}`,
    });
  } finally {
    runningOrderIds[id] = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    description="按删除 IP、删除服务器、删除计划和历史记录分区查看"
    title="删除计划"
  >
    <Space direction="vertical" style="width: 100%" :size="16">
      <Card :loading="loading">
        <template #title>
          <Space wrap>
            <Button size="small" @click="goBack">返回代理列表</Button>
            <Button size="small" :loading="loading" @click="loadData()">
              刷新
            </Button>
            <span>{{ summary?.task_label || '服务器删除计划' }}</span>
            <Tag color="processing">
              {{ summary?.status_label || '独立计划页' }}
            </Tag>
          </Space>
        </template>
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="下次执行">
            {{ fmtTime(summary?.next_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="上次执行">
            {{ fmtTime(summary?.last_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="7天内待删未附加IP">
            <Tag
              :color="
                (summary?.pending_ip_delete_count || 0) > 0
                  ? 'warning'
                  : 'success'
              "
            >
              {{ summary?.pending_ip_delete_count ?? 0 }} 条
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="待执行删除服务器">
            <Tag :color="(summary?.due_count || 0) > 0 ? 'warning' : 'success'">
              {{ summary?.due_count ?? 0 }} 条
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="IP未来计划">
            {{ futureIpDeleteItems.length }} 条
          </Descriptions.Item>
          <Descriptions.Item label="服务器未来计划">
            {{ summary?.shutdown_count ?? 0 }} 条
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时失败">
            <Tag
              :color="
                (summary?.recent_failure_count || 0) > 0 ? 'error' : 'success'
              "
            >
              {{ summary?.recent_failure_count ?? 0 }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="IP删除历史">
            {{ summary?.ip_delete_history_count ?? 0 }} 条
          </Descriptions.Item>
          <Descriptions.Item label="服务器删除历史">
            {{ summary?.server_delete_history_count ?? 0 }}
            条
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card v-if="lastRunFailures.length > 0" title="本次执行失败面板">
        <Alert
          type="error"
          show-icon
          :message="`本次执行失败 ${lastRunFailures.length} 条`"
          description="以下为刚刚手动执行产生的失败原因，方便直接定位处理。"
          style="margin-bottom: 12px"
        />
        <Table
          :columns="failureColumns"
          :data-source="lastRunFailures"
          :pagination="false"
          :row-key="rowKey"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'error'">
              <TypographyParagraph class="mb-0 break-all text-sm leading-6">
                {{
                  (record as DashboardShutdownPlanRunResultItem).error || '-'
                }}
              </TypographyParagraph>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="待执行删除IP（7天内）">
        <Table
          :columns="ipDeleteColumns"
          :data-source="pendingIpDeleteItems"
          :loading="loading"
          :pagination="false"
          :row-key="rowKey"
          :scroll="{ x: 1740 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'provider_status'">
              <Tag
                :color="
                  (record as DashboardUnattachedIpDeletePlan).is_overdue
                    ? 'error'
                    : 'warning'
                "
              >
                {{
                  (record as DashboardUnattachedIpDeletePlan).provider_status ||
                  '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'deletion_source_label'">
              <Tag color="blue">
                {{
                  (record as DashboardUnattachedIpDeletePlan)
                    .deletion_source_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'delete_at'">
              <Tag
                :color="
                  dueColor(
                    (record as DashboardUnattachedIpDeletePlan).delete_at,
                    (record as DashboardUnattachedIpDeletePlan).is_overdue,
                  )
                "
              >
                {{
                  fmtTime((record as DashboardUnattachedIpDeletePlan).delete_at)
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'logged_at'">
              {{
                fmtTime((record as DashboardUnattachedIpDeletePlan).logged_at)
              }}
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <TypographyParagraph
                class="mb-0 break-all text-xs leading-5"
                :ellipsis="{
                  rows: 2,
                  tooltip: executionText(
                    record as DashboardUnattachedIpDeletePlan,
                  ),
                }"
              >
                {{ executionText(record as DashboardUnattachedIpDeletePlan) }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Button
                  type="link"
                  size="small"
                  danger
                  :loading="
                    isRunningIp(record as DashboardUnattachedIpDeletePlan)
                  "
                  :disabled="
                    !assetId(record as DashboardUnattachedIpDeletePlan)
                  "
                  @click="
                    runSingleIpDelete(record as DashboardUnattachedIpDeletePlan)
                  "
                >
                  精准删除
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="
                    openPath(
                      (record as DashboardUnattachedIpDeletePlan).detail_path ||
                        (record as DashboardUnattachedIpDeletePlan)
                          .asset_detail_path,
                    )
                  "
                >
                  查看详情
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <Empty
          v-if="pendingIpDeleteItems.length === 0 && !loading"
          description="当前 7 天内没有待执行删除的 IP"
        />
      </Card>

      <Card title="待执行删除服务器（含失败待重试 / 过期兜底重试）">
        <Table
          :columns="dueColumns"
          :data-source="dueItems"
          :loading="loading"
          :pagination="false"
          :row-key="rowKey"
          :scroll="{ x: 1420 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'queue_status_label'">
              <div>
                <Tag
                  :color="
                    queueColor(
                      (record as DashboardShutdownPlanItem).queue_status,
                    )
                  "
                >
                  {{
                    (record as DashboardShutdownPlanItem).queue_status_label ||
                    '-'
                  }}
                </Tag>
                <TypographyParagraph
                  v-if="
                    (record as DashboardShutdownPlanItem).last_failure_reason
                  "
                  class="mb-0 mt-1 break-all text-xs leading-5"
                  :ellipsis="{
                    rows: 2,
                    tooltip: (record as DashboardShutdownPlanItem)
                      .last_failure_reason,
                  }"
                >
                  {{
                    (record as DashboardShutdownPlanItem).last_failure_reason
                  }}
                </TypographyParagraph>
              </div>
            </template>
            <template
              v-else-if="
                ['service_expires_at', 'suspend_at', 'delete_at'].includes(
                  String(column.key),
                )
              "
            >
              {{ fmtRecordTime(record, column.key) }}
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <div>
                <TypographyParagraph
                  class="mb-0 break-all text-xs leading-5"
                  :ellipsis="{
                    rows: 2,
                    tooltip:
                      (record as DashboardShutdownPlanItem).execution_status ||
                      '-',
                  }"
                >
                  {{
                    (record as DashboardShutdownPlanItem).execution_status ||
                    '-'
                  }}
                </TypographyParagraph>
                <div style="color: var(--color-text-secondary)" class="text-xs">
                  执行计划：{{
                    (record as DashboardShutdownPlanItem).execution_plan || '-'
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Button
                  type="link"
                  size="small"
                  danger
                  :loading="isRunning(record as DashboardShutdownPlanItem)"
                  :disabled="
                    !shutdownTargetId(record as DashboardShutdownPlanItem)
                  "
                  @click="
                    runSingleShutdown(record as DashboardShutdownPlanItem)
                  "
                >
                  精准删除
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="
                    openPath((record as DashboardShutdownPlanItem).related_path)
                  "
                >
                  详情
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <Empty
          v-if="dueItems.length === 0 && !loading"
          description="当前没有待执行删除的服务器"
        />
      </Card>

      <Card title="IP未来执行计划">
        <Table
          :columns="ipDeleteColumns"
          :data-source="futureIpDeleteItems"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          :row-key="rowKey"
          :scroll="{ x: 1740 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'provider_status'">
              <Tag color="processing">
                {{
                  (record as DashboardUnattachedIpDeletePlan).provider_status ||
                  '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'deletion_source_label'">
              <Tag color="blue">
                {{
                  (record as DashboardUnattachedIpDeletePlan)
                    .deletion_source_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'delete_at'">
              <Tag
                :color="
                  dueColor(
                    (record as DashboardUnattachedIpDeletePlan).delete_at,
                    (record as DashboardUnattachedIpDeletePlan).is_overdue,
                  )
                "
              >
                {{
                  fmtTime((record as DashboardUnattachedIpDeletePlan).delete_at)
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'logged_at'">
              {{
                fmtTime((record as DashboardUnattachedIpDeletePlan).logged_at)
              }}
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <div>
                <TypographyParagraph
                  class="mb-0 break-all text-xs leading-5"
                  :ellipsis="{
                    rows: 2,
                    tooltip: executionText(
                      record as DashboardUnattachedIpDeletePlan,
                    ),
                  }"
                >
                  {{ executionText(record as DashboardUnattachedIpDeletePlan) }}
                </TypographyParagraph>
                <div style="color: var(--color-text-secondary)" class="text-xs">
                  执行计划：{{
                    executionPlan(record as DashboardUnattachedIpDeletePlan)
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openPath(
                    (record as DashboardUnattachedIpDeletePlan).detail_path ||
                      (record as DashboardUnattachedIpDeletePlan)
                        .asset_detail_path,
                  )
                "
              >
                查看详情
              </Button>
            </template>
          </template>
        </Table>
        <Empty
          v-if="futureIpDeleteItems.length === 0 && !loading"
          description="当前没有 IP 未来执行计划"
        />
      </Card>

      <Card title="服务器未来执行计划">
        <Table
          :columns="dueColumns"
          :data-source="futurePlanItems"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          :row-key="rowKey"
          :scroll="{ x: 1420 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'queue_status_label'">
              <Tag
                :color="
                  queueColor((record as DashboardShutdownPlanItem).queue_status)
                "
              >
                {{
                  (record as DashboardShutdownPlanItem).queue_status_label ||
                  '-'
                }}
              </Tag>
            </template>
            <template
              v-else-if="
                ['service_expires_at', 'suspend_at', 'delete_at'].includes(
                  String(column.key),
                )
              "
            >
              {{ fmtRecordTime(record, column.key) }}
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <div>
                <TypographyParagraph
                  class="mb-0 break-all text-xs leading-5"
                  :ellipsis="{
                    rows: 2,
                    tooltip:
                      (record as DashboardShutdownPlanItem).execution_status ||
                      '-',
                  }"
                >
                  {{
                    (record as DashboardShutdownPlanItem).execution_status ||
                    '-'
                  }}
                </TypographyParagraph>
                <div style="color: var(--color-text-secondary)" class="text-xs">
                  执行计划：{{
                    (record as DashboardShutdownPlanItem).execution_plan || '-'
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openPath((record as DashboardShutdownPlanItem).related_path)
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="服务器删除历史记录">
        <Table
          :columns="historyColumns"
          :data-source="historyItems"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          :row-key="rowKey"
          :scroll="{ x: 1720 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'result_label'">
              <Tag
                :color="resultColor(record as DashboardShutdownPlanHistoryItem)"
              >
                {{ (record as DashboardShutdownPlanHistoryItem).result_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'deletion_source_label'">
              <Tag color="blue">
                {{
                  (record as DashboardShutdownPlanHistoryItem)
                    .deletion_source_label || '-'
                }}
              </Tag>
            </template>
            <template
              v-else-if="
                ['executed_at', 'service_expires_at', 'suspend_at'].includes(
                  String(column.key),
                )
              "
            >
              {{ fmtRecordTime(record, column.key) }}
            </template>
            <template v-else-if="column.key === 'failure_reason'">
              <TypographyParagraph
                v-if="
                  !(record as DashboardShutdownPlanHistoryItem).is_success &&
                  (record as DashboardShutdownPlanHistoryItem).failure_reason
                "
                class="mb-0 break-all text-xs leading-5"
                :ellipsis="{
                  rows: 2,
                  tooltip: (record as DashboardShutdownPlanHistoryItem)
                    .failure_reason,
                }"
              >
                {{
                  (record as DashboardShutdownPlanHistoryItem).failure_reason
                }}
              </TypographyParagraph>
              <span v-else>-</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                v-if="(record as DashboardShutdownPlanHistoryItem).related_path"
                type="link"
                size="small"
                @click="
                  openPath(
                    (record as DashboardShutdownPlanHistoryItem).related_path,
                  )
                "
              >
                详情
</Button><span v-else>-</span>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="IP删除历史记录">
        <Table
          :columns="ipDeleteColumns"
          :data-source="ipDeleteHistoryItems"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          :row-key="rowKey"
          :scroll="{ x: 1740 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'provider_status'">
              <Tag
                :color="
                  (record as DashboardUnattachedIpDeletePlan).is_overdue
                    ? 'error'
                    : 'warning'
                "
              >
                {{
                  (record as DashboardUnattachedIpDeletePlan).provider_status ||
                  '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'deletion_source_label'">
              <Tag color="blue">
                {{
                  (record as DashboardUnattachedIpDeletePlan)
                    .deletion_source_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'delete_at'">
              <Tag
                :color="
                  dueColor(
                    (record as DashboardUnattachedIpDeletePlan).delete_at,
                    (record as DashboardUnattachedIpDeletePlan).is_overdue,
                  )
                "
              >
                {{
                  fmtTime((record as DashboardUnattachedIpDeletePlan).delete_at)
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'logged_at'">
              {{
                fmtTime((record as DashboardUnattachedIpDeletePlan).logged_at)
              }}
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <div>
                <TypographyParagraph
                  :ellipsis="
                    isExpanded(
                      `ip-delete-${(record as DashboardUnattachedIpDeletePlan).id}`,
                    )
                      ? false
                      : {
                          rows: 2,
                          tooltip: executionText(
                            record as DashboardUnattachedIpDeletePlan,
                          ),
                        }
                  "
                  class="mb-0 break-all text-xs leading-5"
                >
                  {{ executionText(record as DashboardUnattachedIpDeletePlan) }}
                </TypographyParagraph>
                <div style="color: var(--color-text-secondary)" class="text-xs">
                  执行计划：{{
                    executionPlan(record as DashboardUnattachedIpDeletePlan)
                  }}
                </div>
                <Button
                  v-if="
                    shouldShowExpand(
                      executionText(record as DashboardUnattachedIpDeletePlan),
                    )
                  "
                  type="link"
                  size="small"
                  class="mt-1 h-auto px-0 py-0"
                  @click="
                    toggleExpanded(
                      `ip-delete-${(record as DashboardUnattachedIpDeletePlan).id}`,
                    )
                  "
                >
                  {{
                    isExpanded(
                      `ip-delete-${(record as DashboardUnattachedIpDeletePlan).id}`,
                    )
                      ? '收起'
                      : '展开'
                  }}
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openPath(
                    (record as DashboardUnattachedIpDeletePlan).detail_path ||
                      (record as DashboardUnattachedIpDeletePlan)
                        .asset_detail_path,
                  )
                "
              >
                查看详情
              </Button>
            </template>
          </template>
        </Table>
        <Empty
          v-if="ipDeleteHistoryItems.length === 0 && !loading"
          description="当前没有 IP 删除历史记录"
        />
      </Card>
    </Space>
    <Modal
      v-model:open="failurePanelOpen"
      title="服务器删除失败原因"
      width="760px"
      :footer="null"
    >
      <Alert
        type="error"
        show-icon
        :message="`失败 ${lastRunFailures.length} 条`"
        description="服务器删除执行已完成，以下 IP 失败，需要按原因处理后重试。"
        style="margin-bottom: 12px"
      />
      <TypographyParagraph
        :copyable="lastRunFailureText ? { text: lastRunFailureText } : false"
        class="mb-3 whitespace-pre-wrap break-all text-sm leading-6"
      >
        {{ lastRunFailureText || '暂无失败原因' }}
      </TypographyParagraph>
      <Table
        :columns="failureColumns"
        :data-source="lastRunFailures"
        :pagination="false"
        :row-key="rowKey"
        :scroll="{ x: 900 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'error'">
            <TypographyParagraph class="mb-0 break-all text-sm leading-6">
              {{ (record as DashboardShutdownPlanRunResultItem).error || '-' }}
            </TypographyParagraph>
          </template>
        </template>
      </Table>
    </Modal>
  </Page>
</template>
