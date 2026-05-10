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
  { title: '队列状态', dataIndex: 'queue_status_label', key: 'queue_status_label', width: 150 },
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name', width: 170 },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 190 },
  { title: '通知时间', dataIndex: 'notice_at', key: 'notice_at', width: 180 },
  { title: '到期时间', dataIndex: 'service_expires_at', key: 'service_expires_at', width: 180 },
  { title: '计划', dataIndex: 'plan', key: 'plan', width: 240 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' },
];

const historyColumns: TableColumnsType<DashboardNoticePlanHistoryItem> = [
  { title: '发送时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '通知类型', dataIndex: 'notice_type_label', key: 'notice_type_label', width: 150 },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name', width: 170 },
  { title: '结果', dataIndex: 'result_label', key: 'result_label', width: 100 },
  { title: '目标 Chat', dataIndex: 'target_chat_id', key: 'target_chat_id', width: 140 },
  { title: '通知预览', dataIndex: 'text_preview', key: 'text_preview', width: 420 },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
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

function fmtValue(value?: null | string) {
  return value || '-';
}

function queueColor(status?: string) {
  if (status === 'due_now' || status === 'fallback_notice') return 'error';
  if (status === 'within_window') return 'warning';
  return 'processing';
}

function noticeColor(type?: string) {
  if (type === 'renew_notice') return 'blue';
  if (type === 'auto_renew_notice') return 'purple';
  if (type === 'delete_notice') return 'orange';
  if (type === 'recycle_notice') return 'cyan';
  return 'default';
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
  <Page description="按生命周期通知队列展示到期提醒、自动续费预提醒、删机提醒和 IP 回收提醒" title="通知计划">
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
          <Descriptions.Item label="最近24小时未送达">
            <Tag color="error">{{ detail?.recent_failure_count ?? 0 }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前待通知" :span="2">
            <Tag color="warning">{{ detail?.due_count ?? 0 }}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="待通知列表">
        <Table
          :columns="planColumns"
          :data-source="dueItems"
          :loading="loading"
          :pagination="false"
          :row-key="rowKey"
          :scroll="{ x: 1480 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'notice_type_label'">
              <Tag :color="noticeColor((record as DashboardNoticePlanItem).notice_type)">
                {{ (record as DashboardNoticePlanItem).notice_type_label }}
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
            <template v-else-if="column.key === 'service_expires_at'">
              {{ fmtTime((record as DashboardNoticePlanItem).service_expires_at) }}
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>{{ (record as DashboardNoticePlanItem).provider_label || '-' }}</div>
                <div style="color: var(--color-text-secondary)">
                  自动续费 {{ fmtTime((record as DashboardNoticePlanItem).auto_renew_at) }}
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
        <Empty v-if="dueItems.length === 0 && !loading" description="当前没有待通知任务" />
      </Card>

      <Card title="未来通知计划">
        <Table
          :columns="planColumns"
          :data-source="futurePlanItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="rowKey"
          :scroll="{ x: 1480 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'notice_type_label'">
              <Tag :color="noticeColor((record as DashboardNoticePlanItem).notice_type)">
                {{ (record as DashboardNoticePlanItem).notice_type_label }}
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
            <template v-else-if="column.key === 'service_expires_at'">
              {{ fmtTime((record as DashboardNoticePlanItem).service_expires_at) }}
            </template>
            <template v-else-if="column.key === 'plan'">
              <div>
                <div>{{ (record as DashboardNoticePlanItem).provider_label || '-' }}</div>
                <div style="color: var(--color-text-secondary)">
                  自动续费 {{ fmtTime((record as DashboardNoticePlanItem).auto_renew_at) }}
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

      <Card title="通知历史">
        <Table
          :columns="historyColumns"
          :data-source="historyItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :row-key="historyRowKey"
          :scroll="{ x: 1480 }"
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
            <template v-else-if="column.key === 'result_label'">
              <Tag :color="(record as DashboardNoticePlanHistoryItem).delivered ? 'success' : 'error'">
                {{ (record as DashboardNoticePlanHistoryItem).result_label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'target_chat_id'">
              {{ fmtValue(String((record as DashboardNoticePlanHistoryItem).target_chat_id || '')) }}
            </template>
            <template v-else-if="column.key === 'text_preview'">
              <TypographyParagraph :ellipsis="{ rows: 2, tooltip: (record as DashboardNoticePlanHistoryItem).text_preview }" class="mb-0 break-all text-sm leading-6">
                {{ (record as DashboardNoticePlanHistoryItem).text_preview || '-' }}
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
