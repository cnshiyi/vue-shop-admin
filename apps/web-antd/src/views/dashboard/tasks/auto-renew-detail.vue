<script lang="ts" setup>
import type {
  DashboardAutoRenewTaskDetail,
  DashboardAutoRenewTaskDueItem,
  DashboardAutoRenewTaskHistoryItem,
} from '#/api/admin';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Empty,
  message,
  Space,
  Table,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDashboardAutoRenewTaskDetailApi,
  runDashboardAutoRenewOrderApi,
  runDashboardAutoRenewTasksApi,
} from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const runningAll = ref(false);
const runningOrderIds = reactive<Record<number, boolean>>({});
const detail = ref<DashboardAutoRenewTaskDetail | null>(null);

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
    title: '到期时间',
    dataIndex: 'service_expires_at',
    key: 'service_expires_at',
    width: 180,
  },
  {
    title: '自动续费时间',
    dataIndex: 'auto_renew_at',
    key: 'auto_renew_at',
    width: 180,
  },
  {
    title: '下次巡检',
    dataIndex: 'next_run_at',
    key: 'next_run_at',
    width: 180,
  },
  { title: '余额', dataIndex: 'balance', key: 'balance', width: 140 },
  { title: '计划', dataIndex: 'plan', key: 'plan', width: 220 },
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
  { title: '结果', dataIndex: 'result_label', key: 'result_label', width: 100 },
  {
    title: '余额变化',
    dataIndex: 'balance_change',
    key: 'balance_change',
    width: 220,
  },
  {
    title: '失败原因',
    dataIndex: 'failure_reason',
    key: 'failure_reason',
    width: 260,
  },
  {
    title: '续费后到期',
    dataIndex: 'service_expires_at',
    key: 'service_expires_at',
    width: 180,
  },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' as const },
];

const summary = computed(() => detail.value);
const latestFailedIpsText = computed(() =>
  (summary.value?.latest_failed_ips || []).join('、'),
);
const expandedKeys = reactive<Record<string, boolean>>({});

function isExpanded(key: string) {
  return Boolean(expandedKeys[key]);
}

function toggleExpanded(key: string) {
  expandedKeys[key] = !expandedKeys[key];
}

function shouldShowExpand(value?: null | string, threshold = 48) {
  return Boolean(value && value.length > threshold);
}

function fmtTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function fmtValue(value?: null | string) {
  return value || '-';
}

function fmtBalanceChange(item: DashboardAutoRenewTaskHistoryItem) {
  const before = item.balance_before || '-';
  const after = item.balance_after || '-';
  const delta = item.balance_change
    ? `${item.balance_change} ${item.currency}`
    : '-';
  if (!item.is_success) {
    return `${before} → ${after}`;
  }
  return `${before} → ${after}（${delta}）`;
}

function resultColor(item: DashboardAutoRenewTaskHistoryItem) {
  return item.is_success ? 'success' : 'error';
}

function queueColor(status?: string) {
  if (status === 'retry_failed') return 'error';
  if (status === 'due_now' || status === 'fallback_retry') return 'warning';
  if (status === 'within_window') return 'processing';
  return 'default';
}

