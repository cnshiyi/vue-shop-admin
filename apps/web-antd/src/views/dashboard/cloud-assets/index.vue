<script lang="ts" setup>
import type {
  DashboardCloudAssetGroup,
  DashboardCloudAssetItem,
} from '#/api/admin';

import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteDashboardCloudAssetApi,
  deleteDashboardServerApi,
  getDashboardCloudAssetsApi,
  getDashboardCloudAssetsGroupedApi,
  getDashboardCloudAssetsSyncStatusApi,
  rebuildDashboardServerPreserveLinkApi,
  syncDashboardCloudAssetsApi,
  updateDashboardCloudAssetApi,
} from '#/api/admin';

const AUTO_REFRESH_MS = 10 * 60 * 1000;

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const rebuildingServerId = ref<null | number>(null);
const keyword = ref('');
const grouped = ref(true);
const lastRefreshedAt = ref<dayjs.Dayjs | null>(null);
const lastSyncedAt = ref<dayjs.Dayjs | null>(null);
const nextRefreshInSeconds = ref(Math.floor(AUTO_REFRESH_MS / 1000));
const recentSyncHighlight = ref(false);
const autoSyncEverySeconds = ref(10 * 60);
const awsExistingCount = ref(0);
const aliyunExistingCount = ref(0);
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
  note: '',
  price: '',
  public_ip: '',
  sort_order: 99,
  user_query: '',
});
let autoRefreshTimer: null | ReturnType<typeof setInterval> = null;
let countdownTimer: null | ReturnType<typeof setInterval> = null;
let syncHighlightTimer: null | ReturnType<typeof setTimeout> = null;

function normalizeDaysLeft(record: DashboardCloudAssetItem) {
  if (typeof record.days_left !== 'number' || Number.isNaN(record.days_left)) {
    return record.actual_expires_at ? Number.POSITIVE_INFINITY : 0;
  }
  return record.days_left;
}

