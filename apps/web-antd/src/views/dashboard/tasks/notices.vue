<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  DashboardNoticePlanDetail,
  DashboardNoticePlanHistoryItem,
  DashboardNoticePlanItem,
  DashboardNoticeUserSummaryItem,
} from '#/api/admin';

import { computed, onMounted, ref } from 'vue';
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
  getDashboardNoticePlanApi,
  updateDashboardNoticePlanTextApi,
} from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const detail = ref<DashboardNoticePlanDetail | null>(null);
const textModalOpen = ref(false);
const textSaving = ref(false);
const textValue = ref('');
const textTarget = ref<DashboardNoticeUserSummaryItem | null>(null);

const noticeBatchColumns: TableColumnsType<DashboardNoticeUserSummaryItem> = [
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 180,
  },
  {
    title: '通知类型',
    dataIndex: 'notice_type_label',
    key: 'notice_type_label',
    width: 150,
  },
  {
    title: '通知渠道',
    dataIndex: 'notice_channel_label',
    key: 'notice_channel_label',
    width: 210,
  },
  { title: 'IP数量', dataIndex: 'ip_count', key: 'ip_count', width: 90 },
  { title: 'IP列表', dataIndex: 'ips', key: 'ips', width: 340 },
  {
    title: '通知文案',
    dataIndex: 'notice_text_preview',
    key: 'notice_text_preview',
    width: 460,
  },
  {
    title: '通知时间',
    dataIndex: 'next_notice_at',
    key: 'next_notice_at',
    width: 180,
  },
  {
    title: '失败重试',
    dataIndex: 'failed_retry_count',
    key: 'failed_retry_count',
    width: 100,
  },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const planColumns: TableColumnsType<DashboardNoticePlanItem> = [
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  {
    title: '通知类型',
    dataIndex: 'notice_type_label',
    key: 'notice_type_label',
    width: 150,
  },
  {
    title: '通知状态',
    dataIndex: 'notice_status_label',
    key: 'notice_status_label',
    width: 170,
  },
  {
    title: '通知渠道',
    dataIndex: 'notice_channel_label',
    key: 'notice_channel_label',
    width: 190,
  },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 160,
  },
  { title: '通知时间', dataIndex: 'notice_at', key: 'notice_at', width: 180 },
  {
    title: '通知文案',
    dataIndex: 'notice_text_preview',
    key: 'notice_text_preview',
    width: 420,
  },
  {
    title: '队列状态',
    dataIndex: 'queue_status_label',
    key: 'queue_status_label',
    width: 150,
  },
  {
    title: '重试说明',
    dataIndex: 'retry_label',
    key: 'retry_label',
    width: 260,
  },
  { title: '计划', dataIndex: 'plan', key: 'plan', width: 260 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const historyColumns: TableColumnsType<DashboardNoticePlanHistoryItem> = [
  { title: '发送时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  {
    title: '通知类型',
    dataIndex: 'notice_type_label',
    key: 'notice_type_label',
    width: 150,
  },
  {
    title: '通知状态',
    dataIndex: 'notice_status_label',
    key: 'notice_status_label',
    width: 170,
  },
  {
    title: '通知渠道',
    dataIndex: 'notice_channel_label',
    key: 'notice_channel_label',
    width: 210,
  },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 160,
  },
  { title: 'IP数量', dataIndex: 'ip_count', key: 'ip_count', width: 90 },
  { title: 'IP列表', dataIndex: 'ips', key: 'ips', width: 320 },
  {
    title: '通知文案',
    dataIndex: 'notice_text_preview',
    key: 'notice_text_preview',
    width: 500,
  },
  {
    title: '重试说明',
    dataIndex: 'retry_label',
    key: 'retry_label',
    width: 300,
  },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const dueItems = computed(() => detail.value?.due_items || []);
const dueBatchItems = computed(
  () => detail.value?.due_user_summary_items || [],
);
const futureBatchItems = computed(
  () => detail.value?.future_user_summary_items || [],
);
const historyItems = computed(() => detail.value?.history_items || []);

function fmtTime(value?: null | string) {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value;
}

function queueColor(status?: string) {
  if (status === 'due_now' || status === 'fallback_notice') return 'error';
  if (status === 'within_window') return 'warning';
  return 'processing';
}

function noticeColor(type?: string) {
  if (type === 'renew_notice' || type === 'renew_notice_batch') return 'blue';
  if (type === 'auto_renew_notice') return 'purple';
  if (type === 'delete_notice') return 'orange';
  if (type === 'recycle_notice') return 'cyan';
  return 'default';
}

function statusColor(status?: string) {
  if (status === 'sent') return 'success';
  if (status === 'failed_retry') return 'error';
  if (status === 'pending') return 'warning';
  if (status === 'scheduled_soon') return 'processing';
  return 'default';
}

function channelColor(channel?: string) {
  if (channel === 'unbound') return 'error';
  if (channel === 'telegram_fallback') return 'orange';
  if (channel === 'telegram_account') return 'purple';
  if (channel === 'telegram_chat') return 'cyan';
  return 'blue';
}

function attemptColor(status?: string) {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'pending') return 'processing';
  return 'default';
}

