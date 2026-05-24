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
  Input,
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
  refreshDashboardLifecyclePlansApi,
  updateDashboardLifecyclePlanNoteApi,
} from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const refreshingPlanTable = ref(false);
const planLimit = ref(50);
const detail = ref<DashboardLifecyclePlansDetail | null>(null);
const lastRunResult = ref<DashboardShutdownPlanRunResult | null>(null);
const failurePanelOpen = ref(false);
const expandedKeys = reactive<Record<string, boolean>>({});
const tablePagination = { defaultPageSize: 20, showSizeChanger: true };
const noteModalOpen = ref(false);
const noteSaving = ref(false);
const noteValue = ref('');
const noteTarget = ref<
  DashboardShutdownPlanItem | DashboardUnattachedIpDeletePlan | null
>(null);
const notePreviewOpen = ref(false);
const notePreviewTitle = ref('备注详情');
const notePreviewValue = ref('');

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
  { title: '备注', dataIndex: 'note', key: 'note', width: 220 },
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
    title: '真实状态',
    dataIndex: 'resource_state_label',
    key: 'resource_state_label',
    width: 240,
  },
  {
    title: '计划状态',
    dataIndex: 'plan_state_label',
    key: 'plan_state_label',
    width: 160,
  },
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
  { title: '备注', dataIndex: 'note', key: 'note', width: 220 },
  {
    title: '状态',
    dataIndex: 'provider_status',
    key: 'provider_status',
    width: 150,
  },
  {
    title: '真实状态',
    dataIndex: 'resource_state_label',
    key: 'resource_state_label',
    width: 240,
  },
  {
    title: '计划状态',
    dataIndex: 'plan_state_label',
    key: 'plan_state_label',
    width: 160,
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
    width: 360,
  },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const },
];