function normalizeExpiresAt(value: null | string | undefined) {
  if (!value) {
    return dayjs().startOf('day').valueOf();
  }
  const timestamp = dayjs(value).valueOf();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function normalizeUpdatedAt(value: null | string | undefined) {
  if (!value) {
    return 0;
  }
  const timestamp = dayjs(value).valueOf();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareByDaysLeft(
  a: DashboardCloudAssetItem,
  b: DashboardCloudAssetItem,
) {
  const daysDiff = normalizeDaysLeft(a) - normalizeDaysLeft(b);
  if (daysDiff !== 0) {
    return daysDiff;
  }
  const expiresDiff =
    normalizeExpiresAt(a.actual_expires_at) -
    normalizeExpiresAt(b.actual_expires_at);
  if (expiresDiff !== 0) {
    return expiresDiff;
  }
  return normalizeUpdatedAt(b.updated_at) - normalizeUpdatedAt(a.updated_at);
}

function isDeletedAsset(record: DashboardCloudAssetItem) {
  return (
    !record.is_active ||
    [
      'deleted',
      'deleting',
      'expired',
      'terminated',
      'terminating',
      'unknown',
    ].includes(record.status) ||
    ['删除中', '已删除', '已终止', '已过期', '未知状态', '终止中'].includes(
      record.status_label || '',
    )
  );
}

function isUnattachedIpAsset(record: DashboardCloudAssetItem) {
  return (
    !record.public_ip ||
    (record.provider_status || '').includes('未附加固定IP') ||
    (record.provider_status || '').includes('未附加IP')
  );
}

function assetDisplayRank(record: DashboardCloudAssetItem) {
  if (isDeletedAsset(record)) return 2;
  if (isUnattachedIpAsset(record)) return 1;
  return 0;
}

function compareByDisplayOrder(
  a: DashboardCloudAssetItem,
  b: DashboardCloudAssetItem,
) {
  const rankDiff = assetDisplayRank(a) - assetDisplayRank(b);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  return compareByDaysLeft(a, b);
}

function sortAssets(records: DashboardCloudAssetItem[]) {
  return [...records].toSorted(compareByDisplayOrder);
}

function activeAssetCount(records: DashboardCloudAssetItem[]) {
  return records.filter(
    (item) =>
      item.is_active &&
      !isDeletedAsset(item) &&
      !['deleted', 'deleting', 'terminated', 'terminating'].includes(
        item.status,
      ),
  ).length;
}

const columns = [
  { title: '用户', dataIndex: 'user_display_name', key: 'user_display_name' },
  { title: '用户名', dataIndex: 'username_label', key: 'username_label' },
  { title: '资产名称', dataIndex: 'asset_name', key: 'asset_name' },
  {
    title: '排序',
    dataIndex: 'sort_order',
    key: 'sort_order',
    width: 90,
    sorter: (a: DashboardCloudAssetItem, b: DashboardCloudAssetItem) =>
      (b.sort_order || 99) - (a.sort_order || 99),
  },
  { title: '地区', dataIndex: 'region_label', key: 'region_label', width: 120 },
  { title: '公网IP', dataIndex: 'public_ip', key: 'public_ip', width: 140 },
  { title: '代理链接', dataIndex: 'mtproxy_link', key: 'mtproxy_link' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  {
    title: '剩余天数',
    dataIndex: 'status_countdown',
    key: 'status_countdown',
    width: 140,
  },
  {
    title: '到期时间',
    dataIndex: 'actual_expires_at',
    key: 'actual_expires_at',
    width: 130,
  },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 180 },
];

function openDetail(record: DashboardCloudAssetItem) {
  router.push(`/admin/cloud-assets/${record.id}`).catch(() => {});
}

function formatRefreshTime(value: dayjs.Dayjs | null) {
  return value ? value.format('MM-DD HH:mm:ss') : '-';
}

function resetRefreshCountdown() {
  nextRefreshInSeconds.value = Math.floor(AUTO_REFRESH_MS / 1000);
}

function markRecentSync() {
  recentSyncHighlight.value = true;
  if (syncHighlightTimer) {
    clearTimeout(syncHighlightTimer);
  }
  syncHighlightTimer = setTimeout(() => {
    recentSyncHighlight.value = false;
    syncHighlightTimer = null;
  }, 10_000);
}

async function loadData() {
  loading.value = true;
  try {
    const [syncStatus, response] = await Promise.all([
      getDashboardCloudAssetsSyncStatusApi(),
      grouped.value
        ? getDashboardCloudAssetsGroupedApi({ keyword: keyword.value.trim() })
        : getDashboardCloudAssetsApi({ keyword: keyword.value.trim() }),
    ]);
    autoSyncEverySeconds.value = syncStatus.auto_sync_every_seconds || 10 * 60;
    lastSyncedAt.value = syncStatus.last_synced_at
      ? dayjs(syncStatus.last_synced_at)
      : null;
    awsExistingCount.value = syncStatus.aws_existing_count || 0;
    aliyunExistingCount.value = syncStatus.aliyun_existing_count || 0;

    if (grouped.value) {
      const groupedResponse = response as any;
      groups.value = groupedResponse.groups.map(
        (group: DashboardCloudAssetGroup) => ({
          ...group,
          items: sortAssets(group.items),
        }),
      );
      items.value = sortAssets(groupedResponse.items);
      expandedGroupKeys.value = groupedResponse.groups
        .filter(
          (group: DashboardCloudAssetGroup) => group.default_expanded !== false,
        )
        .map((group: DashboardCloudAssetGroup) => group.user_key);
      return;
    }
    items.value = sortAssets(response as DashboardCloudAssetItem[]);
    groups.value = [];
    expandedGroupKeys.value = [];
  } finally {
    loading.value = false;
    lastRefreshedAt.value = dayjs();
    resetRefreshCountdown();
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
    markRecentSync();
    await loadData();
    message.success(
      `代理同步完成：AWS 存在 ${awsExistingCount.value} 条，阿里云存在 ${aliyunExistingCount.value} 条`,
    );
  } catch (error: any) {
    message.error(error?.message || '代理同步失败');
  } finally {
    syncing.value = false;
  }
}

function openEdit(record: DashboardCloudAssetItem) {
  currentRow.value = record;
  formState.actual_expires_at = record.actual_expires_at
    ? dayjs(record.actual_expires_at)
    : null;
  formState.is_active = record.is_active;
  formState.note = record.note || '';
  formState.price = record.price || '0.00';
  formState.public_ip = record.public_ip || '';
  formState.sort_order = record.sort_order || 99;
  formState.user_query = record.user_id
    ? String(record.user_id)
    : (record.tg_user_id
      ? String(record.tg_user_id)
      : '');
  editOpen.value = true;
}

function toggleLinkExpand(id: number) {
  const key = String(id);
  if (expandedLinkKeys.value.includes(key)) {
    expandedLinkKeys.value = expandedLinkKeys.value.filter(
      (item) => item !== key,
    );
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
    expandedNoteKeys.value = expandedNoteKeys.value.filter(
      (item) => item !== key,
    );
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
    expandedUsernameKeys.value = expandedUsernameKeys.value.filter(
      (item) => item !== key,
    );
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
    expandedAssetNameKeys.value = expandedAssetNameKeys.value.filter(
      (item) => item !== key,
    );
    return;
  }
  expandedAssetNameKeys.value = [...expandedAssetNameKeys.value, key];
}

function isAssetNameExpanded(id: number) {
  return expandedAssetNameKeys.value.includes(String(id));
}

function countdownTagColor(label?: null | string) {
  if (!label || label === '-') {
    return 'default';
  }
  if (label.includes('未附加IP') || label.includes('未附加固定IP')) {
    return 'warning';
  }
  if (label.includes('仍使用旧机')) {
    return 'warning';
  }
  if (label.includes('迁移中') || label.includes('切换到新机')) {
    return 'processing';
  }
  if (label.includes('已删除')) {
    return 'default';
  }
  if (label.includes('已过期')) {
    return 'error';
  }
  if (label.includes('小时')) {
    return 'warning';
  }
  const matched = label.match(/剩余\s*(\d+)\s*天/);
  if (matched) {
    const days = Number(matched[1]);
    if (days <= 3) {
      return 'gold';
    }
  }
  return 'processing';
}

function sortOrderTagColor(sortOrder?: number) {
  return (sortOrder || 99) === 99 ? 'default' : 'success';
}

function canRebuildPreserveLink(record: DashboardCloudAssetItem) {
  return (
    record.kind === 'server' &&
    record.provider === 'aws_lightsail' &&
    !!record.server_id &&
    !!record.order_id &&
    record.status !== 'deleted'
  );
}

async function rebuildPreserveLink(record: DashboardCloudAssetItem) {
  if (!record.server_id) {
    message.error('当前记录缺少服务器ID');
    return;
  }
  rebuildingServerId.value = record.server_id;
  try {
    const result = await rebuildDashboardServerPreserveLinkApi(
      record.server_id,
    );
    message.success(result.message || '已发起重装迁移');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '发起重装迁移失败');
  } finally {
    rebuildingServerId.value = null;
  }
}

async function deleteAsset(record: DashboardCloudAssetItem) {
  try {
    if (record.server_id) {
      await deleteDashboardServerApi(record.server_id);
    } else {
      await deleteDashboardCloudAssetApi(record.id);
    }
    message.success('代理已删除');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除代理失败');
  }
}

function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  resetRefreshCountdown();
  autoRefreshTimer = setInterval(() => {
    if (!editOpen.value && !loading.value && !saving.value && !syncing.value) {
      loadData();
    }
  }, AUTO_REFRESH_MS);
  countdownTimer = setInterval(() => {
    if (!editOpen.value && !loading.value && !saving.value && !syncing.value) {
      nextRefreshInSeconds.value = Math.max(0, nextRefreshInSeconds.value - 1);
    }
  }, 1000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (syncHighlightTimer) {
    clearTimeout(syncHighlightTimer);
    syncHighlightTimer = null;
  }
}

async function submitEdit() {
  if (!currentRow.value) return;
  saving.value = true;
  try {
    await updateDashboardCloudAssetApi(currentRow.value.id, {
      actual_expires_at: formState.actual_expires_at
        ? dayjs(formState.actual_expires_at).format('YYYY-MM-DD')
        : null,
      is_active: formState.is_active,
      note: formState.note || null,
      sort_order: Number(formState.sort_order || 99),
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

onMounted(() => {
  loadData();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});
</script>

<template>
  <Page
    description="统一查看 MTProxy 代理资产，支持默认排序与手工排序"
    title="代理列表"
  >
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
          <Button size="small" :loading="syncing" @click="syncAssets">
            同步代理
          </Button>
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
          <Tag v-if="syncing" color="processing">同步中…</Tag>
          <Tag v-else-if="loading" color="processing">刷新中…</Tag>
          <Tag color="blue">
            最后刷新：{{ formatRefreshTime(lastRefreshedAt) }}
          </Tag>
          <Tag
            v-if="lastSyncedAt"
            :color="recentSyncHighlight ? 'success' : 'cyan'"
          >
            后台同步：{{ formatRefreshTime(lastSyncedAt) }}
          </Tag>
          <Tag color="geekblue">
            自动同步周期：{{ Math.floor(autoSyncEverySeconds / 60) }}分钟
          </Tag>
          <Tag color="orange">
            数量：AWS {{ awsExistingCount }} / 阿里云
            {{ aliyunExistingCount }}
          </Tag>
          <Tag color="purple">下次刷新：{{ nextRefreshInSeconds }}s</Tag>
          <Switch v-model:checked="grouped" @change="loadData" />
        </Space>
      </template>

      <Collapse
        v-if="grouped"
        v-model:active-key="expandedGroupKeys"
        class="compact-cloud-assets space-y-2"
      >
        <Collapse.Panel v-for="group in groups" :key="group.user_key">
          <template #header>
            <Space>
              <span>{{ group.user_display_name }}</span>
              <Tag color="blue">{{ group.username_label || '-' }}</Tag>
              <Tag>{{ group.tg_user_id || '未绑定' }}</Tag>
              <Tag>{{ activeAssetCount(group.items) }} 条</Tag>
            </Space>
          </template>
          <Table
            :columns="columns"
            :data-source="group.items"
            :loading="loading"
            :pagination="false"
            row-key="id"
            :scroll="{ x: 1200 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'username_label'">
                <div
                  v-if="record.username_label && record.username_label !== '-'"
                  class="max-w-full overflow-hidden"
                >
                  <TypographyParagraph
                    :ellipsis="
                      isUsernameExpanded(record.id)
                        ? false
                        : { rows: 1, tooltip: record.username_label }
                    "
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.username_label }}
                  </TypographyParagraph>
                  <Button
                    size="small"
                    type="link"
                    class="mt-1 h-auto px-0 py-0"
                    @click="toggleUsernameExpand(record.id)"
                  >
                    {{ isUsernameExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'asset_name'">
                <div class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="
                      isAssetNameExpanded(record.id)
                        ? false
                        : { rows: 1, tooltip: record.asset_name || '-' }
                    "
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.asset_name || '-' }}
                  </TypographyParagraph>
                  <Button
                    size="small"
                    type="link"
                    class="mt-1 h-auto px-0 py-0"
                    @click="toggleAssetNameExpand(record.id)"
                  >
                    {{ isAssetNameExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                  <Tag :color="record.kind === 'mtproxy' ? 'purple' : 'blue'">
                    {{ record.kind === 'mtproxy' ? 'MTProxy' : '服务器' }}
                  </Tag>
                </div>
              </template>
              <template v-else-if="column.key === 'sort_order'">
                <Tag :color="sortOrderTagColor(record.sort_order)">
                  {{ record.sort_order || 99 }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'account_label'">
                <TypographyParagraph
                  v-if="record.account_label"
                  :copyable="{ text: record.account_label }"
                  class="mb-0 break-all font-mono text-xs leading-5"
                >
                  {{ record.account_label }}
                </TypographyParagraph>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'mtproxy_link'">
                <div
                  v-if="record.mtproxy_link"
                  class="max-w-full overflow-hidden"
                >
                  <TypographyParagraph
                    :ellipsis="
                      isLinkExpanded(record.id)
                        ? false
                        : { rows: 1, tooltip: record.mtproxy_link }
                    "
                    :copyable="{ text: record.mtproxy_link }"
                    class="mb-0 max-h-32 overflow-y-auto break-all font-mono text-xs leading-5"
                  >
                    {{ record.mtproxy_link }}
                  </TypographyParagraph>
                  <Button
                    size="small"
                    type="link"
                    class="mt-1 h-auto px-0 py-0"
                    @click="toggleLinkExpand(record.id)"
                  >
                    {{ isLinkExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'actual_expires_at'">
                <span>{{
                  record.actual_expires_at
                    ? dayjs(record.actual_expires_at).format('YYYY-MM-DD')
                    : '-'
                }}</span>
              </template>
              <template v-else-if="column.key === 'note'">
                <div v-if="record.note" class="max-w-full overflow-hidden">
                  <TypographyParagraph
                    :ellipsis="
                      isNoteExpanded(record.id)
                        ? false
                        : { rows: 1, tooltip: record.note }
                    "
                    class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
                  >
                    {{ record.note }}
                  </TypographyParagraph>
                  <Button
                    size="small"
                    type="link"
                    class="mt-1 h-auto px-0 py-0"
                    @click="toggleNoteExpand(record.id)"
                  >
                    {{ isNoteExpanded(record.id) ? '收起' : '展开' }}
                  </Button>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag
                  :color="
                    (record.provider_status || '').includes('未附加固定IP')
                      ? 'warning'
                      : record.status === 'deleted'
                        ? 'default'
                        : record.is_active
                          ? 'success'
                          : record.status === 'terminated'
                            ? 'default'
                            : 'warning'
                  "
                >
                  {{
                    (record.provider_status || '').includes('未附加固定IP')
                      ? '未附加IP'
                      : record.status_label || record.status || '-'
                  }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'status_countdown'">
                <Tag
                  :color="
                    countdownTagColor(
                      record.preserve_link_status ||
                        record.status_countdown ||
                        record.provider_status ||
                        '-',
                    )
                  "
                >
                  {{
                    record.preserve_link_status ||
                    record.status_countdown ||
                    record.provider_status ||
                    '-'
                  }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space>
                  <Button
                    type="link"
                    @click="openDetail(record as DashboardCloudAssetItem)"
                  >
                    详情
                  </Button>
                  <Button
                    type="link"
                    @click="openEdit(record as DashboardCloudAssetItem)"
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    v-if="
                      canRebuildPreserveLink(record as DashboardCloudAssetItem)
                    "
                    title="确认按 AWS 方案重装并保持链接不变吗？系统会后台创建新实例、切换固定 IP、复用 MTProxy 密钥，成功后删除旧实例。"
                    @confirm="
                      rebuildPreserveLink(record as DashboardCloudAssetItem)
                    "
                  >
                    <Button
                      type="link"
                      :loading="
                        rebuildingServerId === (record.server_id || null)
                      "
                    >
                      重装
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="确认删除该代理/服务器记录吗？"
                    @confirm="deleteAsset(record as DashboardCloudAssetItem)"
                  >
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
        :scroll="{ x: 1200 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username_label'">
            <div
              v-if="record.username_label && record.username_label !== '-'"
              class="max-w-full overflow-hidden"
            >
              <TypographyParagraph
                :ellipsis="
                  isUsernameExpanded(record.id)
                    ? false
                    : { rows: 1, tooltip: record.username_label }
                "
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.username_label }}
              </TypographyParagraph>
              <Button
                size="small"
                type="link"
                class="mt-1 h-auto px-0 py-0"
                @click="toggleUsernameExpand(record.id)"
              >
                {{ isUsernameExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'asset_name'">
            <div class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="
                  isAssetNameExpanded(record.id)
                    ? false
                    : { rows: 1, tooltip: record.asset_name || '-' }
                "
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.asset_name || '-' }}
              </TypographyParagraph>
              <Button
                size="small"
                type="link"
                class="mt-1 h-auto px-0 py-0"
                @click="toggleAssetNameExpand(record.id)"
              >
                {{ isAssetNameExpanded(record.id) ? '收起' : '展开' }}
              </Button>
              <Tag :color="record.kind === 'mtproxy' ? 'purple' : 'blue'">
                {{ record.kind === 'mtproxy' ? 'MTProxy' : '服务器' }}
              </Tag>
            </div>
          </template>
          <template v-else-if="column.key === 'sort_order'">
            <Tag :color="sortOrderTagColor(record.sort_order)">
              {{ record.sort_order || 99 }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'account_label'">
            <TypographyParagraph
              v-if="record.account_label"
              :copyable="{ text: record.account_label }"
              class="mb-0 break-all font-mono text-xs leading-5"
            >
              {{ record.account_label }}
            </TypographyParagraph>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'mtproxy_link'">
            <div v-if="record.mtproxy_link" class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="
                  isLinkExpanded(record.id)
                    ? false
                    : { rows: 1, tooltip: record.mtproxy_link }
                "
                :copyable="{ text: record.mtproxy_link }"
                class="mb-0 max-h-32 overflow-y-auto break-all font-mono text-xs leading-5"
              >
                {{ record.mtproxy_link }}
              </TypographyParagraph>
              <Button
                size="small"
                type="link"
                class="mt-1 h-auto px-0 py-0"
                @click="toggleLinkExpand(record.id)"
              >
                {{ isLinkExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actual_expires_at'">
            <span>{{
              record.actual_expires_at
                ? dayjs(record.actual_expires_at).format('YYYY-MM-DD')
                : '-'
            }}</span>
          </template>
          <template v-else-if="column.key === 'note'">
            <div v-if="record.note" class="max-w-full overflow-hidden">
              <TypographyParagraph
                :ellipsis="
                  isNoteExpanded(record.id)
                    ? false
                    : { rows: 1, tooltip: record.note }
                "
                class="mb-0 max-h-24 overflow-y-auto break-all text-xs leading-5"
              >
                {{ record.note }}
              </TypographyParagraph>
              <Button
                size="small"
                type="link"
                class="mt-1 h-auto px-0 py-0"
                @click="toggleNoteExpand(record.id)"
              >
                {{ isNoteExpanded(record.id) ? '收起' : '展开' }}
              </Button>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag
              :color="
                (record.provider_status || '').includes('未附加固定IP')
                  ? 'warning'
                  : record.status === 'deleted'
                    ? 'default'
                    : record.is_active
                      ? 'success'
                      : record.status === 'terminated'
                        ? 'default'
                        : 'warning'
              "
            >
              {{
                (record.provider_status || '').includes('未附加固定IP')
                  ? '未附加IP'
                  : record.status_label || record.status || '-'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status_countdown'">
            <Tag
              :color="
                countdownTagColor(
                  record.preserve_link_status ||
                    record.status_countdown ||
                    record.provider_status ||
                    '-',
                )
              "
            >
              {{
                record.preserve_link_status ||
                record.status_countdown ||
                record.provider_status ||
                '-'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                type="link"
                @click="openDetail(record as DashboardCloudAssetItem)"
              >
                详情
              </Button>
              <Button
                type="link"
                @click="openEdit(record as DashboardCloudAssetItem)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canRebuildPreserveLink(record as DashboardCloudAssetItem)"
                title="确认按 AWS 方案重装并保持链接不变吗？系统会后台创建新实例、切换固定 IP、复用 MTProxy 密钥，成功后删除旧实例。"
                @confirm="
                  rebuildPreserveLink(record as DashboardCloudAssetItem)
                "
              >
                <Button
                  type="link"
                  :loading="rebuildingServerId === (record.server_id || null)"
                >
                  重装
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认删除该代理/服务器记录吗？"
                @confirm="deleteAsset(record as DashboardCloudAssetItem)"
              >
                <Button danger type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="saving"
      title="编辑代理"
      width="720px"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="用户">
          <Input
            v-model:value="formState.user_query"
            placeholder="输入后台用户ID / Telegram ID / 用户名，自动识别并绑定，逻辑与之前一致"
          />
        </Form.Item>
        <Form.Item label="当前显示用户">
          <Input :value="currentRow?.user_display_name || ''" disabled />
        </Form.Item>
        <Form.Item label="云账号ID">
          <Input :value="currentRow?.account_label || ''" disabled />
        </Form.Item>
        <Form.Item label="价格">
          <Input v-model:value="formState.price" placeholder="关联订单价格" />
        </Form.Item>
        <Form.Item
          extra="这里是服务到期时间；默认值 99 表示不人工干预排序，数字越大越靠前，已删除默认沉底。"
          label="到期日期"
        >
          <DatePicker
            v-model:value="formState.actual_expires_at"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="formState.sort_order"
            :min="0"
            :precision="0"
            placeholder="99=默认排序"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="公网 IP">
          <Input v-model:value="formState.public_ip" placeholder="x.x.x.x" />
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
