<script lang="ts" setup>
import dayjs from 'dayjs';
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  TypographyParagraph,
  message,
} from 'ant-design-vue';

import {
  getDashboardCloudAssetsApi,
  getDashboardCloudAssetsGroupedApi,
  syncDashboardCloudAssetsApi,
  updateDashboardCloudAssetApi,
  deleteDashboardServerApi,
  type DashboardCloudAssetGroup,
  type DashboardCloudAssetItem,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const keyword = ref('');
const grouped = ref(true);
const items = ref<DashboardCloudAssetItem[]>([]);
const groups = ref<DashboardCloudAssetGroup[]>([]);
const expandedGroupKeys = ref<string[]>([]);
const expandedLinkKeys = ref<string[]>([]);
const expandedNoteKeys = ref<string[]>([]);
const expandedUsernameKeys = ref<string[]>([]);
const expandedAssetNameKeys = ref<string[]>([]);
const editOpen = ref(false);
const currentRow = ref<DashboardCloudAssetItem | null>(null);
const formState = reactive({
  actual_expires_at: null as any,
  is_active: true,
  mtproxy_link: '',
  note: '',
  price: '',
  public_ip: '',
  user_query: '',
});

const columns = [
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name' },
  { title: '用户名', dataIndex: 'username_label', key: 'username_label' },
  { title: '资产名称', dataIndex: 'asset_name', key: 'asset_name' },
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 140 },
  { title: '公网IP', dataIndex: 'public_ip', key: 'public_ip' },
  { title: '代理链接', dataIndex: 'mtproxy_link', key: 'mtproxy_link' },
  { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
  { title: '到期日期', dataIndex: 'actual_expires_at', key: 'actual_expires_at', width: 120 },
  { title: '备注', dataIndex: 'note', key: 'note' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '剩余天数', dataIndex: 'status_countdown', key: 'status_countdown', width: 140 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 150 },
];

async function loadData() {
  loading.value = true;
  try {
    if (grouped.value) {
      const response = await getDashboardCloudAssetsGroupedApi({ keyword: keyword.value.trim() });
      groups.value = response.groups;
      items.value = response.items;
      expandedGroupKeys.value = response.groups
        .filter((group) => group.default_expanded !== false)
        .map((group) => group.user_key);
      return;
    }
    items.value = await getDashboardCloudAssetsApi({ keyword: keyword.value.trim() });
    groups.value = [];
    expandedGroupKeys.value = [];
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

async function syncAssets() {
  syncing.value = true;
  try {
    await syncDashboardCloudAssetsApi();
    message.success('代理同步完成');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '代理同步失败');
  } finally {
    syncing.value = false;
  }
}

function openEdit(record: DashboardCloudAssetItem) {
  currentRow.value = record;
  formState.actual_expires_at = record.actual_expires_at ? dayjs(record.actual_expires_at) : null;
  formState.is_active = record.is_active;
  formState.mtproxy_link = record.mtproxy_link || '';
  formState.note = record.note || '';
  formState.price = record.price || '0.00';
  formState.public_ip = record.public_ip || '';
  formState.user_query = record.user_id
    ? String(record.user_id)
    : (record.tg_user_id ? String(record.tg_user_id) : '');
  editOpen.value = true;
}

function toggleLinkExpand(id: number) {
  const key = String(id);
  if (expandedLinkKeys.value.includes(key)) {
    expandedLinkKeys.value = expandedLinkKeys.value.filter((item) => item !== key);
    return;
  }
  expandedLinkKeys.value = [...expandedLinkKeys.value, key];
}

function isLinkExpanded(id: number) {
  return expandedLinkKeys.value.includes(String(id));
}

function toggleNoteExpand(id: number) {
  const key = String(id);
  if (expandedNoteKeys.value.includes(key)) {
    expandedNoteKeys.value = expandedNoteKeys.value.filter((item) => item !== key);
    return;
  }
  expandedNoteKeys.value = [...expandedNoteKeys.value, key];
}

function isNoteExpanded(id: number) {
  return expandedNoteKeys.value.includes(String(id));
}

function toggleUsernameExpand(id: number) {
  const key = String(id);
  if (expandedUsernameKeys.value.includes(key)) {
    expandedUsernameKeys.value = expandedUsernameKeys.value.filter((item) => item !== key);
    return;
  }
  expandedUsernameKeys.value = [...expandedUsernameKeys.value, key];
}

function isUsernameExpanded(id: number) {
  return expandedUsernameKeys.value.includes(String(id));
}

function toggleAssetNameExpand(id: number) {
  const key = String(id);
  if (expandedAssetNameKeys.value.includes(key)) {
    expandedAssetNameKeys.value = expandedAssetNameKeys.value.filter((item) => item !== key);
    return;
  }
  expandedAssetNameKeys.value = [...expandedAssetNameKeys.value, key];
}

function isAssetNameExpanded(id: number) {
  return expandedAssetNameKeys.value.includes(String(id));
}

async function deleteAsset(record: DashboardCloudAssetItem) {
  try {
    const serverId = record.server_id || record.id;
    await deleteDashboardServerApi(serverId);
    message.success('代理已删除');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除代理失败');
  }
}

async function submitEdit() {
  if (!currentRow.value) return;
  saving.value = true;
  try {
    await updateDashboardCloudAssetApi(currentRow.value.id, {
      actual_expires_at: formState.actual_expires_at ? dayjs(formState.actual_expires_at).format('YYYY-MM-DD') : null,
      is_active: formState.is_active,
      mtproxy_link: formState.mtproxy_link || null,
      note: formState.note || null,
      price: formState.price || null,
      public_ip: formState.public_ip || null,
      user_query: formState.user_query.trim() || null,
    });
    message.success('代理已更新');
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
  <Page description="统一查看 MTProxy 代理资产，支持分组与编辑" title="代理列表">
    <Card>
      <template #title>
        <Space>
          <span>代理数据</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索用户、用户名、IP、代理链接"
            style="width: 360px"
            @search="loadData"
          />
          <Button size="small" :loading="syncing" @click="syncAssets">同步代理</Button>
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
          <span>按用户分组</span>
          <Switch v-model:checked="grouped" @change="loadData" />
        </Space>
      </template>

      <Collapse v-if="grouped" v-model:active-key="expandedGroupKeys" class="compact-cloud-assets space-y-2">
        <Collapse.Panel v-for="group in groups" :key="group.user_key">
          <template #header>
            <Space>
              <span>{{ group.user_display_name }}</span>
              <Tag color="blue">{{ group.username_label || '-' }}</Tag>
              <Tag>{{ group.tg_user_id || '未绑定' }}</Tag>
              <Tag>{{ group.items.length }} 条</Tag>
            </Space>
          </template>
          <Table
            :columns="columns"
            :data-source="group.items"
            :loading="loading"
            :pagination="false"
            row-key="id"
            :scroll="{ x: 980 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'username_label'">
                <div v-if="record.username_label && record.username_label !== '-'" class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="isUsernameExpanded(record.id) ? false : { rows: 1, tooltip: record.username_label }"
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.username_label }}
                  </TypographyParagraph>
                  <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleUsernameExpand(record.id)">
                    {{ isUsernameExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'asset_name'">
                <div class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="isAssetNameExpanded(record.id) ? false : { rows: 1, tooltip: record.asset_name || '-' }"
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.asset_name || '-' }}
                  </TypographyParagraph>
                  <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleAssetNameExpand(record.id)">
                    {{ isAssetNameExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                  <Tag :color="record.kind === 'mtproxy' ? 'purple' : 'blue'">
                    {{ record.kind === 'mtproxy' ? 'MTProxy' : '服务器' }}
                  </Tag>
                </div>
              </template>
              <template v-else-if="column.key === 'mtproxy_link'">
                <div v-if="record.mtproxy_link" class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="isLinkExpanded(record.id) ? false : { rows: 1, tooltip: record.mtproxy_link }"
                    :copyable="{ text: record.mtproxy_link }"
                    class="mb-0 max-h-32 overflow-y-auto break-all font-mono text-xs leading-5"
                  >
                    {{ record.mtproxy_link }}
                  </TypographyParagraph>
                  <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleLinkExpand(record.id)">
                    {{ isLinkExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'actual_expires_at'">
                <span>{{ record.actual_expires_at ? dayjs(record.actual_expires_at).format('YYYY-MM-DD') : '-' }}</span>
              </template>
              <template v-else-if="column.key === 'note'">
                <div v-if="record.note" class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="isNoteExpanded(record.id) ? false : { rows: 1, tooltip: record.note }"
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.note }}
                  </TypographyParagraph>
                  <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleNoteExpand(record.id)">
                    {{ isNoteExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.is_active ? 'success' : (record.status === 'deleted' || record.status === 'terminated' ? 'default' : 'warning')">
                  {{ record.status_label || record.status || '-' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'status_countdown'">
                <Tag color="processing">{{ record.status_countdown || record.provider_status || '-' }}</Tag>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space>
                  <Button type="link" @click="openEdit(record as DashboardCloudAssetItem)">编辑</Button>
                  <Popconfirm title="确认删除该代理/服务器记录吗？" @confirm="deleteAsset(record as DashboardCloudAssetItem)">
                    <Button danger type="link">删除</Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </Collapse.Panel>
      </Collapse>

      <Table
        v-else
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :scroll="{ x: 980 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username_label'">
            <div v-if="record.username_label && record.username_label !== '-'" class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="isUsernameExpanded(record.id) ? false : { rows: 1, tooltip: record.username_label }"
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.username_label }}
              </TypographyParagraph>
              <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleUsernameExpand(record.id)">
                {{ isUsernameExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'asset_name'">
            <div class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="isAssetNameExpanded(record.id) ? false : { rows: 1, tooltip: record.asset_name || '-' }"
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.asset_name || '-' }}
              </TypographyParagraph>
              <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleAssetNameExpand(record.id)">
                {{ isAssetNameExpanded(record.id) ? '收起' : '展开' }}
              </Button>
              <Tag :color="record.kind === 'mtproxy' ? 'purple' : 'blue'">
                {{ record.kind === 'mtproxy' ? 'MTProxy' : '服务器' }}
              </Tag>
            </div>
          </template>
          <template v-else-if="column.key === 'mtproxy_link'">
            <div v-if="record.mtproxy_link" class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="isLinkExpanded(record.id) ? false : { rows: 1, tooltip: record.mtproxy_link }"
                :copyable="{ text: record.mtproxy_link }"
                class="mb-0 max-h-32 overflow-y-auto break-all font-mono text-xs leading-5"
              >
                {{ record.mtproxy_link }}
              </TypographyParagraph>
              <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleLinkExpand(record.id)">
                {{ isLinkExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actual_expires_at'">
            <span>{{ record.actual_expires_at ? dayjs(record.actual_expires_at).format('YYYY-MM-DD') : '-' }}</span>
          </template>
          <template v-else-if="column.key === 'note'">
            <div v-if="record.note" class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="isNoteExpanded(record.id) ? false : { rows: 1, tooltip: record.note }"
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.note }}
              </TypographyParagraph>
              <Button size="small" type="link" class="mt-1 h-auto px-0 py-0" @click="toggleNoteExpand(record.id)">
                {{ isNoteExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.is_active ? 'success' : (record.status === 'deleted' || record.status === 'terminated' ? 'default' : 'warning')">
              {{ record.status_label || record.status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status_countdown'">
            <Tag color="processing">{{ record.status_countdown || record.provider_status || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button type="link" @click="openEdit(record as DashboardCloudAssetItem)">编辑</Button>
              <Popconfirm title="确认删除该代理/服务器记录吗？" @confirm="deleteAsset(record as DashboardCloudAssetItem)">
                <Button danger type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="editOpen" :confirm-loading="saving" title="编辑代理" width="720px" @ok="submitEdit">
      <Form layout="vertical">
        <Form.Item label="用户显示名">
          <Input :value="currentRow?.user_display_name || ''" disabled />
        </Form.Item>
        <Form.Item label="用户绑定">
          <Input
            v-model:value="formState.user_query"
            placeholder="输入后台用户ID / Telegram ID / 用户名，自动识别"
          />
        </Form.Item>
        <Form.Item label="公网 IP">
          <Input v-model:value="formState.public_ip" placeholder="x.x.x.x" />
        </Form.Item>
        <Form.Item label="价格">
          <Input v-model:value="formState.price" placeholder="关联订单价格" />
        </Form.Item>
        <Form.Item label="到期日期">
          <DatePicker v-model:value="formState.actual_expires_at" format="YYYY-MM-DD" style="width: 100%" />
        </Form.Item>
        <Form.Item label="代理链接">
          <Input v-model:value="formState.mtproxy_link" placeholder="tg://proxy?..." />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="formState.note" placeholder="备注信息" />
        </Form.Item>
        <Form.Item label="启用状态">
          <Switch v-model:checked="formState.is_active" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.compact-cloud-assets :deep(.ant-collapse-header) {
  padding: 6px 12px !important;
}

.compact-cloud-assets :deep(.ant-collapse-content-box) {
  padding: 8px 12px !important;
}

:deep(.ant-table-small .ant-table-thead > tr > th),
:deep(.ant-table-small .ant-table-tbody > tr > td) {
  padding: 4px 8px !important;
}

:deep(.ant-table-small .ant-btn.ant-btn-link) {
  height: auto;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

:deep(.ant-typography) {
  margin-bottom: 0 !important;
  line-height: 1.2 !important;
}
</style>
