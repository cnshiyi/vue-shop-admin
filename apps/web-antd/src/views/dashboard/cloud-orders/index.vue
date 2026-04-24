<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Space, Table, Tag } from 'ant-design-vue';

import {
  getDashboardCloudOrdersApi,
  type DashboardCloudOrderItem,
} from '#/api/admin';

const loading = ref(false);
const keyword = ref('');
const items = ref<DashboardCloudOrderItem[]>([]);
const router = useRouter();

const columns = [
  { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 220 },
  { title: '厂商', dataIndex: 'provider', key: 'provider', width: 140 },
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 160 },
  { title: '套餐', dataIndex: 'plan_name', key: 'plan_name', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '公网 IP', dataIndex: 'public_ip', key: 'public_ip', width: 160 },
  { title: '金额', dataIndex: 'total_amount', key: 'total_amount', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 220 },
];

function statusColor(status: string) {
  if (['completed', 'paid'].includes(status)) return 'green';
  if (['pending', 'provisioning', 'renew_pending', 'expiring'].includes(status)) return 'orange';
  if (['failed', 'cancelled', 'expired', 'deleted'].includes(status)) return 'red';
  return 'blue';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    cancelled: '已取消',
    completed: '已完成',
    deleted: '已删除',
    expired: '已过期',
    expiring: '即将到期',
    failed: '失败',
    paid: '已支付',
    pending: '待处理',
    provisioning: '开通中',
    renew_pending: '续费待处理',
    suspended: '已关机',
    deleting: '删除中',
  };
  return labels[status] || status || '-';
}

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardCloudOrdersApi({ keyword: keyword.value.trim() });
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

onMounted(loadData);

function goToDetail(orderId: number) {
  router.push(`/admin/cloud-orders/${orderId}`).catch(() => {});
}
</script>

<template>
  <Page description="读取 Django 订单数据" title="订单列表">
    <Card>
      <template #title>
        <Space>
          <span>订单数据</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索订单号、厂商、地区、套餐、IP"
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
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'order_no'">
            <a @click="goToDetail(Number(record.id))">{{ record.order_no }}</a>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(record.status)">{{ record.status_label || statusLabel(record.status) }}</Tag>
          </template>
          <template v-else-if="column.key === 'total_amount'">
            {{ record.total_amount }} USDT
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
