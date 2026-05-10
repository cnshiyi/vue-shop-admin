<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  DashboardNoticePlanDetail,
  DashboardNoticePlanHistoryItem,
  DashboardNoticePlanItem,
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
  message,
  Space,
  Table,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDashboardNoticePlanApi } from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const detail = ref<DashboardNoticePlanDetail | null>(null);

const planColumns: TableColumnsType<DashboardNoticePlanItem> = [
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '通知类型', dataIndex: 'notice_type_label', key: 'notice_type_label', width: 150 },
  { title: '通知状态', dataIndex: 'notice_status_label', key: 'notice_status_label', width: 170 },
  { title: '通知渠道', dataIndex: 'notice_channel_label', key: 'notice_channel_label', width: 190 },
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name', width: 160 },
  { title: '通知时间', dataIndex: 'notice_at', key: 'notice_at', width: 180 },
  { title: '通知文案', dataIndex: 'notice_text_preview', key: 'notice_text_preview', width: 420 },
  { title: '队列状态', dataIndex: 'queue_status_label', key: 'queue_status_label', width: 150 },
  { title: '重试说明', dataIndex: 'retry_label', key: 'retry_label', width: 260 },
  { title: '计划', dataIndex: 'plan', key: 'plan', width: 260 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const historyColumns: TableColumnsType<DashboardNoticePlanHistoryItem> = [
  { title: '发送时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '通知类型', dataIndex: 'notice_type_label', key: 'notice_type_label', width: 150 },
  { title: '通知状态', dataIndex: 'notice_status_label', key: 'notice_status_label', width: 170 },
  { title: '通知渠道', dataIndex: 'notice_channel_label', key: 'notice_channel_label', width: 190 },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name', width: 160 },
  { title: '通知文案', dataIndex: 'text_preview', key: 'text_preview', width: 460 },
  { title: '重试说明', dataIndex: 'retry_label', key: 'retry_label', width: 300 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const dueItems = computed(() => detail.value?.due_items || []);
const futurePlanItems = computed(() => detail.value?.future_plan_items || []);
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
  if (channel === 'telegram_chat') return 'cyan';
  return 'blue';
}

function rowKey(record: DashboardNoticePlanItem) {
  return `${record.notice_type}-${record.order_id || record.id}`;
}

function historyRowKey(record: DashboardNoticePlanHistoryItem) {
  return record.id;
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

function goTasks() {
  router.push('/admin/tasks').catch(() => {});
}

onMounted(loadData);
</script>

<template>
  <Page description="展示两天内待通知、未来通知计划、历史通知，并标明状态、渠道和失败重试规则" title="通知计划">
    <Space direction="vertical" style="width: 100%" :size="16">
      <Card :loading="loading">
        <template #title>
          <Space wrap>
            <Button size="small" @click="goTasks">返回任务列表</Button>
            <Button size="small" :loading="loading" @click="loadData">刷新</Button>
            <span>{{ detail?.task_label || '通知计划' }}</span>
            <Tag color="processing">{{ detail?.status_label || '置顶任务' }}</Tag>
          </Space>
        </template>

        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="任务名称">{{ detail?.task_label || '-' }}</Descriptions.Item>
          <Descriptions.Item label="巡检频率">
            {{ detail?.interval_minutes ? `${detail.interval_minutes} 分钟` : '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="下次巡检">{{ fmtTime(detail?.next_run_at) }}</Descriptions.Item>
          <Descriptions.Item label="上次通知">{{ fmtTime(detail?.last_run_at) }}</Descriptions.Item>
          <Descriptions.Item label="最近24小时送达">
            <Tag color="success">{{ detail?.recent_success_count ?? 0 }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最近24小时失败">
            <Tag color="error">{{ detail?.recent_failure_count ?? 0 }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="两天内待通知" :span="2">
            <Tag color="warning">{{ detail?.due_count ?? 0 }}</Tag>
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

      <Card title="待通知列表（两天内）">
        <Table
          :columns="planColumns"
          :data-source="dueItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="rowKey"
          :scroll="{ x: 2390 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'notice_type_label'">
              <Tag :color="noticeColor((record as DashboardNoticePlanItem).notice_type)">
                {{ (record as DashboardNoticePlanItem).notice_type_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_status_label'">
              <Tag :color="statusColor((record as DashboardNoticePlanItem).notice_status)">
                {{ (record as DashboardNoticePlanItem).notice_status_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <Tag :color="channelColor((record as DashboardNoticePlanItem).notice_channel)">
                {{ (record as DashboardNoticePlanItem).notice_channel_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'queue_status_label'">
              <Tag :color="queueColor((record as DashboardNoticePlanItem).queue_status)">
                {{ (record as DashboardNoticePlanItem).queue_status_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_at'">
              {{ fmtTime((record as DashboardNoticePlanItem).notice_at) }}
            </template>
            <template v-else-if="column.key === 'notice_text_preview' || column.key === 'retry_label'">
              <TypographyParagraph :ellipsis="{ rows: 2, tooltip: String((record as any)[column.key] || '-') }" class="mb-0 break-all text-sm leading-6">
                {{ (record as any)[column.key] || '-' }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>{{ (record as DashboardNoticePlanItem).provider_label || '-' }}</div>
                <div style="color: var(--color-text-secondary)">
                  到期 {{ fmtTime((record as DashboardNoticePlanItem).service_expires_at) }} / 自动续费
                  {{ fmtTime((record as DashboardNoticePlanItem).auto_renew_at) }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  关机 {{ fmtTime((record as DashboardNoticePlanItem).suspend_at) }} / 删机
                  {{ fmtTime((record as DashboardNoticePlanItem).delete_at) }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button type="link" size="small" @click="openOrder((record as DashboardNoticePlanItem).related_path)">
                订单详情
              </Button>
            </template>
          </template>
        </Table>
        <Empty v-if="dueItems.length === 0 && !loading" description="当前两天内没有待通知任务" />
      </Card>

      <Card title="未来通知计划（10个）">
        <Table
          :columns="planColumns"
          :data-source="futurePlanItems"
          :loading="loading"
          :pagination="false"
          :row-key="rowKey"
          :scroll="{ x: 2390 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'notice_type_label'">
              <Tag :color="noticeColor((record as DashboardNoticePlanItem).notice_type)">
                {{ (record as DashboardNoticePlanItem).notice_type_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_status_label'">
              <Tag :color="statusColor((record as DashboardNoticePlanItem).notice_status)">
                {{ (record as DashboardNoticePlanItem).notice_status_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <Tag :color="channelColor((record as DashboardNoticePlanItem).notice_channel)">
                {{ (record as DashboardNoticePlanItem).notice_channel_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'queue_status_label'">
              <Tag :color="queueColor((record as DashboardNoticePlanItem).queue_status)">
                {{ (record as DashboardNoticePlanItem).queue_status_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_at'">
              {{ fmtTime((record as DashboardNoticePlanItem).notice_at) }}
            </template>
            <template v-else-if="column.key === 'notice_text_preview' || column.key === 'retry_label'">
              <TypographyParagraph :ellipsis="{ rows: 2, tooltip: String((record as any)[column.key] || '-') }" class="mb-0 break-all text-sm leading-6">
                {{ (record as any)[column.key] || '-' }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>{{ (record as DashboardNoticePlanItem).provider_label || '-' }}</div>
                <div style="color: var(--color-text-secondary)">
                  到期 {{ fmtTime((record as DashboardNoticePlanItem).service_expires_at) }} / 自动续费
                  {{ fmtTime((record as DashboardNoticePlanItem).auto_renew_at) }}
                </div>
                <div style="color: var(--color-text-secondary)">
                  关机 {{ fmtTime((record as DashboardNoticePlanItem).suspend_at) }} / 删机
                  {{ fmtTime((record as DashboardNoticePlanItem).delete_at) }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button type="link" size="small" @click="openOrder((record as DashboardNoticePlanItem).related_path)">
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="历史通知">
        <Table
          :columns="historyColumns"
          :data-source="historyItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="historyRowKey"
          :scroll="{ x: 2110 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'created_at'">
              {{ fmtTime((record as DashboardNoticePlanHistoryItem).created_at) }}
            </template>
            <template v-else-if="column.key === 'notice_type_label'">
              <Tag :color="noticeColor((record as DashboardNoticePlanHistoryItem).notice_type)">
                {{ (record as DashboardNoticePlanHistoryItem).notice_type_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_status_label'">
              <Tag :color="statusColor((record as DashboardNoticePlanHistoryItem).notice_status)">
                {{ (record as DashboardNoticePlanHistoryItem).notice_status_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'notice_channel_label'">
              <Tag :color="channelColor((record as DashboardNoticePlanHistoryItem).notice_channel)">
                {{ (record as DashboardNoticePlanHistoryItem).notice_channel_label || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'text_preview' || column.key === 'retry_label'">
              <TypographyParagraph :ellipsis="{ rows: 2, tooltip: String((record as any)[column.key] || '-') }" class="mb-0 break-all text-sm leading-6">
                {{ (record as any)[column.key] || '-' }}
              </TypographyParagraph>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button type="link" size="small" @click="openOrder((record as DashboardNoticePlanHistoryItem).related_path)">
                订单详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </Space>
  </Page>
</template>