async function loadData(options?: { silent?: boolean }) {
  if (!options?.silent) {
    loading.value = true;
  }
  try {
    detail.value = await getDashboardAutoRenewTaskDetailApi();
  } catch (error: any) {
    message.error(error?.message || '续费列表加载失败');
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

async function runAllRenewals() {
  if (runningAll.value) {
    return;
  }
  runningAll.value = true;
  message.loading({ content: '正在执行全部续费任务...', key: 'renew-run-all', duration: 0 });
  try {
    const result = await runDashboardAutoRenewTasksApi();
    message.success({
      content:
        result.total > 0
          ? `已执行 ${result.total} 条，成功 ${result.success_count}，失败 ${result.failure_count}`
          : result.message || '当前没有可执行的续费任务',
      key: 'renew-run-all',
    });
    await loadData({ silent: true });
  } catch (error: any) {
    message.error({
      content: error?.message || '执行全部续费任务失败',
      key: 'renew-run-all',
    });
  } finally {
    runningAll.value = false;
  }
}

async function runSingleRenewal(record: DashboardAutoRenewTaskDueItem) {
  if (!record.order_id || runningOrderIds[record.order_id]) {
    return;
  }
  runningOrderIds[record.order_id] = true;
  message.loading({
    content: `正在执行 ${record.ip || record.order_no} 的续费...`,
    key: `renew-run-${record.order_id}`,
    duration: 0,
  });
  try {
    const result = await runDashboardAutoRenewOrderApi(record.order_id);
    if (result.failure_count > 0) {
      message.error({
        content: result.items[0]?.error || '续费执行失败',
        key: `renew-run-${record.order_id}`,
      });
    } else {
      message.success({
        content: '续费执行完成',
        key: `renew-run-${record.order_id}`,
      });
    }
    await loadData({ silent: true });
  } catch (error: any) {
    message.error({
      content: error?.message || '执行续费失败',
      key: `renew-run-${record.order_id}`,
    });
  } finally {
    runningOrderIds[record.order_id] = false;
  }
}

function openOrder(path: string) {
  if (path) {
    router.push(path).catch(() => {});
  }
}

function goBack() {
  router.push('/admin/cloud-orders/list').catch(() => {});
}

onMounted(loadData);
</script>

<template>
  <Page
    description="独立查看续费列表结果，支持一键执行全部任务与单项续费"
    title="续费列表"
  >
    <Space direction="vertical" style="width: 100%" :size="16">
      <Card :loading="loading">
        <template #title>
          <Space wrap>
            <Button size="small" @click="goBack">返回云订单</Button>
            <Button
              type="primary"
              size="small"
              :loading="runningAll"
              @click="runAllRenewals"
            >
              一键执行全部任务
            </Button>
            <span>{{ summary?.task_label || '续费列表' }}</span>
            <Tag color="processing">
              {{ summary?.status_label || '置顶任务' }}
            </Tag>
          </Space>
        </template>

        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="任务名称">
            {{ summary?.task_label || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="巡检频率">
            {{
              summary?.interval_minutes
                ? `${summary.interval_minutes} 分钟`
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="下次执行">
            {{ fmtTime(summary?.next_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="上次执行">
            {{ fmtTime(summary?.last_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时成功">
            {{ summary?.recent_success_count ?? 0 }}
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时失败">
            {{ summary?.recent_failure_count ?? 0 }}
          </Descriptions.Item>
          <Descriptions.Item label="当前待执行 IP">
            {{ summary?.due_count ?? 0 }}
          </Descriptions.Item>
          <Descriptions.Item label="最新批次">
            {{ summary?.latest_batch_id || '-' }} /
            {{ summary?.latest_batch_count ?? 0 }} 条
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="本批次执行摘要">
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="批次号">
            {{ summary?.latest_batch_id || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="总记录数">
            {{ summary?.latest_batch_count ?? 0 }}
          </Descriptions.Item>
          <Descriptions.Item label="成功数">
            <Tag color="success">
              {{ summary?.latest_batch_success_count ?? 0 }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="失败数">
            <Tag color="error">
              {{ summary?.latest_batch_failure_count ?? 0 }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="失败 IP" :span="2">
            <template v-if="summary?.latest_failed_ips?.length">
              <Space wrap>
                <Tag
                  v-for="ip in summary.latest_failed_ips"
                  :key="ip"
                  color="error"
                >
                  {{ ip }}
                </Tag>
              </Space>
            </template>
            <span v-else>-</span>
          </Descriptions.Item>
        </Descriptions>
        <div
          v-if="latestFailedIpsText"
          style="margin-top: 12px; color: var(--color-error)"
        >
          <div style="margin-bottom: 4px">最新失败 IP：</div>
          <TypographyParagraph
            :ellipsis="
              isExpanded('latest-failed-ips')
                ? false
                : { rows: 2, tooltip: latestFailedIpsText }
            "
            class="mb-0 break-all text-sm leading-6"
          >
            {{ latestFailedIpsText }}
          </TypographyParagraph>
          <Button
            v-if="shouldShowExpand(latestFailedIpsText, 60)"
            type="link"
            size="small"
            class="mt-1 h-auto px-0 py-0"
            @click="toggleExpanded('latest-failed-ips')"
          >
            {{ isExpanded('latest-failed-ips') ? '收起' : '展开' }}
          </Button>
        </div>
      </Card>

      <Card title="待执行 IP（含失败待重试 / 过期兜底重试）">
        <Table
          :columns="dueColumns"
          :data-source="summary?.due_items || []"
          :loading="loading"
          row-key="id"
          :pagination="false"
          :scroll="{ x: 1320 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'queue_status_label'">
              <div>
                <Tag
                  :color="
                    queueColor(
                      (record as DashboardAutoRenewTaskDueItem).queue_status,
                    )
                  "
                >
                  {{
                    (record as DashboardAutoRenewTaskDueItem)
                      .queue_status_label || '-'
                  }}
                </Tag>
                <div
                  v-if="
                    (record as DashboardAutoRenewTaskDueItem)
                      .last_failure_reason
                  "
                  style="margin-top: 4px; color: var(--color-error)"
                >
                  <TypographyParagraph
                    :ellipsis="
                      isExpanded(
                        `due-failure-${(record as DashboardAutoRenewTaskDueItem).id}`,
                      )
                        ? false
                        : {
                            rows: 2,
                            tooltip: (record as DashboardAutoRenewTaskDueItem)
                              .last_failure_reason,
                          }
                    "
                    class="mb-0 break-all text-xs leading-5"
                  >
                    {{
                      (record as DashboardAutoRenewTaskDueItem)
                        .last_failure_reason
                    }}
                  </TypographyParagraph>
                  <Button
                    v-if="
                      shouldShowExpand(
                        (record as DashboardAutoRenewTaskDueItem)
                          .last_failure_reason,
                        32,
                      )
                    "
                    type="link"
                    size="small"
                    class="mt-1 h-auto px-0 py-0"
                    @click="
                      toggleExpanded(
                        `due-failure-${(record as DashboardAutoRenewTaskDueItem).id}`,
                      )
                    "
                  >
                    {{
                      isExpanded(
                        `due-failure-${(record as DashboardAutoRenewTaskDueItem).id}`,
                      )
                        ? '收起'
                        : '展开'
                    }}
                  </Button>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'balance'">
              {{ fmtValue((record as DashboardAutoRenewTaskDueItem).balance) }}
              USDT
            </template>
            <template v-else-if="column.key === 'service_expires_at'">
              {{
                fmtTime(
                  (record as DashboardAutoRenewTaskDueItem).service_expires_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'auto_renew_at'">
              {{
                fmtTime((record as DashboardAutoRenewTaskDueItem).auto_renew_at)
              }}
            </template>
            <template v-else-if="column.key === 'next_run_at'">
              {{
                fmtTime((record as DashboardAutoRenewTaskDueItem).next_run_at)
              }}
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>
                  {{ (record as DashboardAutoRenewTaskDueItem).provider_label }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  关机
                  {{
                    fmtValue(
                      (record as DashboardAutoRenewTaskDueItem).suspend_at,
                    )
                  }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  删机
                  {{
                    fmtValue(
                      (record as DashboardAutoRenewTaskDueItem).delete_at,
                    )
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Button
                  type="link"
                  size="small"
                  :loading="
                    runningOrderIds[
                      (record as DashboardAutoRenewTaskDueItem).order_id
                    ]
                  "
                  @click="runSingleRenewal(record as DashboardAutoRenewTaskDueItem)"
                >
                  执行续费
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="
                    openOrder(
                      (record as DashboardAutoRenewTaskDueItem).related_path,
                    )
                  "
                >
                  待执行IP详情
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <Empty
          v-if="(summary?.due_items || []).length === 0 && !loading"
          description="当前没有待执行的自动续费任务"
        />
      </Card>

      <Card title="未来执行计划">
        <Table
          :columns="dueColumns"
          :data-source="summary?.future_plan_items || []"
          :loading="loading"
          row-key="id"
          :pagination="{ pageSize: 8 }"
          :scroll="{ x: 1500 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'queue_status_label'">
              <Tag
                :color="
                  queueColor(
                    (record as DashboardAutoRenewTaskDueItem).queue_status,
                  )
                "
              >
                {{
                  (record as DashboardAutoRenewTaskDueItem)
                    .queue_status_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'balance'">
              {{ fmtValue((record as DashboardAutoRenewTaskDueItem).balance) }}
              USDT
            </template>
            <template v-else-if="column.key === 'service_expires_at'">
              {{
                fmtTime(
                  (record as DashboardAutoRenewTaskDueItem).service_expires_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'auto_renew_at'">
              {{
                fmtTime((record as DashboardAutoRenewTaskDueItem).auto_renew_at)
              }}
            </template>
            <template v-else-if="column.key === 'next_run_at'">
              {{
                fmtTime((record as DashboardAutoRenewTaskDueItem).next_run_at)
              }}
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>
                  {{ (record as DashboardAutoRenewTaskDueItem).provider_label }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  关机
                  {{
                    fmtValue(
                      (record as DashboardAutoRenewTaskDueItem).suspend_at,
                    )
                  }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  删机
                  {{
                    fmtValue(
                      (record as DashboardAutoRenewTaskDueItem).delete_at,
                    )
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openOrder(
                    (record as DashboardAutoRenewTaskDueItem).related_path,
                  )
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="历史执行记录">
        <Table
          :columns="historyColumns"
          :data-source="summary?.history_items || []"
          :loading="loading"
          row-key="id"
          :pagination="{ pageSize: 10 }"
          :scroll="{ x: 1680 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'executed_at'">
              {{
                fmtTime(
                  (record as DashboardAutoRenewTaskHistoryItem).executed_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'result_label'">
              <Tag
                :color="
                  resultColor(record as DashboardAutoRenewTaskHistoryItem)
                "
              >
                {{ (record as DashboardAutoRenewTaskHistoryItem).result_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'balance_change'">
              <span>{{
                fmtBalanceChange(record as DashboardAutoRenewTaskHistoryItem)
              }}</span>
            </template>
            <template v-else-if="column.key === 'service_expires_at'">
              {{
                fmtTime(
                  (record as DashboardAutoRenewTaskHistoryItem)
                    .service_expires_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'failure_reason'">
              <div
                v-if="
                  !(record as DashboardAutoRenewTaskHistoryItem).is_success &&
                  (record as DashboardAutoRenewTaskHistoryItem).failure_reason
                "
              >
                <Tag color="error" style="margin-bottom: 4px">失败原因</Tag>
                <TypographyParagraph
                  :ellipsis="
                    isExpanded(
                      `history-failure-${(record as DashboardAutoRenewTaskHistoryItem).id}`,
                    )
                      ? false
                      : {
                          rows: 2,
                          tooltip: (record as DashboardAutoRenewTaskHistoryItem)
                            .failure_reason,
                        }
                  "
                  class="mb-0 break-all text-xs leading-5"
                >
                  {{
                    (record as DashboardAutoRenewTaskHistoryItem).failure_reason
                  }}
                </TypographyParagraph>
                <Button
                  v-if="
                    shouldShowExpand(
                      (record as DashboardAutoRenewTaskHistoryItem)
                        .failure_reason,
                      36,
                    )
                  "
                  type="link"
                  size="small"
                  class="mt-1 h-auto px-0 py-0"
                  @click="
                    toggleExpanded(
                      `history-failure-${(record as DashboardAutoRenewTaskHistoryItem).id}`,
                    )
                  "
                >
                  {{
                    isExpanded(
                      `history-failure-${(record as DashboardAutoRenewTaskHistoryItem).id}`,
                    )
                      ? '收起'
                      : '展开'
                  }}
                </Button>
              </div>
              <span v-else>-</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                v-if="
                  (record as DashboardAutoRenewTaskHistoryItem).related_path
                "
                type="link"
                size="small"
                @click="
                  openOrder(
                    (record as DashboardAutoRenewTaskHistoryItem).related_path,
                  )
                "
              >
                订单详情
              </Button>
              <span v-else>-</span>
            </template>
          </template>
        </Table>
      </Card>
    </Space>
  </Page>
</template>
