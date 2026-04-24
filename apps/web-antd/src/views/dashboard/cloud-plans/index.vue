<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

import {
  createDashboardCloudPlanApi,
  deleteDashboardCloudPlanApi,
  getDashboardCloudPlansApi,
  getDashboardCloudPricingApi,
  updateDashboardCloudPlanApi,
  type DashboardCloudPlanItem,
  type DashboardCloudPlanUpdatePayload,
  type DashboardCloudPricingItem,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const keyword = ref('');
const activeTab = ref<'plans' | 'pricing'>('plans');
const plans = ref<DashboardCloudPlanItem[]>([]);
const pricing = ref<DashboardCloudPricingItem[]>([]);
const editOpen = ref(false);
const createMode = ref(false);
const editingPlan = ref<DashboardCloudPlanItem | null>(null);
const editForm = ref<DashboardCloudPlanUpdatePayload>({
  provider: 'aws_lightsail',
  region_code: 'ap-southeast-1',
  region_name: '新加坡',
  plan_name: '',
  plan_description: '',
  cpu: '',
  memory: '',
  storage: '',
  bandwidth: '',
  currency: 'USDT',
  cost_price: 0,
  price: 0,
  sort_order: 0,
  is_active: true,
});

const providerOptions = [
  { label: 'AWS 光帆服务器', value: 'aws_lightsail' },
  { label: '阿里云轻量云', value: 'aliyun_simple' },
];

const planColumns: TableColumnsType<DashboardCloudPlanItem> = [
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 140 },
  { title: '厂商', dataIndex: 'provider', key: 'provider', width: 120 },
  { title: '套餐名', dataIndex: 'plan_name', key: 'plan_name', width: 160 },
  { title: '配置', dataIndex: 'plan_description', key: 'plan_description', width: 280 },
  { title: 'CPU', dataIndex: 'cpu', key: 'cpu', width: 90 },
  { title: '内存', dataIndex: 'memory', key: 'memory', width: 90 },
  { title: '存储', dataIndex: 'storage', key: 'storage', width: 110 },
  { title: '带宽', dataIndex: 'bandwidth', key: 'bandwidth', width: 90 },
  { title: '进货价', dataIndex: 'cost_price', key: 'cost_price', width: 110 },
  { title: '出售价', dataIndex: 'price', key: 'price', width: 110 },
  { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 90 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' as const },
];

const pricingColumns: TableColumnsType<DashboardCloudPricingItem> = [
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 140 },
  { title: '厂商', dataIndex: 'provider', key: 'provider', width: 120 },
  { title: '套餐名', dataIndex: 'plan_name', key: 'plan_name', width: 140 },
  { title: '规格编码', dataIndex: 'bundle_code', key: 'bundle_code', width: 180 },
  { title: '配置', dataIndex: 'plan_description', key: 'plan_description', width: 280 },
  { title: '进货价', dataIndex: 'cost_price', key: 'cost_price', width: 110 },
  { title: '出售价', dataIndex: 'price', key: 'price', width: 110 },
  { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 90 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90 },
];

const currentColumns = computed(() => (activeTab.value === 'plans' ? planColumns : pricingColumns));
const currentItems = computed(() => (activeTab.value === 'plans' ? plans.value : pricing.value));

function asDashboardCloudPlanItem(record: Record<string, any>) {
  return record as DashboardCloudPlanItem;
}

function resetEditForm() {
  editForm.value = {
    provider: 'aws_lightsail',
    region_code: 'ap-southeast-1',
    region_name: '新加坡',
    plan_name: '',
    plan_description: '',
    cpu: '',
    memory: '',
    storage: '',
    bandwidth: '',
    currency: 'USDT',
    cost_price: 0,
    price: 0,
    sort_order: 0,
    is_active: true,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const params = { keyword: keyword.value.trim() };
    const [planList, pricingList] = await Promise.all([
      getDashboardCloudPlansApi(params),
      getDashboardCloudPricingApi(params),
    ]);
    plans.value = planList;
    pricing.value = pricingList;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  createMode.value = true;
  editingPlan.value = null;
  resetEditForm();
  editOpen.value = true;
}

function openEdit(record: DashboardCloudPlanItem) {
  createMode.value = false;
  editingPlan.value = record;
  editForm.value = {
    provider: record.provider,
    region_code: record.region_code,
    region_name: record.region_name,
    plan_name: record.plan_name || '',
    plan_description: record.plan_description || '',
    cpu: record.cpu || '',
    memory: record.memory || '',
    storage: record.storage || '',
    bandwidth: record.bandwidth || '',
    currency: record.currency || 'USDT',
    cost_price: Number(record.cost_price || 0),
    price: Number(record.price || 0),
    sort_order: Number(record.sort_order || 0),
    is_active: !!record.is_active,
  };
  editOpen.value = true;
}

async function saveEdit() {
  saving.value = true;
  try {
    if (createMode.value) {
      await createDashboardCloudPlanApi(editForm.value);
      message.success('套餐已创建');
    } else if (editingPlan.value) {
      await updateDashboardCloudPlanApi(editingPlan.value.id, editForm.value);
      message.success('套餐已更新');
    }
    editOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || (createMode.value ? '套餐创建失败' : '套餐更新失败'));
  } finally {
    saving.value = false;
  }
}