function rowKey(record: DashboardNoticePlanItem) {
  return `${record.notice_type}-${record.order_id || record.id}`;
}

function batchRowKey(record: DashboardNoticeUserSummaryItem) {
  return record.id;
}

function historyRowKey(record: DashboardNoticePlanHistoryItem) {
  return record.id;
}

function displayUser(record: {
  user_display_name?: string;
  username_label?: string;
}) {
  const name = record.user_display_name || '未绑定用户';
  const username = record.username_label && record.username_label !== '-' ? record.username_label : '';
  return username ? `${name} ${username}` : name;
}

function openOrder(path?: string) {
  if (!path) return;
  router.push(path).catch(() => {});
}

async function loadData() {
  loading.value = true;
  try {
    detail.value = await getDashboardNoticePlanApi();
  } catch (error: any) {
    message.error(error?.message || '通知计划加载失败');
  } finally {
    loading.value = false;
  }
}

function openTextEditor(record: DashboardNoticeUserSummaryItem) {
  textTarget.value = record;
  textValue.value = record.notice_text_preview || '';
  textModalOpen.value = true;
}

async function saveNoticeText() {
  if (!textTarget.value) return;
  textSaving.value = true;
  try {
    await updateDashboardNoticePlanTextApi({
      event: textTarget.value.notice_event,
      notice_text: textValue.value,
      order_ids: textTarget.value.order_ids || [],
      user_id: textTarget.value.user_id,
    });
    message.success('通知文案已保存，后续发送会使用人工干预文案');
    textModalOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '通知文案保存失败');
  } finally {
    textSaving.value = false;
  }
}

function resetNoticeText() {
  textValue.value = '';
}

function goTasks() {
  router.push('/admin/tasks').catch(() => {});
}

onMounted(loadData);
</script>