const summary = computed(() => detail.value);
const shutdownPlanItems = computed(() =>
  sortActivePlans(summary.value?.shutdown_items || []),
);
const historyItems = computed(() =>
  (summary.value?.history_items || []).toSorted(
    (left, right) =>
      dayjs(right.executed_at || 0).valueOf() -
      dayjs(left.executed_at || 0).valueOf(),
  ),
);
const ipDeleteItems = computed(() => summary.value?.ip_delete_items || []);
const ipDeletePlanItems = computed(() =>
  sortActivePlans(ipDeleteItems.value.filter((item: any) => !item.is_history)),
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

function planTimeValue(record: any) {
  const raw =
    record?.delete_at ||
    record?.next_run_at ||
    record?.suspend_at ||
    record?.service_expires_at ||
    record?.logged_at ||
    '';
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.valueOf() : Number.MAX_SAFE_INTEGER;
}

function planTimeBucket(record: any) {
  const raw =
    record?.delete_at ||
    record?.next_run_at ||
    record?.suspend_at ||
    record?.service_expires_at ||
    '';
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '';
}

function planUserKey(record: any) {
  return String(
    record?.user_id ||
      record?.tg_user_id ||
      record?.user_display_name ||
      record?.username_label ||
      '',
  ).toLowerCase();
}

function sortActivePlans<T extends Record<string, any>>(items: T[]) {
  return items.toSorted((left, right) => {
    const timeDiff = planTimeValue(left) - planTimeValue(right);
    if (timeDiff !== 0) return timeDiff;
    const userDiff = planUserKey(left).localeCompare(planUserKey(right));
    if (userDiff !== 0) return userDiff;
    const bucketDiff = planTimeBucket(left).localeCompare(
      planTimeBucket(right),
    );
    if (bucketDiff !== 0) return bucketDiff;
    return String(
      left.id || left.asset_id || left.order_id || '',
    ).localeCompare(String(right.id || right.asset_id || right.order_id || ''));
  });
}

function fmtRecordTime(record: any, key: unknown) {
  return fmtTime(String(key || '') ? record[String(key)] : null);
}

function recordTimeColor(record: any, key: unknown) {
  const value = String(key || '') ? record[String(key)] : null;
  return dueColor(value, Boolean(value && dayjs(value).isBefore(dayjs())));
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
  const hours = target.diff(dayjs(), 'hour', true);
  if (hours <= 0) return 'red';
  if (hours <= 12) return 'red';
  if (hours <= 24) return 'volcano';
  if (hours <= 72) return 'orange';
  if (hours <= 168) return 'gold';
  if (hours <= 360) return 'lime';
  if (hours <= 720) return 'green';
  if (hours <= 1440) return 'cyan';
  return 'blue';
}

function resultColor(item: DashboardShutdownPlanHistoryItem) {
  return item.is_success ? 'success' : 'error';
}

function resourceStateColor(state?: string) {
  if (
    [
      'cloud_missing',
      'instance_deleted',
      'instance_deleted_ip_retained',
    ].includes(String(state || ''))
  )
    return 'success';
  if (String(state || '') === 'missing_confirming') return 'warning';
  if (String(state || '') === 'fixed_ip_unattached') return 'processing';
  if (String(state || '') === 'instance_present') return 'error';
  return 'default';
}

function planStateColor(state?: string) {
  if (String(state || '') === 'completed') return 'success';
  if (['blocked', 'shutdown_disabled'].includes(String(state || '')))
    return 'warning';
  if (String(state || '') === 'scheduled') return 'processing';
  if (String(state || '') === 'pending') return 'error';
  return 'default';
}

function executionText(record: { execution_status?: string; note?: string }) {
  return record.execution_status || record.note || '-';
}

function executionPlan(record: { execution_plan?: string }) {
  return record.execution_plan || '-';
}

function planNote(record: {
  display_note?: null | string;
  note?: null | string;
  source_note?: null | string;
}) {
  return record.display_note || record.note || record.source_note || '-';
}

function compactCellText(text?: null | string) {
  return String(text || '-')
    .replaceAll(/\s*\n+\s*/g, ' / ')
    .replaceAll(/\s{2,}/g, ' ')
    .trim();
}

function expandedCellKey(
  prefix: string,
  record: { id: number | string; order_id?: null | number },
) {
  return `${prefix}-${rowKey(record)}`;
}

function cellEllipsis(
  prefix: string,
  record: { id: number | string; order_id?: null | number },
  text?: null | string,
  rows = 2,
) {
  return isExpanded(expandedCellKey(prefix, record))
    ? false
    : { rows, tooltip: text || '-' };
}

function shouldShowCellExpand(
  text?: null | string,
  extraText?: null | string,
  threshold = 48,
) {
  return Boolean(`${text || ''}${extraText || ''}`.length > threshold);
}

function openNotePreview(
  record: DashboardShutdownPlanItem | DashboardUnattachedIpDeletePlan,
) {
  const targetIp = String(
    (record as any).ip || (record as any).public_ip || '',
  ).trim();
  notePreviewTitle.value = `备注详情${targetIp ? ` · ${targetIp}` : ''}`;
  notePreviewValue.value = planNote(record);
  notePreviewOpen.value = true;
}

function openNoteEditor(
  record: DashboardShutdownPlanItem | DashboardUnattachedIpDeletePlan,
) {
  noteTarget.value = record;
  noteValue.value = record.note || '';
  noteModalOpen.value = true;
}

async function savePlanNote() {
  const target = noteTarget.value;
  if (!target || noteSaving.value) return;
  const payload: {
    asset_id?: number;
    id?: number | string;
    item_type?: string;
    note: string;
    order_id?: number;
  } = {
    item_type: (target as DashboardShutdownPlanItem).item_type || 'asset',
    note: noteValue.value,
  };
  const orderTarget = target as DashboardShutdownPlanItem;
  if (orderTarget.item_type === 'order') {
    payload.order_id = Number(orderTarget.order_id || 0);
  } else {
    payload.asset_id = Number(
      orderTarget.asset_id ||
        (target as DashboardUnattachedIpDeletePlan).id ||
        0,
    );
    payload.id = (target as DashboardUnattachedIpDeletePlan).id;
  }
  noteSaving.value = true;
  try {
    const result = await updateDashboardLifecyclePlanNoteApi(payload);
    target.note = result.note || '';
    target.display_note = result.display_note || '';
    message.success('备注已保存');
    noteModalOpen.value = false;
    await loadData({ silent: true });
  } catch (error: any) {
    message.error(error?.message || '备注保存失败');
  } finally {
    noteSaving.value = false;
  }
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
    detail.value = await getDashboardLifecyclePlansApi({
      limit: planLimit.value,
    });
  } catch (error: any) {
    message.error(error?.message || '计划加载失败');
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadMorePlans() {
  planLimit.value += 50;
  await loadData();
}

async function refreshPlanTable() {
  refreshingPlanTable.value = true;
  try {
    const result = await refreshDashboardLifecyclePlansApi({
      limit: planLimit.value,
    });
    const activeCount =
      result.source_asset_count ??
      result.shutdown_count ??
      result.due_count + result.future_count;
    message.success(`删除计划已刷新：${activeCount} 条`);
    await loadData({ silent: true });
  } catch (error: any) {
    message.error(error?.message || '刷新删机计划失败');
  } finally {
    refreshingPlanTable.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    class="plans-page"
    description="按代理列表资产生成统一删除计划，并查看执行历史"
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
            <Button
              size="small"
              :loading="refreshingPlanTable"
              @click="refreshPlanTable"
            >
              刷新计划表
            </Button>
            <Button size="small" :loading="loading" @click="loadMorePlans">
              加载更多
            </Button>
            <span>{{ summary?.task_label || '删除计划' }}</span>
            <Tag color="processing">
              {{ summary?.status_label || '独立计划页' }}
            </Tag>
            <Tag :color="refreshingPlanTable ? 'warning' : 'default'">
              {{
                refreshingPlanTable
                  ? '计划表刷新中'
                  : `最后刷新：${fmtTime(summary?.last_refresh_at)}`
              }}
            </Tag>
          </Space>
        </template>
        <Alert
          type="info"
          show-icon
          :message="`当前按 ${planLimit} 条分批加载；数据很多时可继续加载更多。`"
          style="margin-bottom: 12px"
        />
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="下次执行">
            {{ fmtTime(summary?.next_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="上次执行">
            {{ fmtTime(summary?.last_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="计划表最后刷新">
            {{ fmtTime(summary?.last_refresh_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="刷新状态">
            <Tag :color="refreshingPlanTable ? 'warning' : 'success'">
              {{ refreshingPlanTable ? '刷新中' : '空闲' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前删除计划">
            {{ summary?.source_asset_count ?? 0 }} 条
          </Descriptions.Item>
          <Descriptions.Item label="缺少到期时间">
            <Tag
              :color="
                (summary?.missing_expiry_count || 0) > 0 ? 'warning' : 'success'
              "
            >
              {{ summary?.missing_expiry_count ?? 0 }} 条
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="未附加IP">
            <Tag
              :color="
                (summary?.unattached_ip_count || 0) > 0 ? 'warning' : 'success'
              "
            >
              {{ summary?.unattached_ip_count ?? 0 }} 条
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="服务器资产">
            {{ summary?.server_asset_count ?? 0 }} 条
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
          :pagination="tablePagination"
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

      <Card :title="`服务器删机计划（${shutdownPlanItems.length}）`">
        <Table
          class="plans-compact-table"
          size="small"
          :columns="dueColumns"
          :data-source="shutdownPlanItems"
          :loading="loading"
          :pagination="tablePagination"
          :row-key="rowKey"
          :scroll="{ x: 1680 }"
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
            <template v-else-if="column.key === 'user_display_name'">
              <div>
                <div>{{ (record as any).user_display_name || '-' }}</div>
                <div
                  v-if="(record as any).username_label"
                  style="color: var(--color-text-secondary)"
                  class="text-xs"
                >
                  {{ (record as any).username_label }}
                </div>
              </div>
            </template>
            <template
              v-else-if="
                ['service_expires_at', 'suspend_at', 'delete_at'].includes(
                  String(column.key),
                )
              "
            >
              <Tag :color="recordTimeColor(record, column.key)">
                {{ fmtRecordTime(record, column.key) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'resource_state_label'">
              <Tag
                :color="
                  resourceStateColor(
                    (record as DashboardShutdownPlanItem).resource_state,
                  )
                "
              >
                {{
                  (record as DashboardShutdownPlanItem).resource_state_label ||
                  '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'plan_state_label'">
              <div>
                <Tag
                  :color="
                    planStateColor(
                      (record as DashboardShutdownPlanItem).plan_state,
                    )
                  "
                >
                  {{
                    (record as DashboardShutdownPlanItem).plan_state_label ||
                    '-'
                  }}
                </Tag>
                <TypographyParagraph
                  v-if="(record as DashboardShutdownPlanItem).blocked_reason"
                  class="mb-0 mt-1 break-all text-xs leading-5"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="
                    cellEllipsis(
                      'shutdown-plan-state',
                      record as DashboardShutdownPlanItem,
                      (record as DashboardShutdownPlanItem).blocked_reason,
                      2,
                    )
                  "
                >
                  {{ (record as DashboardShutdownPlanItem).blocked_reason }}
                </TypographyParagraph>
                <Button
                  v-if="
                    shouldShowCellExpand(
                      (record as DashboardShutdownPlanItem).blocked_reason,
                    )
                  "
                  type="link"
                  size="small"
                  class="mt-1 h-auto px-0 py-0"
                  @click="
                    toggleExpanded(
                      expandedCellKey(
                        'shutdown-plan-state',
                        record as DashboardShutdownPlanItem,
                      ),
                    )
                  "
                >
                  {{
                    isExpanded(
                      expandedCellKey(
                        'shutdown-plan-state',
                        record as DashboardShutdownPlanItem,
                      ),
                    )
                      ? '收起'
                      : '展开'
                  }}
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <div>
                <TypographyParagraph
                  class="mb-0 break-all text-xs leading-5"
                  :ellipsis="
                    cellEllipsis(
                      'shutdown-exec',
                      record as DashboardShutdownPlanItem,
                      (record as DashboardShutdownPlanItem).execution_status ||
                        '-',
                    )
                  "
                >
                  {{
                    (record as DashboardShutdownPlanItem).execution_status ||
                    '-'
                  }}
                </TypographyParagraph>
                <TypographyParagraph
                  class="mb-0 text-xs"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="
                    cellEllipsis(
                      'shutdown-exec-plan',
                      record as DashboardShutdownPlanItem,
                      `执行计划：${(record as DashboardShutdownPlanItem).execution_plan || '-'}`,
                      1,
                    )
                  "
                >
                  执行计划：{{
                    (record as DashboardShutdownPlanItem).execution_plan || '-'
                  }}
                </TypographyParagraph>
                <Button
                  v-if="
                    shouldShowCellExpand(
                      (record as DashboardShutdownPlanItem).execution_status,
                      (record as DashboardShutdownPlanItem).execution_plan,
                    )
                  "
                  type="link"
                  size="small"
                  class="mt-1 h-auto px-0 py-0"
                  @click="
                    toggleExpanded(
                      expandedCellKey(
                        'shutdown-exec',
                        record as DashboardShutdownPlanItem,
                      ),
                    );
                    toggleExpanded(
                      expandedCellKey(
                        'shutdown-exec-plan',
                        record as DashboardShutdownPlanItem,
                      ),
                    );
                  "
                >
                  {{
                    isExpanded(
                      expandedCellKey(
                        'shutdown-exec',
                        record as DashboardShutdownPlanItem,
                      ),
                    )
                      ? '收起'
                      : '展开'
                  }}
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'note'">
              <div>
                <TypographyParagraph
                  class="note-cell-text mb-0 whitespace-pre-wrap break-all text-xs leading-5"
                  :ellipsis="
                    cellEllipsis(
                      'shutdown-note',
                      record as any,
                      planNote(record as any),
                      2,
                    )
                  "
                >
                  {{ planNote(record as any) }}
                </TypographyParagraph>
                <Button
                  v-if="
                    shouldShowCellExpand(planNote(record as any), undefined, 36)
                  "
                  type="link"
                  size="small"
                  class="note-expand-btn"
                  @click="openNotePreview(record as any)"
                >
                  查看
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Button
                  type="link"
                  size="small"
                  @click="openNoteEditor(record as DashboardShutdownPlanItem)"
                >
                  备注
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="
                    openPath((record as DashboardShutdownPlanItem).related_path)
                  "
                >
                  资产详情
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <Card :title="`IP删除计划（${ipDeletePlanItems.length}）`">
        <Table
          class="plans-compact-table"
          size="small"
          :columns="ipDeleteColumns"
          :data-source="ipDeletePlanItems"
          :loading="loading"
          :pagination="tablePagination"
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
            <template v-else-if="column.key === 'user_display_name'">
              <div>
                <div>{{ (record as any).user_display_name || '-' }}</div>
                <div
                  v-if="(record as any).username_label"
                  style="color: var(--color-text-secondary)"
                  class="text-xs"
                >
                  {{ (record as any).username_label }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'resource_state_label'">
              <Tag
                :color="
                  resourceStateColor(
                    (record as DashboardUnattachedIpDeletePlan).resource_state,
                  )
                "
              >
                {{
                  (record as DashboardUnattachedIpDeletePlan)
                    .resource_state_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'plan_state_label'">
              <div>
                <Tag
                  :color="
                    planStateColor(
                      (record as DashboardUnattachedIpDeletePlan).plan_state,
                    )
                  "
                >
                  {{
                    (record as DashboardUnattachedIpDeletePlan)
                      .plan_state_label || '-'
                  }}
                </Tag>
                <TypographyParagraph
                  v-if="
                    (record as DashboardUnattachedIpDeletePlan).blocked_reason
                  "
                  class="mb-0 break-all text-xs leading-5"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="{
                    rows: 1,
                    tooltip: (record as DashboardUnattachedIpDeletePlan)
                      .blocked_reason,
                  }"
                >
                  {{
                    compactCellText(
                      (record as DashboardUnattachedIpDeletePlan)
                        .blocked_reason,
                    )
                  }}
                </TypographyParagraph>
              </div>
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
                    cellEllipsis(
                      'ip-plan-exec',
                      record as DashboardUnattachedIpDeletePlan,
                      executionText(record as DashboardUnattachedIpDeletePlan),
                    )
                  "
                  class="mb-0 break-all text-xs leading-5"
                >
                  {{ executionText(record as DashboardUnattachedIpDeletePlan) }}
                </TypographyParagraph>
                <TypographyParagraph
                  v-if="
                    executionPlan(record as DashboardUnattachedIpDeletePlan) !==
                    '-'
                  "
                  class="mb-0 text-xs"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="
                    cellEllipsis(
                      'ip-plan-exec-plan',
                      record as DashboardUnattachedIpDeletePlan,
                      `执行计划：${executionPlan(record as DashboardUnattachedIpDeletePlan)}`,
                      1,
                    )
                  "
                >
                  执行计划：{{
                    executionPlan(record as DashboardUnattachedIpDeletePlan)
                  }}
                </TypographyParagraph>
              </div>
            </template>
            <template v-else-if="column.key === 'note'">
              <TypographyParagraph
                class="note-cell-text mb-0 whitespace-pre-wrap break-all text-xs leading-5"
                :ellipsis="
                  cellEllipsis(
                    'ip-plan-note',
                    record as any,
                    planNote(record as any),
                    2,
                  )
                "
              >
                {{ planNote(record as any) }}
              </TypographyParagraph>
              <Button
                v-if="
                  shouldShowCellExpand(planNote(record as any), undefined, 36)
                "
                type="link"
                size="small"
                class="note-expand-btn"
                @click="openNotePreview(record as any)"
              >
                查看
              </Button>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Button
                  type="link"
                  size="small"
                  @click="
                    openNoteEditor(record as DashboardUnattachedIpDeletePlan)
                  "
                >
                  备注
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
                  详情
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <Empty
          v-if="ipDeletePlanItems.length === 0 && !loading"
          description="当前没有 IP 删除计划"
        />
      </Card>

      <Card title="服务器删除历史记录">
        <Table
          class="plans-compact-table"
          size="small"
          :columns="historyColumns"
          :data-source="historyItems"
          :loading="loading"
          :pagination="tablePagination"
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
            <template v-else-if="column.key === 'user_display_name'">
              <div>
                <div>{{ (record as any).user_display_name || '-' }}</div>
                <div
                  v-if="(record as any).username_label"
                  style="color: var(--color-text-secondary)"
                  class="text-xs"
                >
                  {{ (record as any).username_label }}
                </div>
              </div>
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
              <Tag :color="recordTimeColor(record, column.key)">
                {{ fmtRecordTime(record, column.key) }}
              </Tag>
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
              </Button>
              <span v-else>-</span>
            </template>
          </template>
        </Table>
      </Card>

      <Card :title="`IP删除历史记录（${ipDeleteHistoryItems.length}）`">
        <Table
          class="plans-compact-table"
          size="small"
          :columns="ipDeleteColumns"
          :data-source="ipDeleteHistoryItems"
          :loading="loading"
          :pagination="tablePagination"
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
            <template v-else-if="column.key === 'user_display_name'">
              <div>
                <div>{{ (record as any).user_display_name || '-' }}</div>
                <div
                  v-if="(record as any).username_label"
                  style="color: var(--color-text-secondary)"
                  class="text-xs"
                >
                  {{ (record as any).username_label }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'resource_state_label'">
              <Tag
                :color="
                  resourceStateColor(
                    (record as DashboardUnattachedIpDeletePlan).resource_state,
                  )
                "
              >
                {{
                  (record as DashboardUnattachedIpDeletePlan)
                    .resource_state_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'plan_state_label'">
              <div>
                <Tag
                  :color="
                    planStateColor(
                      (record as DashboardUnattachedIpDeletePlan).plan_state,
                    )
                  "
                >
                  {{
                    (record as DashboardUnattachedIpDeletePlan)
                      .plan_state_label || '-'
                  }}
                </Tag>
                <TypographyParagraph
                  v-if="
                    (record as DashboardUnattachedIpDeletePlan).blocked_reason
                  "
                  class="mb-0 break-all text-xs leading-5"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="{
                    rows: 1,
                    tooltip: (record as DashboardUnattachedIpDeletePlan)
                      .blocked_reason,
                  }"
                >
                  {{
                    compactCellText(
                      (record as DashboardUnattachedIpDeletePlan)
                        .blocked_reason,
                    )
                  }}
                </TypographyParagraph>
              </div>
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
                    cellEllipsis(
                      'ip-history-exec',
                      record as DashboardUnattachedIpDeletePlan,
                      executionText(record as DashboardUnattachedIpDeletePlan),
                    )
                  "
                  class="mb-0 break-all text-xs leading-5"
                >
                  {{ executionText(record as DashboardUnattachedIpDeletePlan) }}
                </TypographyParagraph>
                <TypographyParagraph
                  v-if="
                    executionPlan(record as DashboardUnattachedIpDeletePlan) !==
                    '-'
                  "
                  class="mb-0 text-xs"
                  style="color: var(--color-text-secondary)"
                  :ellipsis="
                    cellEllipsis(
                      'ip-history-exec-plan',
                      record as DashboardUnattachedIpDeletePlan,
                      `执行计划：${executionPlan(record as DashboardUnattachedIpDeletePlan)}`,
                      1,
                    )
                  "
                >
                  执行计划：{{
                    executionPlan(record as DashboardUnattachedIpDeletePlan)
                  }}
                </TypographyParagraph>
                <Button
                  v-if="
                    shouldShowCellExpand(
                      executionText(record as DashboardUnattachedIpDeletePlan),
                      executionPlan(
                        record as DashboardUnattachedIpDeletePlan,
                      ) === '-'
                        ? ''
                        : executionPlan(
                            record as DashboardUnattachedIpDeletePlan,
                          ),
                    )
                  "
                  type="link"
                  size="small"
                  class="h-auto px-0 py-0"
                  @click="
                    toggleExpanded(
                      expandedCellKey(
                        'ip-history-exec',
                        record as DashboardUnattachedIpDeletePlan,
                      ),
                    );
                    toggleExpanded(
                      expandedCellKey(
                        'ip-history-exec-plan',
                        record as DashboardUnattachedIpDeletePlan,
                      ),
                    );
                  "
                >
                  {{
                    isExpanded(
                      expandedCellKey(
                        'ip-history-exec',
                        record as DashboardUnattachedIpDeletePlan,
                      ),
                    )
                      ? '收起'
                      : '展开'
                  }}
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'note'">
              <TypographyParagraph
                class="note-cell-text mb-0 whitespace-pre-wrap break-all text-xs leading-5"
                :ellipsis="
                  cellEllipsis(
                    'ip-history-note',
                    record as any,
                    planNote(record as any),
                    2,
                  )
                "
              >
                {{ planNote(record as any) }}
              </TypographyParagraph>
              <Button
                v-if="
                  shouldShowCellExpand(planNote(record as any), undefined, 36)
                "
                type="link"
                size="small"
                class="note-expand-btn"
                @click="openNotePreview(record as any)"
              >
                查看
              </Button>
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
        :pagination="tablePagination"
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
    <Modal
      v-model:open="noteModalOpen"
      title="编辑备注"
      :confirm-loading="noteSaving"
      @ok="savePlanNote"
    >
      <Input.TextArea
        v-model:value="noteValue"
        :auto-size="{ minRows: 4, maxRows: 10 }"
        placeholder="填写删除计划备注"
      />
    </Modal>
    <Modal
      v-model:open="notePreviewOpen"
      :title="notePreviewTitle"
      width="720px"
      :footer="null"
    >
      <TypographyParagraph
        class="mb-0 whitespace-pre-wrap break-all text-sm leading-6"
      >
        {{ notePreviewValue || '-' }}
      </TypographyParagraph>
    </Modal>
  </Page>
</template>

<style scoped>
.plans-page :deep(.plans-compact-table .ant-table-thead > tr > th) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.plans-page :deep(.plans-compact-table .ant-table-tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
  vertical-align: middle;
}

.plans-page :deep(.plans-compact-table .ant-table-cell > div) {
  min-height: 20px;
}

.plans-page
  :deep(
    .plans-compact-table
      .ant-table-cell
      > div
      > div.text-xs:not(.note-cell-text)
  ) {
  display: none;
}

.plans-page :deep(.plans-compact-table .ant-typography) {
  max-width: 100%;
  margin-bottom: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
}

.plans-page :deep(.plans-compact-table .mt-1.h-auto.px-0.py-0),
.plans-page :deep(.plans-compact-table .h-auto.px-0.py-0) {
  display: none;
}

.plans-page :deep(.plans-compact-table .note-cell-text) {
  display: block;
  max-width: 100%;
  max-height: 40px;
  overflow: hidden;
  line-height: 20px;
  overflow-wrap: anywhere;
  white-space: normal !important;
}

.plans-page
  :deep(.plans-compact-table .note-cell-text.ant-typography-ellipsis) {
  max-height: 40px;
}

.plans-page
  :deep(.plans-compact-table .note-cell-text:not(.ant-typography-ellipsis)) {
  max-height: 40px;
}

.plans-page :deep(.plans-compact-table .note-expand-btn) {
  display: inline-flex !important;
  margin-top: 2px;
}

.plans-page :deep(.plans-compact-table .ant-btn-link.ant-btn-sm) {
  min-height: 20px;
}
</style>
