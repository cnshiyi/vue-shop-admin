<script lang="ts" setup>
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Space, Table, Tag, message } from 'ant-design-vue';

import {
  getDashboardServersApi,
  syncDashboardServersApi,
  type DashboardServerItem,
} from '#/api/admin';

const loading = ref(false);
const syncing = ref(false);
const keyword = ref('');
const items = ref<DashboardServerItem[]>([]);
const router = useRouter();

const columns = [
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name', width: 180 },
  { title: '用户名', dataIndex: 'username_label', key: 'username_label', width: 220 },
  { title: '服务器名', dataIndex: 'server_name', key: 'server_name', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
  { title: '是否有订单', dataIndex: 'order_no', key: 'has_order', width: 120 },
  { title: '厂商', dataIndex: 'provider', key: 'provider', width: 140 },
  { title: '账号ID', dataIndex: 'account_label', key: 'account_label', width: 160 },
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 160 },
  { title: '公网 IP', dataIndex: 'public_ip', key: 'public_ip', width: 150 },
  { title: '关联订单', dataIndex: 'order_no', key: 'order_no', width: 220 },
  { title: '到期时间', dataIndex: 'expires_at', key: 'expires_at', width: 200 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 200 },
];

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardServersApi({ keyword: keyword.value.trim() });
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

async function syncServers() {
  syncing.value = true;
  try {
    await syncDashboardServersApi();
    message.success('服务器同步完成');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '服务器同步失败');
  } finally {
    syncing.value = false;
  }
}

function goToCloudOrder(orderId: null | number, orderDetailPath?: string) {
  if (!orderId || !orderDetailPath) {
    return;
  }
  router.push(orderDetailPath).catch(() => {});
}

onMounted(loadData);
</script>

<template>
  <Page description="从真实服务器 API 查看同步后的服务器记录" title="服务列表">
    <Card>
      <template #title>
        <Space>
          <span>服务数据</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索服务器名、实例 ID、资源 ID、IP、订单号"
            style="width: 380px"
            @search="loadData"
          />
          <Button size="small" :loading="syncing" @click="syncServers">同步服务器</Button>
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :scroll="{ x: 2100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username_label'">
            <span>{{ record.username_label || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'server_name'">
            <div>{{ record.server_name || '-' }}</div>
            <div class="text-xs text-gray-400">{{ record.instance_id || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'provider'">
            <Tag color="blue">{{ record.provider_label || record.provider || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'source'">
            <Tag color="purple">{{ record.source_label || record.source || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'has_order'">
            <Tag :color="record.order_no ? 'success' : 'default'">
              {{ record.order_no ? '有订单' : '无订单' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'order_no'">
            <Button
              v-if="record.order_id && record.order_detail_path"
              type="link"
              size="small"
              @click="goToCloudOrder(record.order_id, record.order_detail_path)"
            >
              {{ record.order_no }}
            </Button>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <div>
              <Tag :color="record.is_active ? 'success' : (record.status === 'deleted' || record.status === 'terminated' ? 'default' : 'warning')">
                {{ record.status_label || record.status || '-' }}
              </Tag>
            </div>
            <div class="text-xs text-gray-400">
              {{ record.status_countdown || record.provider_status || '-' }}
            </div>
          </template>
          <template v-else-if="column.key === 'expires_at'">
            <div>{{ record.expires_at ? dayjs(record.expires_at).format('YYYY-MM-DD') : '待人工添加' }}</div>
            <div class="text-xs text-gray-400">{{ typeof record.days_left === 'number' ? `剩余 ${record.days_left} 天` : '-' }}</div>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
