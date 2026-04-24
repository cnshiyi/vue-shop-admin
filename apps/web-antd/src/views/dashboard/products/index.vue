<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

import {
  createDashboardProductApi,
  getDashboardProductsApi,
  updateDashboardProductApi,
  type DashboardProductItem,
  type DashboardProductPayload,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const editOpen = ref(false);
const current = ref<DashboardProductItem | null>(null);
const items = ref<DashboardProductItem[]>([]);
const formState = reactive<DashboardProductPayload>({
  content_image: '',
  content_text: '',
  content_type: 'text',
  content_video: '',
  description: '',
  is_active: true,
  name: '',
  price: '0.00',
  sort_order: 0,
  stock: -1,
});

const columns: TableColumnsType<DashboardProductItem> = [
  { title: '商品名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
  { title: '库存', dataIndex: 'stock', key: 'stock', width: 100 },
  { title: '内容类型', dataIndex: 'content_type', key: 'content_type', width: 120 },
  { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 90 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' as const },
];

const productDescriptionValue = computed({
  get: () => formState.description ?? '',
  set: (value: string | number) => {
    formState.description = String(value || '');
  },
});

const productContentTextValue = computed({
  get: () => formState.content_text ?? '',
  set: (value: string | number) => {
    formState.content_text = String(value || '');
  },
});

const productContentImageValue = computed({
  get: () => formState.content_image ?? '',
  set: (value: string | number) => {
    formState.content_image = String(value || '');
  },
});

const productContentVideoValue = computed({
  get: () => formState.content_video ?? '',
  set: (value: string | number) => {
    formState.content_video = String(value || '');
  },
});

function asDashboardProductItem(record: Record<string, any>) {
  return record as DashboardProductItem;
}

function productIsActive(record: Record<string, any>) {
  return asDashboardProductItem(record).is_active;
}

function productDescriptionOf(record: Record<string, any>) {
  return asDashboardProductItem(record).description || '-';
}

function resetForm() {
  formState.content_image = '';
  formState.content_text = '';
  formState.content_type = 'text';
  formState.content_video = '';
  formState.description = '';
  formState.is_active = true;
  formState.name = '';
  formState.price = '0.00';
  formState.sort_order = 0;
  formState.stock = -1;
}

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardProductsApi({ keyword: keyword.value.trim() });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  current.value = null;
  resetForm();
  editOpen.value = true;
}

function openEdit(record: DashboardProductItem) {
  current.value = record;
  formState.content_image = record.content_image || '';
  formState.content_text = record.content_text || '';
  formState.content_type = record.content_type || 'text';
  formState.content_video = record.content_video || '';
  formState.description = record.description || '';
  formState.is_active = !!record.is_active;
  formState.name = record.name || '';
  formState.price = record.price || '0.00';
  formState.sort_order = record.sort_order || 0;
  formState.stock = record.stock;
  editOpen.value = true;
}

async function submitEdit() {
  saving.value = true;
  try {
    const payload: DashboardProductPayload = {
      content_image: formState.content_image || null,
      content_text: formState.content_text || null,
      content_type: formState.content_type,
      content_video: formState.content_video || null,
      description: formState.description || null,
      is_active: formState.is_active,
      name: formState.name.trim(),
      price: formState.price,
      sort_order: Number(formState.sort_order || 0),
      stock: Number(formState.stock),
    };
    if (current.value) {
      await updateDashboardProductApi(current.value.id, payload);
      message.success('商品已更新');
    } else {
      await createDashboardProductApi(payload);
      message.success('商品已创建');
    }
    editOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '商品保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page description="在后台管理订阅商品，供机器人“订阅”入口展示" title="商品管理">
    <Card>
      <template #title>
        <Space>
          <span>订阅商品</span>
          <Input.Search v-model:value="keyword" allow-clear enter-button="搜索" placeholder="搜索商品名称 / 描述" style="width: 320px" @search="loadData" />
          <Button type="primary" size="small" @click="openCreate">添加商品</Button>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="items" :loading="loading" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'is_active'">
            <Tag :color="productIsActive(record) ? 'success' : 'default'">{{ productIsActive(record) ? '上架' : '下架' }}</Tag>
          </template>
          <template v-else-if="column.key === 'description'">
            <span>{{ productDescriptionOf(record) }}</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" size="small" @click="openEdit(asDashboardProductItem(record))">编辑</Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="editOpen" :confirm-loading="saving" :title="current ? '编辑商品' : '添加商品'" width="760px" @ok="submitEdit">
      <Form layout="vertical">
        <Form.Item label="商品名称">
          <Input v-model:value="formState.name" placeholder="请输入商品名称" />
        </Form.Item>
        <Form.Item label="商品描述">
          <Input.TextArea v-model:value="productDescriptionValue" :rows="3" placeholder="描述商品用途" />
        </Form.Item>
        <Form.Item label="商品价格(USDT)">
          <Input v-model:value="formState.price" placeholder="例如 9.90" />
        </Form.Item>
        <Form.Item label="库存">
          <InputNumber v-model:value="formState.stock" style="width: 100%" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber v-model:value="formState.sort_order" style="width: 100%" />
        </Form.Item>
        <Form.Item label="内容类型">
          <Select v-model:value="formState.content_type" :options="[
            { label: '文本', value: 'text' },
            { label: '图片', value: 'image' },
            { label: '视频', value: 'video' },
          ]" />
        </Form.Item>
        <Form.Item label="文本内容">
          <Input.TextArea v-model:value="productContentTextValue" :rows="4" placeholder="机器人发送的文本内容" />
        </Form.Item>
        <Form.Item label="图片链接">
          <Input v-model:value="productContentImageValue" placeholder="https://..." />
        </Form.Item>
        <Form.Item label="视频链接">
          <Input v-model:value="productContentVideoValue" placeholder="https://..." />
        </Form.Item>
        <Form.Item label="上架状态">
          <Switch v-model:checked="formState.is_active" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
