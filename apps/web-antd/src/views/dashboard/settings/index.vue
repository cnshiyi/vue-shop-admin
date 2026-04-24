<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
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

import {
  createDashboardCloudAccountApi,
  deleteDashboardCloudAccountApi,
  getDashboardCloudAccountsApi,
  getDashboardSiteConfigGroupsApi,
  getDashboardSiteConfigsApi,
  initDashboardSiteConfigsApi,
  updateDashboardCloudAccountApi,
  updateDashboardSiteConfigApi,
  verifyDashboardCloudAccountApi,
  type DashboardCloudAccountConfigItem,
  type DashboardCloudAccountCreatePayload,
  type DashboardSiteConfigGroup,
  type DashboardSiteConfigGroupItem,
  type DashboardSiteConfigItem,
  type DashboardSiteConfigUpdatePayload,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const accountSaving = ref(false);
const activeSection = ref('database');
const siteConfigs = ref<DashboardSiteConfigItem[]>([]);
const configGroups = ref<DashboardSiteConfigGroup[]>([]);
const cloudAccounts = ref<DashboardCloudAccountConfigItem[]>([]);
const editOpen = ref(false);
const accountOpen = ref(false);
const current = ref<DashboardSiteConfigItem | null>(null);
const currentAccount = ref<DashboardCloudAccountConfigItem | null>(null);
const form = ref<DashboardSiteConfigUpdatePayload>({ key: '', value: '', is_sensitive: false });
const accountForm = reactive<DashboardCloudAccountCreatePayload>({
  access_key: '',
  is_active: true,
  name: '',
  provider: 'aws',
  region_hint: '',
  secret_key: '',
});

const accountRegionHint = computed({
  get: () => accountForm.region_hint ?? '',
  set: (value: string | number) => {
    accountForm.region_hint = String(value || '');
  },
});

const groupLabelMap: Record<string, string> = {
  aliyun: '阿里云配置',
  aws: 'AWS 配置',
  bot: '机器人配置',
  custom_text: '文案配置',
  database: '数据库配置',
  runtime: '运行时配置',
  tron: '波场配置',
};

const siteColumns: TableColumnsType<DashboardSiteConfigGroupItem> = [
  { title: '键', dataIndex: 'key', key: 'key', width: 220 },
  { title: '说明', dataIndex: 'description', key: 'description', width: 280 },
  { title: '当前值', dataIndex: 'value', key: 'value', width: 360 },
  { title: '敏感', dataIndex: 'is_sensitive', key: 'is_sensitive', width: 90 },
  { title: '操作', key: 'actions', width: 90, fixed: 'right' as const },
];

const accountColumns: TableColumnsType<DashboardCloudAccountConfigItem> = [
  { title: '云厂商', dataIndex: 'provider_label', key: 'provider_label', width: 120 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '默认地区', dataIndex: 'region_hint', key: 'region_hint', width: 140 },
  { title: 'Access Key', dataIndex: 'access_key', key: 'access_key', width: 180 },
  { title: 'Secret Key', dataIndex: 'secret_key', key: 'secret_key', width: 180 },
  { title: '巡检状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '状态说明', dataIndex: 'status_note', key: 'status_note', width: 260 },
  { title: '启用', dataIndex: 'is_active', key: 'is_active', width: 80 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' as const },
];

const menuItems = computed(() => [
  ...configGroups.value.map((group) => ({ key: group.group, label: groupLabelMap[group.group] || group.group })),
  { key: 'cloud-accounts', label: '云账号管理' },
]);

const activeGroup = computed(() => configGroups.value.find((item) => item.group === activeSection.value) || null);

function asDashboardSiteConfigGroupItem(record: Record<string, any>) {
  return record as DashboardSiteConfigGroupItem;
}

function asDashboardCloudAccountConfigItem(record: Record<string, any>) {
  return record as DashboardCloudAccountConfigItem;
}

function resetAccountForm() {
  accountForm.access_key = '';
  accountForm.is_active = true;
  accountForm.name = '';
  accountForm.provider = 'aws';
  accountForm.region_hint = '';
  accountForm.secret_key = '';
}

async function loadData() {
  loading.value = true;
  try {
    const [configs, groups, accounts] = await Promise.all([
      getDashboardSiteConfigsApi(),
      getDashboardSiteConfigGroupsApi(),
      getDashboardCloudAccountsApi(),
    ]);
    siteConfigs.value = configs;
    configGroups.value = groups;
    cloudAccounts.value = accounts;
    if (!menuItems.value.some((item) => item.key === activeSection.value)) {
      activeSection.value = groups[0]?.group || 'cloud-accounts';
    }
  } finally {
    loading.value = false;
  }
}

function openEdit(record: DashboardSiteConfigGroupItem) {
  const exact = siteConfigs.value.find((item) => item.key === record.key) || null;
  current.value = exact;
  form.value = {
    key: record.key,
    value: record.value || '',
    is_sensitive: !!record.is_sensitive,
  };
  editOpen.value = true;
}

function openCreateAccount() {
  currentAccount.value = null;
  resetAccountForm();
  accountOpen.value = true;
}

function openEditAccount(record: DashboardCloudAccountConfigItem) {
  currentAccount.value = record;
  accountForm.access_key = record.access_key || '';
  accountForm.is_active = !!record.is_active;
  accountForm.name = record.name || '';
  accountForm.provider = record.provider || 'aws';
  accountForm.region_hint = record.region_hint || '';
  accountForm.secret_key = record.secret_key || '';
  accountOpen.value = true;
}

async function initCommon() {
  await initDashboardSiteConfigsApi();
  message.success('已初始化常用配置项');
  await loadData();
}

async function saveEdit() {
  if (!current.value?.id) {
    message.error('当前配置项尚未初始化，请先点击初始化常用配置');
    return;
  }
  saving.value = true;
  try {
    await updateDashboardSiteConfigApi(current.value.id, form.value);
    message.success('配置已保存');
    editOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '配置保存失败');
  } finally {
    saving.value = false;
  }
}

async function saveAccount() {
  accountSaving.value = true;
  try {
    if (currentAccount.value) {
      await updateDashboardCloudAccountApi(currentAccount.value.id, { ...accountForm, region_hint: accountForm.region_hint || null });
      message.success('云账号已更新');
    } else {
      await createDashboardCloudAccountApi({ ...accountForm, region_hint: accountForm.region_hint || null });
      message.success('云账号已创建');
    }
    accountOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '云账号保存失败');
  } finally {
    accountSaving.value = false;
  }
}

async function verifyAccount(record: DashboardCloudAccountConfigItem) {
  try {
    const result = await verifyDashboardCloudAccountApi(record.id, { region: record.region_hint || undefined });
    message.success(`验证成功：${result.region}，实例数 ${result.instance_count}`);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '账号验证失败');
  }
}

