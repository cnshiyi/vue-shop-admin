<script lang="ts" setup>
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Space, Table, Tag } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

import { getDashboardCloudIpLogsApi } from '#/api/admin';
import type { DashboardCloudIpLogItem } from '#/api/admin';

const loading = ref(false);
const keyword = ref('');
const items = ref<DashboardCloudIpLogItem[]>([]);

const columns: TableColumnsType<DashboardCloudIpLogItem> = [
  { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '事件', dataIndex: 'event_type', key: 'event_type', width: 100 },
  {
    title: '用户',
    dataIndex: 'user_display_name',
    key: 'user_display_name',
    width: 140,
  },
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
  { title: '服务器', dataIndex: 'asset_name', key: 'asset_name', width: 180 },
  { title: '当前IP', dataIndex: 'public_ip', key: 'public_ip', width: 140 },
  { title: '实例ID', dataIndex: 'instance_id', key: 'instance_id', width: 180 },
  { title: '说明', dataIndex: 'note', key: 'note', width: 420 },
];

function eventColor(eventType: string) {
  if (eventType === 'created') return 'success';
  if (eventType === 'deleted') return 'error';
  if (eventType === 'changed') return 'processing';
  return 'default';
}

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardCloudIpLogsApi({
      keyword: keyword.value.trim(),
      log_type: 'server',
    });
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    description="记录服务器创建、续费、删除等关键过程，支持关键字搜索"
    title="服务器日志"
  >
    <Card>
      <template #title>
        <Space>
          <span>服务器日志</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索订单号 / 用户 / 服务器 / IP / 说明"
            style="width: 360px"
            @search="loadData"
          />
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="items"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 20 }"
        :scroll="{ x: 1700 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'created_at'">
            <span>{{
              record.created_at
                ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'
            }}</span>
          </template>
          <template v-else-if="column.key === 'event_type'">
            <Tag :color="eventColor(record.event_type)">{{
              record.event_label || record.event_type
            }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