<template>
  <Page
    description="按用户和通知类型整合通知计划；同一种通知只生成一条合并文案"
    title="通知计划"
  >
    <Space direction="vertical" style="width: 100%" :size="16">
      <Card :loading="loading">
        <template #title>
          <Space wrap>
            <Button size="small" @click="goTasks">返回任务列表</Button>
            <Button size="small" :loading="loading" @click="loadData">
              刷新
            </Button>
            <span>{{ detail?.task_label || '通知计划' }}</span>
            <Tag color="processing">
              {{ detail?.status_label || '置顶任务' }}
            </Tag>
          </Space>
        </template>

        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="任务名称">
            {{ detail?.task_label || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="巡检频率">
            {{
              detail?.interval_minutes ? `${detail.interval_minutes} 分钟` : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="下次巡检">
            {{ fmtTime(detail?.next_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="上次通知">
            {{ fmtTime(detail?.last_run_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时送达">
            <Tag color="success">
              {{ detail?.recent_success_user_count ?? 0 }} 用户
            </Tag>
            / {{ detail?.recent_success_count ?? 0 }} 条
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时失败">
            <Tag color="error">
              {{ detail?.recent_failure_user_count ?? 0 }} 用户
            </Tag>
            / {{ detail?.recent_failure_count ?? 0 }} 条
          </Descriptions.Item>
          <Descriptions.Item label="两天内待通知">
            <Tag color="warning">{{ detail?.due_user_count ?? 0 }} 种通知</Tag>
            / {{ detail?.due_count ?? 0 }} 个 IP 通知项
          </Descriptions.Item>
          <Descriptions.Item label="未来计划">
            <Tag color="processing">
              {{ detail?.future_user_count ?? 0 }} 种通知
            </Tag>
            / {{ detail?.future_count ?? 0 }} 个 IP 通知项
          </Descriptions.Item>
        </Descriptions>
        <Alert
          v-if="detail?.retry_policy_label"
          type="info"
          show-icon
          :message="detail.retry_policy_label"
          style="margin-top: 12px"
        />
      </Card>

      <Card title="待通知计划（按用户 + 通知类型整合）">
        <Table
          :columns="noticeBatchColumns"
          :data-source="dueBatchItems"
          :loading="loading"
          :pagination="false"
          :row-key="batchRowKey"
          :scroll="{ x: 1710 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user_display_name'">
              {{ displayUser(record as DashboardNoticeUserSummaryItem) }}
            </template>
            <template v-else-if="column.key === 'notice_type_label'">
              <Tag
                :color="
                  noticeColor(
                    (record as DashboardNoticeUserSummaryItem).notice_type,
                  )
                "
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).notice_type_label
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <div class="flex flex-wrap gap-1">
                <Tag
                  :color="
                    channelColor(
                      (record as DashboardNoticeUserSummaryItem).notice_channel,
                    )
                  "
                >
                  {{
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_channel_label || '-'
                  }}
                </Tag>
                <Tag
                  v-for="attempt in (record as DashboardNoticeUserSummaryItem)
                    .notice_channel_attempts || []"
                  :key="`${attempt.channel}-${attempt.account_id || attempt.label}`"
                  :color="attemptColor(attempt.status)"
                >
                  {{ attempt.label }}：{{ attempt.status_label }}
                </Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'ips'">
              <TypographyParagraph
                :ellipsis="{
                  rows: 2,
                  tooltip: (record as DashboardNoticeUserSummaryItem).ips.join(
                    ' / ',
                  ),
                }"
                class="mb-0 break-all text-sm leading-6"
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).ips.join(' / ') ||
                  '-'
                }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'notice_text_preview'">
              <div>
                <Tag
                  v-if="
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_has_manual_text
                  "
                  color="warning"
                >
                  人工干预
                </Tag>
                <TypographyParagraph
                  :ellipsis="{
                    rows: 3,
                    tooltip: (record as DashboardNoticeUserSummaryItem)
                      .notice_text_preview,
                  }"
                  class="mb-0 whitespace-pre-wrap break-all text-sm leading-6"
                >
                  {{
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_text_preview || '-'
                  }}
                </TypographyParagraph>
                <Button
                  type="link"
                  size="small"
                  class="h-auto px-0 py-0"
                  @click="
                    openTextEditor(record as DashboardNoticeUserSummaryItem)
                  "
                >
                  编辑文案
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'next_notice_at'">
              {{
                fmtTime(
                  (record as DashboardNoticeUserSummaryItem).next_notice_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'failed_retry_count'">
              <Tag
                :color="
                  (record as DashboardNoticeUserSummaryItem)
                    .failed_retry_count > 0
                    ? 'error'
                    : 'default'
                "
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).failed_retry_count
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openOrder(
                    (record as DashboardNoticeUserSummaryItem).related_path,
                  )
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="待通知明细（两天内，每页10个IP）">
        <Table
          :columns="planColumns"
          :data-source="dueItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="rowKey"
          :scroll="{ x: 2390 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user_display_name'">
              {{ displayUser(record as DashboardNoticePlanItem) }}
            </template>
            <template v-else-if="column.key === 'notice_type_label'">
              <Tag
                :color="
                  noticeColor((record as DashboardNoticePlanItem).notice_type)
                "
              >
                {{ (record as DashboardNoticePlanItem).notice_type_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_status_label'">
              <Tag
                :color="
                  statusColor((record as DashboardNoticePlanItem).notice_status)
                "
              >
                {{
                  (record as DashboardNoticePlanItem).notice_status_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <div class="flex flex-wrap gap-1">
                <Tag
                  :color="
                    channelColor(
                      (record as DashboardNoticePlanItem).notice_channel,
                    )
                  "
                >
                  {{
                    (record as DashboardNoticePlanItem).notice_channel_label ||
                    '-'
                  }}
                </Tag>
                <Tag
                  v-for="attempt in (record as DashboardNoticePlanItem)
                    .notice_channel_attempts || []"
                  :key="`${attempt.channel}-${attempt.account_id || attempt.label}`"
                  :color="attemptColor(attempt.status)"
                >
                  {{ attempt.label }}：{{ attempt.status_label }}
                </Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'queue_status_label'">
              <Tag
                :color="
                  queueColor((record as DashboardNoticePlanItem).queue_status)
                "
              >
                {{
                  (record as DashboardNoticePlanItem).queue_status_label || '-'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_at'">
              {{ fmtTime((record as DashboardNoticePlanItem).notice_at) }}
            </template>
            <template
              v-else-if="
                column.key === 'notice_text_preview' ||
                column.key === 'retry_label'
              "
            >
              <TypographyParagraph
                :ellipsis="{
                  rows: 2,
                  tooltip: String((record as any)[column.key] || '-'),
                }"
                class="mb-0 break-all text-sm leading-6"
              >
                {{ (record as any)[column.key] || '-' }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>
                  {{
                    (record as DashboardNoticePlanItem).provider_label || '-'
                  }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  到期
                  {{
                    fmtTime(
                      (record as DashboardNoticePlanItem).service_expires_at,
                    )
                  }}
                  / 自动续费
                  {{
                    fmtTime((record as DashboardNoticePlanItem).auto_renew_at)
                  }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  关机
                  {{ fmtTime((record as DashboardNoticePlanItem).suspend_at) }}
                  / 删机
                  {{ fmtTime((record as DashboardNoticePlanItem).delete_at) }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openOrder((record as DashboardNoticePlanItem).related_path)
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
        <Empty
          v-if="dueItems.length === 0 && !loading"
          description="当前两天内没有待通知任务"
        />
      </Card>

      <Card title="未来通知计划（10个，按用户 + 通知类型整合）">
        <Table
          :columns="noticeBatchColumns"
          :data-source="futureBatchItems"
          :loading="loading"
          :pagination="false"
          :row-key="batchRowKey"
          :scroll="{ x: 1710 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user_display_name'">
              {{ displayUser(record as DashboardNoticeUserSummaryItem) }}
            </template>
            <template v-else-if="column.key === 'notice_type_label'">
              <Tag
                :color="
                  noticeColor(
                    (record as DashboardNoticeUserSummaryItem).notice_type,
                  )
                "
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).notice_type_label
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <div class="flex flex-wrap gap-1">
                <Tag
                  :color="
                    channelColor(
                      (record as DashboardNoticeUserSummaryItem).notice_channel,
                    )
                  "
                >
                  {{
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_channel_label || '-'
                  }}
                </Tag>
                <Tag
                  v-for="attempt in (record as DashboardNoticeUserSummaryItem)
                    .notice_channel_attempts || []"
                  :key="`${attempt.channel}-${attempt.account_id || attempt.label}`"
                  :color="attemptColor(attempt.status)"
                >
                  {{ attempt.label }}：{{ attempt.status_label }}
                </Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'ips'">
              <TypographyParagraph
                :ellipsis="{
                  rows: 2,
                  tooltip: (record as DashboardNoticeUserSummaryItem).ips.join(
                    ' / ',
                  ),
                }"
                class="mb-0 break-all text-sm leading-6"
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).ips.join(' / ') ||
                  '-'
                }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'notice_text_preview'">
              <div>
                <Tag
                  v-if="
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_has_manual_text
                  "
                  color="warning"
                >
                  人工干预
                </Tag>
                <TypographyParagraph
                  :ellipsis="{
                    rows: 3,
                    tooltip: (record as DashboardNoticeUserSummaryItem)
                      .notice_text_preview,
                  }"
                  class="mb-0 whitespace-pre-wrap break-all text-sm leading-6"
                >
                  {{
                    (record as DashboardNoticeUserSummaryItem)
                      .notice_text_preview || '-'
                  }}
                </TypographyParagraph>
                <Button
                  type="link"
                  size="small"
                  class="h-auto px-0 py-0"
                  @click="
                    openTextEditor(record as DashboardNoticeUserSummaryItem)
                  "
                >
                  编辑文案
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'next_notice_at'">
              {{
                fmtTime(
                  (record as DashboardNoticeUserSummaryItem).next_notice_at,
                )
              }}
            </template>
            <template v-else-if="column.key === 'failed_retry_count'">
              <Tag
                :color="
                  (record as DashboardNoticeUserSummaryItem)
                    .failed_retry_count > 0
                    ? 'error'
                    : 'default'
                "
              >
                {{
                  (record as DashboardNoticeUserSummaryItem).failed_retry_count
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openOrder(
                    (record as DashboardNoticeUserSummaryItem).related_path,
                  )
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="历史通知（按实际发送批次整合）">
        <Table
          :columns="historyColumns"
          :data-source="historyItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="historyRowKey"
          :scroll="{ x: 2290 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user_display_name'">
              {{ displayUser(record as DashboardNoticePlanHistoryItem) }}
            </template>
            <template v-else-if="column.key === 'created_at'">
              {{
                fmtTime((record as DashboardNoticePlanHistoryItem).created_at)
              }}
            </template>
            <template v-else-if="column.key === 'notice_type_label'">
              <Tag
                :color="
                  noticeColor(
                    (record as DashboardNoticePlanHistoryItem).notice_type,
                  )
                "
              >
                {{
                  (record as DashboardNoticePlanHistoryItem).notice_type_label
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_status_label'">
              <Tag
                :color="
                  statusColor(
                    (record as DashboardNoticePlanHistoryItem).notice_status,
                  )
                "
              >
                {{
                  (record as DashboardNoticePlanHistoryItem).notice_status_label
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <div class="flex flex-wrap gap-1">
                <Tag
                  :color="
                    channelColor(
                      (record as DashboardNoticePlanHistoryItem).notice_channel,
                    )
                  "
                >
                  {{
                    (record as DashboardNoticePlanHistoryItem)
                      .notice_channel_label || '-'
                  }}
                </Tag>
                <Tag
                  v-for="attempt in (record as DashboardNoticePlanHistoryItem)
                    .notice_channel_attempts || []"
                  :key="`${attempt.channel}-${attempt.account_id || attempt.label}`"
                  :color="attemptColor(attempt.status)"
                >
                  {{ attempt.label }}：{{ attempt.status_label }}
                </Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'ips'">
              <TypographyParagraph
                :ellipsis="{
                  rows: 2,
                  tooltip: (record as DashboardNoticePlanHistoryItem).ips.join(
                    ' / ',
                  ),
                }"
                class="mb-0 break-all text-sm leading-6"
              >
                {{
                  (record as DashboardNoticePlanHistoryItem).ips.join(' / ') ||
                  (record as DashboardNoticePlanHistoryItem).ip ||
                  '-'
                }}
              </TypographyParagraph>
            </template>
            <template
              v-else-if="
                column.key === 'notice_text_preview' ||
                column.key === 'retry_label'
              "
            >
              <TypographyParagraph
                :ellipsis="{
                  rows: 2,
                  tooltip: String((record as any)[column.key] || '-'),
                }"
                class="mb-0 break-all text-sm leading-6"
              >
                {{ (record as any)[column.key] || '-' }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="
                  openOrder(
                    (record as DashboardNoticePlanHistoryItem).related_path,
                  )
                "
              >
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </Space>
    <Modal
      v-model:open="textModalOpen"
      title="人工干预通知文案"
      :confirm-loading="textSaving"
      width="760px"
      ok-text="保存"
      @ok="saveNoticeText"
    >
      <Alert
        type="warning"
        show-icon
        message="保存后，后续实际发送给用户的通知会使用这里的文案；清空并保存可恢复系统自动文案。"
        style="margin-bottom: 12px"
      />
      <Input.TextArea
        v-model:value="textValue"
        :auto-size="{ minRows: 10, maxRows: 18 }"
        placeholder="请输入实际发给用户的通知文案"
      />
      <Button type="link" class="mt-2 px-0" @click="resetNoticeText">
        清空并恢复系统文案
      </Button>
    </Modal>
  </Page>
</template>
