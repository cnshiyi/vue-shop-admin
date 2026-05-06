<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  DashboardCloudAccountConfigItem,
  DashboardCloudAccountCreatePayload,
  DashboardCloudAccountDetail,
  DashboardCloudAccountLogItem,
} from '#/api/admin';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  createDashboardCloudAccountApi,
  deleteDashboardCloudAccountApi,
  getDashboardCloudAccountDetailApi,
  getDashboardCloudAccountsApi,
  updateDashboardCloudAccountApi,
  verifyDashboardCloudAccountApi,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const detailOpen = ref(false);
const detailLoading = ref(false);
const current = ref<DashboardCloudAccountConfigItem | null>(null);
const items = ref<DashboardCloudAccountConfigItem[]>([]);
const detail = ref<DashboardCloudAccountDetail | null>(null);
const togglingMap = reactive<Record<number, boolean>>({});
const shutdownTogglingMap = reactive<Record<number, boolean>>({});

const DEFAULT_REGION_MAP: Record<string, string> = {
  aliyun: 'cn-hongkong',
  aws: 'ap-southeast-1',
};

const form = reactive<DashboardCloudAccountCreatePayload>({
  access_key: '',
  external_account_id: '',
  is_active: true,
  name: '',
  provider: 'aws',
  region_hint: '',
  secret_key: '',
  shutdown_enabled: true,
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
  set: (value: number | string) => {
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
  { title: '备注', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: '账号ID',
    dataIndex: 'external_account_id',
    key: 'external_account_id',
    width: 180,
  },
  {
    title: '默认地区',
    dataIndex: 'effective_region',
    key: 'region_hint',
    width: 140,
  },
  {
    title: 'Access Key',
    dataIndex: 'access_key_preview',
    key: 'access_key_preview',
    width: 180,
  },
  {
    title: 'Secret Key',
    dataIndex: 'secret_key_preview',
    key: 'secret_key_preview',
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
  {
    title: '关机计划',
    dataIndex: 'shutdown_enabled',
    key: 'shutdown_enabled',
    width: 120,
  },
  { title: '操作', key: 'actions', width: 280, fixed: 'right' as const },
];

const logColumns: TableColumnsType<DashboardCloudAccountLogItem> = [
  { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '来源', dataIndex: 'source_label', key: 'source_label', width: 120 },
  { title: '动作', dataIndex: 'action', key: 'action', width: 180 },
  { title: '目标', dataIndex: 'target', key: 'target', width: 180 },
  { title: '结果', dataIndex: 'is_success', key: 'is_success', width: 100 },
];

function resetForm() {
  form.access_key = '';
  form.external_account_id = '';
  form.is_active = true;
  form.name = '';
  form.provider = 'aws';
  form.region_hint = '';
  form.secret_key = '';
  form.shutdown_enabled = true;
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
  form.access_key = '';
  form.external_account_id = record.external_account_id || '';
  form.is_active = !!record.is_active;
  form.name = record.name || '';
  form.provider = record.provider || 'aws';
  form.region_hint = record.region_hint || '';
  form.secret_key = '';
  form.shutdown_enabled = record.shutdown_enabled !== false;
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
    const payload: Partial<DashboardCloudAccountCreatePayload> = {
      ...form,
      region_hint: effectiveRegionHint.value || null,
    };
    if (current.value) {
      if (!String(payload.access_key || '').trim()) delete payload.access_key;
      if (!String(payload.secret_key || '').trim()) delete payload.secret_key;
      await updateDashboardCloudAccountApi(current.value.id, payload);
      message.success('云账号已更新');
    } else {
      await createDashboardCloudAccountApi(
        payload as DashboardCloudAccountCreatePayload,
      );
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

async function openDetail(record: DashboardCloudAccountConfigItem) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getDashboardCloudAccountDetailApi(record.id);
  } catch (error: any) {
    detail.value = null;
    message.error(error?.message || '加载云账号详情失败');
  } finally {
    detailLoading.value = false;
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

async function toggleActive(
  record: DashboardCloudAccountConfigItem,
  checked: boolean,
) {
  togglingMap[record.id] = true;
  try {
    await updateDashboardCloudAccountApi(record.id, { is_active: checked });
    record.is_active = checked;
    message.success(checked ? '云账号已启用' : '云账号已停用');
  } catch (error: any) {
    record.is_active = !checked;
    message.error(error?.message || '切换失败');
  } finally {
    togglingMap[record.id] = false;
  }
}

async function toggleShutdown(
  record: DashboardCloudAccountConfigItem,
  checked: boolean,
) {
  shutdownTogglingMap[record.id] = true;
  try {
    await updateDashboardCloudAccountApi(record.id, {
      shutdown_enabled: checked,
    });
    record.shutdown_enabled = checked;
    message.success(
      checked
        ? '该账号关机计划已开启，将按后台设定时间执行'
        : '该账号关机计划已关闭，当前只同步不关机',
    );
  } catch (error: any) {
    record.shutdown_enabled = !checked;
    message.error(error?.message || '切换失败');
  } finally {
    shutdownTogglingMap[record.id] = false;
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
          <Switch
            :checked="(record as DashboardCloudAccountConfigItem).is_active"
            checked-children="启用"
            :loading="
              togglingMap[(record as DashboardCloudAccountConfigItem).id]
            "
            un-checked-children="停用"
            @change="
              (checked) =>
                toggleActive(
                  record as DashboardCloudAccountConfigItem,
                  Boolean(checked),
                )
            "
          />
        </template>
        <template v-else-if="column.key === 'shutdown_enabled'">
          <Switch
            :checked="
              (record as DashboardCloudAccountConfigItem).shutdown_enabled
            "
            checked-children="执行关机"
            :loading="
              shutdownTogglingMap[
                (record as DashboardCloudAccountConfigItem).id
              ]
            "
            un-checked-children="只同步"
            @change="
              (checked) =>
                toggleShutdown(
                  record as DashboardCloudAccountConfigItem,
                  Boolean(checked),
                )
            "
          />
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
              @click="openDetail(record as DashboardCloudAccountConfigItem)"
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              @click="verify(record as DashboardCloudAccountConfigItem)"
            >
              验证
            </Button>
            <Button
              type="link"
              size="small"
              @click="openEdit(record as DashboardCloudAccountConfigItem)"
            >
              编辑
            </Button>
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

    <Drawer v-model:open="detailOpen" :width="980" title="云账号详情">
      <template v-if="detail">
        <Descriptions bordered :column="2" size="small" title="基础信息">
          <Descriptions.Item label="ID">{{ detail.id }}</Descriptions.Item>
          <Descriptions.Item label="云厂商">
            {{ detail.provider_label || detail.provider }}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {{ detail.name || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="账号ID">
            {{ detail.external_account_id || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="默认地区">
            {{ detail.effective_region || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="巡检状态">
            <Tag
              :color="
                detail.status === 'ok'
                  ? 'success'
                  : detail.status === 'error'
                    ? 'error'
                    : 'default'
              "
            >
              {{ detail.status_label || detail.status || '待检查' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Access Key">
            {{ detail.access_key_preview || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="Secret Key">
            {{ detail.secret_key_preview || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="启用">
            {{ detail.is_active ? '是' : '否' }}
          </Descriptions.Item>
          <Descriptions.Item label="关机计划">
            {{ detail.shutdown_enabled ? '执行关机' : '只同步' }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ detail.created_at || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ detail.updated_at || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="最近巡检">
            {{ detail.last_checked_at || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="状态说明" :span="2">
            {{ detail.status_note || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          bordered
          :column="3"
          class="mt-4"
          size="small"
          title="关联统计"
        >
          <Descriptions.Item label="关联资产">
            {{ detail.cloud_asset_count }}
          </Descriptions.Item>
          <Descriptions.Item label="活跃资产">
            {{ detail.active_cloud_asset_count }}
          </Descriptions.Item>
          <Descriptions.Item label="关联订单">
            {{ detail.cloud_order_count }}
          </Descriptions.Item>
          <Descriptions.Item label="运行中订单">
            {{ detail.running_cloud_order_count }}
          </Descriptions.Item>
          <Descriptions.Item label="日志总数">
            {{ detail.sync_log_count }}
          </Descriptions.Item>
          <Descriptions.Item label="最近成功">
            {{ detail.latest_success_log_at || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="最近失败" :span="3">
            {{ detail.latest_failed_log_at || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-base font-medium">执行日志</div>
          <Button
            size="small"
            :loading="detailLoading"
            @click="openDetail(detail)"
          >
            刷新日志
          </Button>
        </div>
        <Table
          class="mt-3"
          :columns="logColumns"
          :data-source="detail.recent_logs || []"
          :loading="detailLoading"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'is_success'">
              <Tag :color="record.is_success ? 'success' : 'error'">
                {{ record.is_success ? '成功' : '失败' }}
              </Tag>
            </template>
          </template>
          <template #expandedRowRender="{ record }">
            <Descriptions bordered :column="1" size="small">
              <Descriptions.Item label="错误信息">
                <Typography.Paragraph
                  class="!mb-0 whitespace-pre-wrap break-all font-mono"
                >
                  {{ record.error_message || '-' }}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="请求载荷">
                <Typography.Paragraph
                  class="!mb-0 whitespace-pre-wrap break-all font-mono"
                >
                  {{ record.request_payload || '-' }}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="响应载荷">
                <Typography.Paragraph
                  class="!mb-0 whitespace-pre-wrap break-all font-mono"
                >
                  {{ record.response_payload || '-' }}
                </Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </template>
        </Table>
      </template>
      <Empty v-else-if="!detailLoading" description="暂无详情数据" />
    </Drawer>

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
        <Form.Item label="账号备注">
          <Input
            v-model:value="form.name"
            placeholder="例如：11 / 嗷嗷 / 生产 AWS"
          />
        </Form.Item>
        <Form.Item label="云厂商账号ID">
          <Input
            v-model:value="form.external_account_id"
            placeholder="例如：121241；留空时验证账号后自动回填（AWS 支持）"
          />
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
          <Input
            v-model:value="form.access_key"
            :placeholder="current ? '留空则不修改' : 'Access Key'"
          />
        </Form.Item>
        <Form.Item label="Secret Key">
          <Input.Password
            v-model:value="form.secret_key"
            :placeholder="current ? '留空则不修改' : 'Secret Key'"
            :visibility-toggle="false"
          />
        </Form.Item>
        <Form.Item label="启用状态">
          <Switch v-model:checked="form.is_active" />
        </Form.Item>
        <Form.Item label="关机计划">
          <Switch
            v-model:checked="form.shutdown_enabled"
            checked-children="执行关机"
            un-checked-children="只同步"
          />
          <div class="text-xs text-[var(--ant-color-text-description)] mt-1">
            关闭后当前账号仅保留同步，不执行停机；重新打开后会在后台设定的关机时间窗口执行。
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
