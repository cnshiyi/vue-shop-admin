<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

import { createDashboardCloudAccountApi, deleteDashboardCloudAccountApi, getDashboardCloudAccountsApi, updateDashboardCloudAccountApi, verifyDashboardCloudAccountApi } from '#/api/admin';
import type { DashboardCloudAccountConfigItem, DashboardCloudAccountCreatePayload } from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const current = ref<DashboardCloudAccountConfigItem | null>(null);
const items = ref<DashboardCloudAccountConfigItem[]>([]);

const DEFAULT_REGION_MAP: Record<string, string> = {
  aliyun: 'cn-hongkong',
  aws: 'ap-southeast-1',
};

const form = reactive<DashboardCloudAccountCreatePayload>({
  access_key: '',
  is_active: true,
  name: '',
  provider: 'aws',
  region_hint: '',
  secret_key: '',
});

const regionHintTouched = ref(false);

const effectiveRegionHint = computed(() => {
  return String(form.region_hint || DEFAULT_REGION_MAP[form.provider] || '');
});

const regionHintPlaceholder = computed(() => {
  return DEFAULT_REGION_MAP[form.provider] || '请输入默认地区';
});

const regionHintValue = computed({
  get: () => form.region_hint ?? '',
  set: (value: string | number) => {
    regionHintTouched.value = true;
    form.region_hint = String(value || '');
  },
});

const columns: TableColumnsType<DashboardCloudAccountConfigItem> = [
  {
    title: '云厂商',
    dataIndex: 'provider_label',
    key: 'provider_label',
    width: 120,
  },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: '默认地区',
    dataIndex: 'effective_region',
    key: 'region_hint',
    width: 140,
  },
  {
    title: 'Access Key',
    dataIndex: 'access_key',
    key: 'access_key',
    width: 180,
  },
  {
    title: 'Secret Key',
    dataIndex: 'secret_key',
    key: 'secret_key',
    width: 180,
  },
  { title: '巡检状态', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '状态说明',
    dataIndex: 'status_note',
    key: 'status_note',
    width: 260,
  },
  { title: '启用', dataIndex: 'is_active', key: 'is_active', width: 80 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' as const },
];

function resetForm() {
  form.access_key = '';
  form.is_active = true;
  form.name = '';
  form.provider = 'aws';
  form.region_hint = '';
  form.secret_key = '';
  regionHintTouched.value = false;
}

async function loadData() {
  loading.value = true;
  try {
    items.value = await getDashboardCloudAccountsApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  current.value = null;
  resetForm();
  open.value = true;
}

function openEdit(record: DashboardCloudAccountConfigItem) {
  current.value = record;
  form.access_key = record.access_key || '';
  form.is_active = !!record.is_active;
  form.name = record.name || '';
  form.provider = record.provider || 'aws';
  form.region_hint = record.region_hint || '';
  form.secret_key = record.secret_key || '';
  regionHintTouched.value = !!record.region_hint;
  open.value = true;
}

watch(
  () => form.provider,
  () => {
    if (!regionHintTouched.value || !String(form.region_hint || '').trim()) {
      form.region_hint = '';
    }
  },
);

async function save() {
  saving.value = true;
  try {
    const payload = { ...form, region_hint: effectiveRegionHint.value || null };
    if (current.value) {
      await updateDashboardCloudAccountApi(current.value.id, payload);
      message.success('云账号已更新');
    } else {
      await createDashboardCloudAccountApi(payload);
      message.success('云账号已创建');
    }
    open.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function verify(record: DashboardCloudAccountConfigItem) {
  try {
    const result = await verifyDashboardCloudAccountApi(record.id, {
      region: record.effective_region || record.region_hint || undefined,
    });
    message.success(
      `验证成功：${result.region}，实例数 ${result.instance_count}`,
    );
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '验证失败');
  }
}

async function remove(record: DashboardCloudAccountConfigItem) {
  try {
    await deleteDashboardCloudAccountApi(record.id);
    message.success('云账号已删除');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

onMounted(loadData);
</script>

<template>
  <Page description="支持多平台、多账户并行管理" title="云账号设置">
    <Space class="mb-3">
      <Button type="primary" @click="openCreate">添加账号</Button>
      <Button :loading="loading" @click="loadData">刷新</Button>
    </Space>

    <Table
      :columns="columns"
      :data-source="items"
      :loading="loading"
      row-key="id"
      :pagination="false"
      :scroll="{ x: 1400 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'is_active'">
          <Tag :color="record.is_active ? 'success' : 'default'">{{
            record.is_active ? '启用' : '停用'
          }}</Tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag
            :color="
              record.status === 'ok'
                ? 'success'
                : record.status === 'error'
                  ? 'error'
                  : 'default'
            "
          >
            {{ record.status_label || record.status || '待检查' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="verify(record as DashboardCloudAccountConfigItem)"
              >验证</Button
            >
            <Button
              type="link"
              size="small"
              @click="openEdit(record as DashboardCloudAccountConfigItem)"
              >编辑</Button
            >
            <Popconfirm
              title="确认删除该云账号吗？"
              @confirm="remove(record as DashboardCloudAccountConfigItem)"
            >
              <Button danger type="link" size="small">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="open"
      :confirm-loading="saving"
      :title="current ? '编辑云账号' : '添加云账号'"
      @ok="save"
    >
      <Form layout="vertical">
        <Form.Item label="云平台">
          <Select
            v-model:value="form.provider"
            :options="[
              { label: 'AWS', value: 'aws' },
              { label: '阿里云', value: 'aliyun' },
            ]"
          />
        </Form.Item>
        <Form.Item label="账号名称">
          <Input v-model:value="form.name" placeholder="例如：生产 AWS" />
        </Form.Item>
        <Form.Item label="默认地区">
          <Input
            v-model:value="regionHintValue"
            :placeholder="regionHintPlaceholder"
          />
          <div class="text-xs text-[var(--ant-color-text-description)] mt-1">
            未填写时自动使用：{{ effectiveRegionHint }}
          </div>
        </Form.Item>
        <Form.Item label="Access Key">
          <Input v-model:value="form.access_key" placeholder="Access Key" />
        </Form.Item>
        <Form.Item label="Secret Key">
          <Input.Password
            v-model:value="form.secret_key"
            placeholder="Secret Key"
            :visibility-toggle="true"
          />
        </Form.Item>
        <Form.Item label="启用状态">
          <Switch v-model:checked="form.is_active" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