async function removePlan(planId: number) {
  deletingId.value = planId;
  try {
    await deleteDashboardCloudPlanApi(planId);
    message.success('套餐已删除');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '套餐删除失败');
  } finally {
    deletingId.value = null;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

onMounted(loadData);
</script>

<template>
  <Page description="套餐改为后台手动创建和维护，已移除同步入口" title="套餐列表">
    <Card>
      <template #title>
        <Space>
          <span>套餐与价格</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索地区、厂商、套餐名"
            style="width: 360px"
            @search="loadData"
          />
          <Button size="small" :type="activeTab === 'plans' ? 'primary' : 'default'" @click="activeTab = 'plans'">套餐列表</Button>
          <Button size="small" :type="activeTab === 'pricing' ? 'primary' : 'default'" @click="activeTab = 'pricing'">价格列表</Button>
          <Button v-if="activeTab === 'plans'" size="small" type="primary" @click="openCreate">新增套餐</Button>
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table :columns="currentColumns" :data-source="currentItems" :loading="loading" row-key="id" :pagination="{ pageSize: 20 }" :scroll="{ x: 1700 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'provider'">
            <Tag color="blue">{{ record.provider_label || record.provider || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'cost_price'">
            <Tag color="default">{{ record.cost_price || '0' }} {{ record.currency || 'USDT' }}</Tag>
          </template>
          <template v-else-if="column.key === 'price'">
            <Tag color="gold">{{ record.price }} {{ record.currency || 'USDT' }}</Tag>
          </template>
          <template v-else-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'success' : 'default'">{{ record.is_active ? '启用' : '停用' }}</Tag>
          </template>
          <template v-else-if="column.key === 'plan_description'">
            <span>{{ record.plan_description || `${record.cpu} / ${record.memory} / ${record.storage} / ${record.bandwidth}` }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button type="link" size="small" @click="openEdit(asDashboardCloudPlanItem(record))">编辑</Button>
              <Popconfirm title="确认删除该套餐？" @confirm="removePlan(record.id)">
                <Button type="link" danger size="small" :loading="deletingId === record.id">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="editOpen" :title="createMode ? '新增套餐' : '编辑套餐'" :confirm-loading="saving" @ok="saveEdit">
      <Space direction="vertical" style="width: 100%">
        <Select v-model:value="editForm.provider" :options="providerOptions" placeholder="选择云厂商" />
        <Input v-model:value="editForm.region_code" placeholder="地区代码，如 ap-southeast-1" />
        <Input v-model:value="editForm.region_name" placeholder="地区名称，如 新加坡" />
        <Input v-model:value="editForm.plan_name" placeholder="套餐名" />
        <Input v-model:value="editForm.plan_description" placeholder="套餐描述" />
        <Input v-model:value="editForm.cpu" placeholder="CPU，如 2核" />
        <Input v-model:value="editForm.memory" placeholder="内存，如 2GB" />
        <Input v-model:value="editForm.storage" placeholder="存储，如 60GB SSD" />
        <Input v-model:value="editForm.bandwidth" placeholder="带宽，如 3TB / 30Mbps" />
        <Input v-model:value="editForm.currency" placeholder="币种" />
        <InputNumber v-model:value="editForm.cost_price" style="width: 100%" :min="0" :step="0.01" addon-before="进货价" />
        <InputNumber v-model:value="editForm.price" style="width: 100%" :min="0" :step="0.01" addon-before="出售价" />
        <InputNumber v-model:value="editForm.sort_order" style="width: 100%" :step="1" addon-before="排序" />
        <Space>
          <span>启用</span>
          <Switch v-model:checked="editForm.is_active" />
        </Space>
      </Space>
    </Modal>
  </Page>
</template>