async function deleteAccount(record: DashboardCloudAccountConfigItem) {
  try {
    await deleteDashboardCloudAccountApi(record.id);
    message.success('云账号已删除');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除云账号失败');
  }
}

onMounted(loadData);
</script>

<template>
  <Page description="按二级入口管理系统配置与云账号" title="系统设置">
    <div class="settings-layout">
      <Card class="settings-menu" size="small">
        <template #title>
          <Space>
            <span>设置目录</span>
            <Button size="small" @click="initCommon">初始化</Button>
            <Button size="small" @click="loadData">刷新</Button>
          </Space>
        </template>
        <div class="settings-menu-list">
          <Button
            v-for="item in menuItems"
            :key="item.key"
            block
            class="justify-start"
            :type="activeSection === item.key ? 'primary' : 'default'"
            @click="activeSection = item.key"
          >
            {{ item.label }}
          </Button>
        </div>
      </Card>

      <Card class="settings-content">
        <template #title>
          <Space>
            <span>{{ menuItems.find((item) => item.key === activeSection)?.label || '系统设置' }}</span>
            <Tag v-if="activeSection !== 'cloud-accounts'" color="blue">二级入口</Tag>
            <Button v-if="activeSection === 'cloud-accounts'" type="primary" size="small" @click="openCreateAccount">添加账号</Button>
          </Space>
        </template>

        <Table
          v-if="activeSection !== 'cloud-accounts'"
          :columns="siteColumns"
          :data-source="activeGroup?.items || []"
          :loading="loading"
          row-key="key"
          :pagination="false"
          :scroll="{ x: 1100 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'is_sensitive'">
              <Tag :color="record.is_sensitive ? 'orange' : 'default'">{{ record.is_sensitive ? '是' : '否' }}</Tag>
            </template>
            <template v-else-if="column.key === 'value'">
              <span class="break-all">{{ record.value || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button type="link" size="small" @click="openEdit(asDashboardSiteConfigGroupItem(record))">编辑</Button>
            </template>
          </template>
        </Table>

        <Table
          v-else
          :columns="accountColumns"
          :data-source="cloudAccounts"
          :loading="loading"
          row-key="id"
          :pagination="false"
          :scroll="{ x: 1400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'is_active'">
              <Tag :color="record.is_active ? 'success' : 'default'">{{ record.is_active ? '启用' : '停用' }}</Tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="record.status === 'ok' ? 'success' : (record.status === 'error' ? 'error' : 'default')">
                {{ record.status_label || record.status || '待检查' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'status_note'">
              <span class="break-all">{{ record.status_note || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button type="link" size="small" @click="verifyAccount(asDashboardCloudAccountConfigItem(record))">验证</Button>
                <Button type="link" size="small" @click="openEditAccount(asDashboardCloudAccountConfigItem(record))">编辑</Button>
                <Popconfirm title="确认删除该云账号吗？" @confirm="deleteAccount(asDashboardCloudAccountConfigItem(record))">
                  <Button danger type="link" size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <Modal v-model:open="editOpen" title="编辑配置" :confirm-loading="saving" @ok="saveEdit">
      <Space direction="vertical" style="width: 100%">
        <Input v-model:value="form.key" disabled />
        <Input.Password v-model:value="form.value" placeholder="配置值" :visibility-toggle="true" />
        <Space>
          <span>敏感配置</span>
          <Switch v-model:checked="form.is_sensitive" />
        </Space>
      </Space>
    </Modal>

    <Modal v-model:open="accountOpen" :confirm-loading="accountSaving" :title="currentAccount ? '编辑云账号' : '添加云账号'" @ok="saveAccount">
      <Form layout="vertical">
        <Form.Item label="云平台">
          <Select v-model:value="accountForm.provider" :options="[{ label: 'AWS', value: 'aws' }, { label: '阿里云', value: 'aliyun' }]" />
        </Form.Item>
        <Form.Item label="账号名称">
          <Input v-model:value="accountForm.name" placeholder="例如：生产 AWS" />
        </Form.Item>
        <Form.Item label="默认地区">
          <Input v-model:value="accountRegionHint" placeholder="AWS: ap-southeast-1 / 阿里云: cn-hongkong" />
        </Form.Item>
        <Form.Item label="Access Key">
          <Input v-model:value="accountForm.access_key" placeholder="Access Key" />
        </Form.Item>
        <Form.Item label="Secret Key">
          <Input.Password v-model:value="accountForm.secret_key" placeholder="Secret Key" :visibility-toggle="true" />
        </Form.Item>
        <Form.Item label="启用状态">
          <Switch v-model:checked="accountForm.is_active" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.settings-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: 220px minmax(0, 1fr);
}

.settings-menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.break-all {
  word-break: break-all;
}
</style>
