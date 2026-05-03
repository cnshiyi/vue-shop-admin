<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { DashboardShutdownLog } from '#/api/admin';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Space, Table, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDashboardShutdownLogsApi } from '#/api/admin';

const loading = ref(false);
const items = ref<DashboardShutdownLog[]>([]);

const columns: TableColumnsType<DashboardShutdownLog> = [
  { title: 'IP', dataIndex: 'public_ip', key: 'public_ip', width: 150 },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 220 },
  {
    title: '服务商',
    dataIndex: 'provider_label',
    key: 'provider_label',
    width: 140,
  },
  {
    title: '账号ID',
    dataIndex: 'external_account_id',
    key: 'external_account_id',
    width: 190,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 170,
  },
  {
    title: '到期时间',
    dataIndex: 'service_expires_at',
    key: 'service_expires_at',
    width: 190,
  },
  { title: '关机时间', dataIndex: 'suspend_at', key: 'suspend_at', width: 190 },
  { title: '删机时间', dataIndex: 'delete_at', key: 'delete_at', width: 190 },
  { title: '日志时间', dataIndex: 'logged_at', key: 'logged_at', width: 190 },
  { title: '说明', dataIndex: 'note', key: 'note', width: 320 },
];

function formatTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function expiryColor(value?: null | string) {
  if (!value) return 'default';
  const hours = dayjs(value).diff(dayjs(), 'hour');
  if (hours <= 0) return 'red';
  if (hours <= 24) return 'volcano';
  if (hours <= 72) return 'orange';
  if (hours <= 7 * 24) return 'gold';
  if (hours <= 30 * 24) return 'blue';
  return 'green';
}

function asDashboardShutdownLog(record: Record<string, any>) {
  return record as DashboardShutdownLog;
}

function accountText(record: DashboardShutdownLog) {
  return (
    record.external_account_id ||
    record.account_label ||
    (record.cloud_account_id ? `#${record.cloud_account_id}` : '-')
  );
}

function rowClassName(record: DashboardShutdownLog) {
  return record.is_old_shutdown ? 'old-shutdown-row' : '';
}

function statusColor(record: DashboardShutdownLog) {
  if (record.is_old_shutdown) return 'default';
  if (['deleted', 'failed'].includes(record.status)) return 'red';
  if (['expired', 'suspended'].includes(record.status)) return 'volcano';
  if (['renew_pending', 'stopped'].includes(record.status)) return 'orange';
  if (['pending', 'starting', 'stopping'].includes(record.status))
    return 'blue';
  if (['completed', 'paid', 'running'].includes(record.status)) return 'green';
  return 'purple';
}

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardShutdownLogsApi({ limit: 200 });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    description="展示代理/云服务器到期后的关机计划与关机日志；关机超过 7 天的记录自动下沉。"
    title="关机日志"
  >
    <Card :loading="loading">
      <template #title>
        <Space>
          <span>关机日志 / 计划</span>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="items"
        :pagination="{ pageSize: 20 }"
        :row-class-name="rowClassName"
        :scroll="{ x: 1780 }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'public_ip'">
            <Tag>{{ record.public_ip || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'provider_label'">
            <div class="flex flex-col gap-2 py-1">
              <Tag>{{ record.provider_label || record.provider || '-' }}</Tag>
              <span
                v-if="record.cloud_account_name"
                class="text-xs text-gray-400"
              >
                {{ record.cloud_account_name }}
              </span>
            </div>
          </template>
          <template v-else-if="column.key === 'external_account_id'">
            <span class="leading-7">{{
              accountText(asDashboardShutdownLog(record))
            }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(asDashboardShutdownLog(record))">
              {{ record.status_label || record.status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'user_display_name'">
            <span
              v-if="
                record.user_display_name &&
                record.user_display_name !== '未绑定用户'
              "
            >
              {{ record.user_display_name }}
              <span class="text-gray-400">{{
                record.username_label && record.username_label !== '-'
                  ? record.username_label
                  : ''
              }}</span>
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'service_expires_at'">
            <Tag :color="expiryColor(record.service_expires_at)">
              {{ formatTime(record.service_expires_at) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'suspend_at'">
            <Tag :color="expiryColor(record.suspend_at)">
              {{ formatTime(record.suspend_at) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'delete_at'">
            <Tag :color="expiryColor(record.delete_at)">
              {{ formatTime(record.delete_at) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'logged_at'">
            {{ formatTime(record.logged_at) }}
          </template>
          <template v-else-if="column.key === 'note'">
            <span>{{
              record.note ||
              (record.is_old_shutdown ? '关机超过 7 天，已下沉' : '-')
            }}</span>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>

<style scoped>
:deep(.ant-table-tbody > tr > td) {
  padding-top: 14px;
  padding-bottom: 14px;
}

:deep(.old-shutdown-row) {
  opacity: 0.55;
}
</style>
