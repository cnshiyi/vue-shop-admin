<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { DashboardTaskItem } from '#/api/admin';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Space, Table, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDashboardTasksApi } from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const keyword = ref('');
const items = ref<DashboardTaskItem[]>([]);

const columns: TableColumnsType<DashboardTaskItem> = [
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
  { title: '任务类型', dataIndex: 'task_label', key: 'task_label', width: 120 },
  {
    title: '云平台',
    dataIndex: 'provider_label',
    key: 'provider_label',
    width: 120,
  },
  { title: '套餐', dataIndex: 'plan_name', key: 'plan_name', width: 180 },
  { title: '公网IP', dataIndex: 'public_ip', key: 'public_ip', width: 140 },
  { title: '订单状态', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '执行状态',
    dataIndex: 'execution_status',
    key: 'execution_status',
    width: 150,
  },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' as const },
];

function asDashboardTaskItem(record: Record<string, any>) {
  return record as DashboardTaskItem;
}

function statusColor(status: string) {
  if (['active', 'auto_renew_success', 'completed'].includes(status)) {
    return 'success';
  }
  if (
    [
      'auto_renew_pending',
      'deleting',
      'expiring',
      'paid',
      'provisioning',
      'renew_pending',
      'suspended',
    ].includes(status)
  ) {
    return 'processing';
  }
  if (
    ['auto_renew_failed', 'cancelled', 'deleted', 'expired', 'failed'].includes(
      status,
    )
  ) {
    return 'error';
  }
  return 'default';
}

async function loadData() {
  loading.value = true;
  try {
    const data = await getDashboardTasksApi();
    const query = keyword.value.trim().toLowerCase();
    items.value = query
      ? data.filter((item) =>
          [
            item.order_no,
            item.plan_name,
            item.provider_label,
            item.public_ip,
            item.status_label,
            item.note,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)),
        )
      : data;
  } finally {
    loading.value = false;
  }
}

function canOpenTask(record: DashboardTaskItem) {
  return Boolean(record.related_path);
}

function openTask(record: DashboardTaskItem) {
  if (canOpenTask(record)) {
    router.push(record.related_path).catch(() => {});
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    description="聚合显示待处理云服务器任务，支持快速跳转详情"
    title="任务列表"
  >
    <Card>
      <template #title>
        <Space>
          <span>任务总览</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索订单号 / 套餐 / IP"
            style="width: 320px"
            @search="loadData"
          />
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="items"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'order_no'">
            <span>{{ asDashboardTaskItem(record).order_no }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(asDashboardTaskItem(record).status)">
              {{
                asDashboardTaskItem(record).status_label ||
                asDashboardTaskItem(record).status
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'execution_status'">
            <Tag
              :color="
                statusColor(
                  asDashboardTaskItem(record).execution_status ||
                    asDashboardTaskItem(record).status,
                )
              "
            >
              {{
                asDashboardTaskItem(record).execution_status_label ||
                asDashboardTaskItem(record).execution_status ||
                '-'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'updated_at'">
            <span>{{
              asDashboardTaskItem(record).updated_at
                ? dayjs(asDashboardTaskItem(record).updated_at).format(
                    'YYYY-MM-DD HH:mm:ss',
                  )
                : '-'
            }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              v-if="canOpenTask(asDashboardTaskItem(record))"
              type="link"
              size="small"
              @click="openTask(asDashboardTaskItem(record))"
            >
              详情
            </Button>
            <span v-else>-</span>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
