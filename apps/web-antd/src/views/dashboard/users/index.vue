<script lang="ts" setup>
import type { DashboardUserItem } from '#/api/admin';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
} from 'ant-design-vue';

import {
  getDashboardUsersApi,
  updateDashboardUserBalanceApi,
  updateDashboardUserDiscountApi,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const items = ref<DashboardUserItem[]>([]);
const editOpen = ref(false);
const currentRow = ref<DashboardUserItem | null>(null);
const router = useRouter();
const formState = reactive({
  balance: '0',
  balance_trx: '0',
  cloud_discount_rate: '100.00',
});

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  {
    title: 'Telegram ID',
    dataIndex: 'tg_user_id',
    key: 'tg_user_id',
    width: 180,
  },
  {
    title: '展示名',
    dataIndex: 'display_name',
    key: 'display_name',
    width: 180,
  },
  {
    title: '用户名',
    dataIndex: 'username_label',
    key: 'username_label',
    width: 260,
  },
  { title: '代理数', dataIndex: 'proxy_count', key: 'proxy_count', width: 110 },
  {
    title: '折扣',
    dataIndex: 'cloud_discount_rate',
    key: 'cloud_discount_rate',
    width: 120,
  },
  { title: 'USDT 余额', dataIndex: 'balance', key: 'balance', width: 140 },
  {
    title: 'TRX 余额',
    dataIndex: 'balance_trx',
    key: 'balance_trx',
    width: 140,
  },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 220 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 180 },
];

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardUsersApi({ keyword: keyword.value.trim() });
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

function openEdit(record: DashboardUserItem) {
  currentRow.value = record;
  formState.balance = record.balance;
  formState.balance_trx = record.balance_trx;
  formState.cloud_discount_rate = record.cloud_discount_rate || '100.00';
  editOpen.value = true;
}

function openBalanceDetail(record: DashboardUserItem) {
  router.push(`/admin/users/${record.id}/balance-details`).catch(() => {});
}

async function submitEdit() {
  if (!currentRow.value) return;
  saving.value = true;
  try {
    await updateDashboardUserBalanceApi(currentRow.value.id, {
      balance: formState.balance,
      balance_trx: formState.balance_trx,
    });
    await updateDashboardUserDiscountApi(currentRow.value.id, {
      cloud_discount_rate: formState.cloud_discount_rate,
    });
    message.success('用户余额和折扣已更新');
    editOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    description="读取 Django 用户数据，支持用户名、折扣与余额修改"
    title="用户列表"
  >
    <Card>
      <template #title>
        <Space>
          <span>用户数据</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索 TG ID、用户名、昵称"
            style="width: 320px"
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
        :scroll="{ x: 1520 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'display_name'">
            <div class="font-medium">{{ record.display_name || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'username_label'">
            <span>{{ record.username_label || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'proxy_count'">
            <span>{{ record.proxy_count || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'cloud_discount_rate'">
            <span>{{ record.cloud_discount_rate || '100.00' }}%</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                type="link"
                @click="openBalanceDetail(record as DashboardUserItem)"
                >
余额明细
</Button>
              <Button type="link" @click="openEdit(record as DashboardUserItem)">
编辑
</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="saving"
      title="编辑余额/折扣"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="用户">
          <Input :value="currentRow?.display_name || ''" disabled />
        </Form.Item>
        <Form.Item label="USDT 余额">
          <Input
            v-model:value="formState.balance"
            placeholder="请输入 USDT 余额"
          />
        </Form.Item>
        <Form.Item label="TRX 余额">
          <Input
            v-model:value="formState.balance_trx"
            placeholder="请输入 TRX 余额"
          />
        </Form.Item>
        <Form.Item label="折扣(%)">
          <Input
            v-model:value="formState.cloud_discount_rate"
            placeholder="请输入折扣，100 表示无折扣"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
