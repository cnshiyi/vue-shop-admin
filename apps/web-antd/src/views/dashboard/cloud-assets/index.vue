<script lang="ts" setup>
import type {
  DashboardCloudAssetGroup,
  DashboardCloudAssetItem,
  DashboardCloudAssetUpdatePayload,
  DashboardTelegramGroupFilterItem,
} from '#/api/admin';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
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
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteDashboardCloudAssetApi,
  getDashboardCloudAssetsPageApi,
  getDashboardCloudAssetsSyncStatusApi,
  getDashboardTelegramGroupsApi,
  syncDashboardCloudAssetsApi,
  syncDashboardCloudAssetStatusApi,
  toggleDashboardCloudAssetAutoRenewApi,
  updateDashboardCloudAssetApi,
} from '#/api/admin';

const DEFAULT_AUTO_REFRESH_SECONDS = 5 * 60 * 60;
const ASSET_PAGE_SIZE = 20;

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const assetSyncingIds = ref<number[]>([]);
const autoRenewSavingIds = ref<number[]>([]);
const keyword = ref('');
const grouped = ref(true);
const groupMode = ref<'telegram_group' | 'user'>('telegram_group');
const lastRefreshedAt = ref<dayjs.Dayjs | null>(null);
const lastSyncedAt = ref<dayjs.Dayjs | null>(null);
const nextRefreshInSeconds = ref(DEFAULT_AUTO_REFRESH_SECONDS);
const recentSyncHighlight = ref(false);
const autoSyncEverySeconds = ref(DEFAULT_AUTO_REFRESH_SECONDS);
const awsExistingCount = ref(0);
const aliyunExistingCount = ref(0);
const unattachedIpCount = ref(0);
const items = ref<DashboardCloudAssetItem[]>([]);
const groups = ref<DashboardCloudAssetGroup[]>([]);
const telegramGroups = ref<DashboardTelegramGroupFilterItem[]>([]);
const loadingMore = ref(false);
const loadProgress = reactive({
  done: true,
  loaded: 0,
  pageSize: ASSET_PAGE_SIZE,
  total: 0,
});
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
  telegram_group_id: undefined as number | undefined,
  telegram_group_query: '',
  user_query: '',
});
let countdownTimer: null | ReturnType<typeof setInterval> = null;
let syncHighlightTimer: null | ReturnType<typeof setTimeout> = null;
let loadSequence = 0;

function normalizeDaysLeft(record: DashboardCloudAssetItem) {
  if (typeof record.days_left !== 'number' || Number.isNaN(record.days_left)) {
    return record.actual_expires_at ? Number.POSITIVE_INFINITY : 0;
  }
  return record.days_left;
}

function normalizeExpiresAt(value: null | string | undefined) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
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

function userGroupTitle(item: DashboardCloudAssetItem) {
  return item.user_display_name || '未绑定用户';
}

function userGroupLabel(item: DashboardCloudAssetItem) {
  return item.username_label || String(item.tg_user_id || item.user_id || '-');
}

function userGroupId(item: DashboardCloudAssetItem) {
  return item.user_id || item.tg_user_id || null;
}

function telegramGroupTitle(item: DashboardCloudAssetItem) {
  if (!item.telegram_group_id) return '未绑定群组';
  return (
    item.telegram_group_title ||
    String(item.telegram_group_chat_id || item.telegram_group_id)
  );
}

function telegramGroupLabel(item: DashboardCloudAssetItem) {
  if (!item.telegram_group_id) return '-';
  return item.telegram_group_username
    ? `@${item.telegram_group_username}`
    : String(item.telegram_group_chat_id || '-');
}

function buildAssetGroups(records: DashboardCloudAssetItem[]) {
  const groupMap = new Map<string, DashboardCloudAssetGroup>();
  for (const item of sortAssets(records)) {
    const fallbackUserId = userGroupId(item);
    const useUserGroup = groupMode.value === 'user' || !item.telegram_group_id;
    const groupKey = useUserGroup
      ? `user:${fallbackUserId || 'unbound'}`
      : `group:${item.telegram_group_id}`;
    const group = groupMap.get(groupKey) || {
      default_expanded: true,
      items: [],
      telegram_group_chat_id: useUserGroup
        ? undefined
        : item.telegram_group_chat_id,
      telegram_group_id: useUserGroup ? undefined : item.telegram_group_id,
      telegram_group_title: useUserGroup ? undefined : telegramGroupTitle(item),
      telegram_group_username: useUserGroup
        ? undefined
        : item.telegram_group_username,
      tg_user_id: useUserGroup ? fallbackUserId : null,
      user_display_name: useUserGroup
        ? userGroupTitle(item)
        : telegramGroupTitle(item),
      user_key: groupKey,
      username_label: useUserGroup
        ? userGroupLabel(item)
        : telegramGroupLabel(item),
    };
    group.items.push(item);
    groupMap.set(groupKey, group);
  }
  return [...groupMap.values()].toSorted((a, b) => {
    const aExpires = Math.min(
      ...a.items.map((item) => normalizeExpiresAt(item.actual_expires_at)),
    );
    const bExpires = Math.min(
      ...b.items.map((item) => normalizeExpiresAt(item.actual_expires_at)),
    );
    if (aExpires !== bExpires) return aExpires - bExpires;
    return String(
      a.user_display_name || a.telegram_group_title || '未绑定',
    ).localeCompare(
      String(b.user_display_name || b.telegram_group_title || '未绑定'),
    );
  });
}

function refreshGroupedItems(records: DashboardCloudAssetItem[]) {
  groups.value = buildAssetGroups(records);
  expandedGroupKeys.value = groups.value
    .filter((group) => group.default_expanded !== false)
    .map((group) => group.user_key);
}

function regionDisplay(record: DashboardCloudAssetItem) {
  return record.region_label || record.region_name || record.region_code || '-';
}

function hasAssetPrice(record: DashboardCloudAssetItem) {
  const price = Number(record.price || 0);
  return Number.isFinite(price) && price > 0;
}

function assetPriceLabel(record: DashboardCloudAssetItem) {
  if (!hasAssetPrice(record)) {
    return '未设置';
  }
  return `${record.price} ${record.currency || 'USDT'}`;
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
  { title: '价格', dataIndex: 'price', key: 'price', width: 130 },
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
  {
    title: '自动续费',
    dataIndex: 'auto_renew_enabled',
    key: 'auto_renew_enabled',
    width: 130,
  },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 180 },
];

const assetTableColumns = computed(() => {
  if (grouped.value && groupMode.value === 'telegram_group') {
    return columns.filter(
      (column) => !['user_display_name', 'username_label'].includes(column.key),
    );
  }
  return columns;
});

function groupUserSummary(group: DashboardCloudAssetGroup) {
  if (!group.telegram_group_id) return '';
  const labels = group.items
    .map((item) => {
      if (item.user_display_name && item.user_display_name !== '未绑定用户') {
        return item.user_display_name;
      }
      if (item.username_label && item.username_label !== '-') {
        return item.username_label;
      }
      if (item.tg_user_id) return `TG ${item.tg_user_id}`;
      if (item.user_id) return `用户 ${item.user_id}`;
      return '';
    })
    .filter(Boolean);
  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length === 0) return '未绑定用户';
  if (uniqueLabels.length <= 2) return uniqueLabels.join('、');
  return `${uniqueLabels.slice(0, 2).join('、')} 等 ${uniqueLabels.length} 个用户`;
}

function asDashboardCloudAssetItem(record: Record<string, any>) {
  return record as DashboardCloudAssetItem;
}

function openDetail(record: DashboardCloudAssetItem) {
  router.push(`/admin/cloud-assets/${record.id}`).catch(() => {});
}

function formatRefreshTime(value: dayjs.Dayjs | null) {
  return value ? value.format('MM-DD HH:mm:ss') : '-';
}

function normalizedIntervalSeconds(value: number | undefined) {
  const seconds = Number(value || DEFAULT_AUTO_REFRESH_SECONDS);
  return Number.isFinite(seconds) && seconds >= 60
    ? Math.floor(seconds)
    : DEFAULT_AUTO_REFRESH_SECONDS;
}

function formatDuration(seconds: number) {
  if (seconds % 3600 === 0) {
    return `${seconds / 3600}小时`;
  }
  if (seconds % 60 === 0) {
    return `${seconds / 60}分钟`;
  }
  return `${seconds}秒`;
}

function resetRefreshCountdown() {
  nextRefreshInSeconds.value = autoSyncEverySeconds.value;
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
  const sequence = ++loadSequence;
  loading.value = true;
  loadingMore.value = false;
  loadProgress.done = false;
  loadProgress.loaded = 0;
  loadProgress.total = 0;
  loadProgress.pageSize = ASSET_PAGE_SIZE;
  try {
    const keywordText = keyword.value.trim();
    const [syncStatus, firstPage] = await Promise.all([
      getDashboardCloudAssetsSyncStatusApi(),
      getDashboardCloudAssetsPageApi({
        keyword: keywordText,
        page: 1,
        page_size: ASSET_PAGE_SIZE,
      }),
    ]);
    if (sequence !== loadSequence) return;
    autoSyncEverySeconds.value = normalizedIntervalSeconds(
      syncStatus.auto_sync_every_seconds,
    );
    resetRefreshCountdown();
    lastSyncedAt.value = syncStatus.last_synced_at
      ? dayjs(syncStatus.last_synced_at)
      : null;
    awsExistingCount.value = syncStatus.aws_existing_count || 0;
    aliyunExistingCount.value = syncStatus.aliyun_existing_count || 0;
    unattachedIpCount.value = syncStatus.unattached_ip_count || 0;

    items.value = sortAssets(firstPage.items || []);
    loadProgress.total = firstPage.total || items.value.length;
    loadProgress.loaded = items.value.length;
    if (grouped.value) {
      refreshGroupedItems(items.value);
    } else {
      groups.value = [];
      expandedGroupKeys.value = [];
    }
    loading.value = false;

    const totalPages = Math.ceil(loadProgress.total / ASSET_PAGE_SIZE);
    loadingMore.value = totalPages > 1;
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await getDashboardCloudAssetsPageApi({
        keyword: keywordText,
        page,
        page_size: ASSET_PAGE_SIZE,
      });
      if (sequence !== loadSequence) return;
      items.value = sortAssets([...items.value, ...(response.items || [])]);
      loadProgress.total = response.total || loadProgress.total;
      loadProgress.loaded = items.value.length;
      if (grouped.value) {
        refreshGroupedItems(items.value);
      }
    }
    loadProgress.done = true;
  } finally {
    if (sequence === loadSequence) {
      loading.value = false;
      loadingMore.value = false;
      loadProgress.done = true;
      lastRefreshedAt.value = dayjs();
      resetRefreshCountdown();
    }
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

async function loadTelegramGroups() {
  try {
    telegramGroups.value = await getDashboardTelegramGroupsApi({
      binding_only: true,
    });
  } catch {
    telegramGroups.value = [];
  }
}

function telegramGroupOptions() {
  return telegramGroups.value
    .filter((item) => !item.collapsed)
    .map((item) => ({
      label: `${item.title || item.chat_id}${item.username ? ` (@${item.username})` : ''}`,
      value: item.id,
    }));
}

function isAssetSyncing(assetId: number) {
  return assetSyncingIds.value.includes(assetId);
}

async function syncAssetStatus(record: DashboardCloudAssetItem) {
  assetSyncingIds.value = [...assetSyncingIds.value, record.id];
  try {
    const result = await syncDashboardCloudAssetStatusApi(record.id);
    if (result?.asset) {
      replaceAssetInList(result.asset);
    }
    if (result?.ok === false || result?.errors?.length) {
      message.warning(
        `已尝试更新 ${record.public_ip || record.asset_name || `#${record.id}`}，但同步返回异常`,
      );
      return;
    }
    message.success(
      `已更新 ${record.public_ip || record.asset_name || `#${record.id}`} 的服务器状态`,
    );
  } catch (error: any) {
    message.error(error?.message || '更新状态失败');
  } finally {
    assetSyncingIds.value = assetSyncingIds.value.filter(
      (id) => id !== record.id,
    );
  }
}

async function syncAssets() {
  syncing.value = true;
  try {
    const result = await syncDashboardCloudAssetsApi();
    markRecentSync();
    await loadData();
    if (result?.ok === false || result?.errors?.length) {
      message.warning('代理同步完成，但存在错误，请查看后端同步日志');
      return;
    }
    message.success(
      `代理同步完成：AWS 存在 ${awsExistingCount.value} 条，阿里云存在 ${aliyunExistingCount.value} 条，未附加IP ${unattachedIpCount.value} 条`,
    );
  } catch (error: any) {
    message.error(error?.message || '代理同步失败，请查看后端日志');
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
  formState.telegram_group_id = record.telegram_group_id || undefined;
  formState.telegram_group_query = record.telegram_group_chat_id
    ? String(record.telegram_group_chat_id)
    : record.telegram_group_username || record.telegram_group_title || '';
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

function isAutoRenewSaving(id: number) {
  return autoRenewSavingIds.value.includes(id);
}

async function toggleAutoRenew(
  record: DashboardCloudAssetItem,
  enabled: boolean,
) {
  if (!record.order_id) {
    message.error('该代理未绑定订单，无法设置自动续费');
    return;
  }
  autoRenewSavingIds.value = [...autoRenewSavingIds.value, record.id];
  try {
    const updatedAsset = await toggleDashboardCloudAssetAutoRenewApi(
      record.id,
      enabled,
    );
    replaceAssetInList(updatedAsset);
    message.success(enabled ? '已开启自动续费' : '已关闭自动续费');
  } catch (error: any) {
    message.error(error?.message || '自动续费设置失败');
  } finally {
    autoRenewSavingIds.value = autoRenewSavingIds.value.filter(
      (id) => id !== record.id,
    );
  }
}

async function deleteAsset(record: DashboardCloudAssetItem) {
  try {
    await deleteDashboardCloudAssetApi(record.id);
    message.success('代理列表记录已删除；后续同步会按云上真实状态重新拉回');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除代理失败');
  }
}

function startAutoRefresh() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  resetRefreshCountdown();
  countdownTimer = setInterval(() => {
    if (
      !editOpen.value &&
      !loading.value &&
      !loadingMore.value &&
      !saving.value &&
      !syncing.value
    ) {
      nextRefreshInSeconds.value = Math.max(0, nextRefreshInSeconds.value - 1);
      if (nextRefreshInSeconds.value <= 0) {
        resetRefreshCountdown();
        loadData();
      }
    }
  }, 1000);
}

function stopAutoRefresh() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (syncHighlightTimer) {
    clearTimeout(syncHighlightTimer);
    syncHighlightTimer = null;
  }
}

function normalizedValue(value: null | string | undefined) {
  return value || '';
}

function normalizedDateValue(value: any) {
  if (!value) {
    return '';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
}

function replaceAssetInList(asset: DashboardCloudAssetItem) {
  const index = items.value.findIndex((item) => item.id === asset.id);
  if (index === -1) {
    return;
  }
  items.value = sortAssets([
    ...items.value.slice(0, index),
    asset,
    ...items.value.slice(index + 1),
  ]);
  if (grouped.value) {
    refreshGroupedItems(items.value);
  }
  currentRow.value = asset;
}

function buildAssetEditPayload(record: DashboardCloudAssetItem) {
  const payload: DashboardCloudAssetUpdatePayload = {};
  const nextExpiresAt = normalizedDateValue(formState.actual_expires_at);
  const previousExpiresAt = normalizedDateValue(record.actual_expires_at);
  if (nextExpiresAt !== previousExpiresAt) {
    payload.actual_expires_at = nextExpiresAt || null;
  }
  const nextIsActive = Boolean(formState.is_active);
  if (nextIsActive !== record.is_active) {
    payload.is_active = nextIsActive;
  }
  const nextNote = formState.note || '';
  if (nextNote !== normalizedValue(record.note)) {
    payload.note = nextNote || null;
  }
  const nextSortOrder = Number(formState.sort_order || 99);
  if (nextSortOrder !== Number(record.sort_order || 99)) {
    payload.sort_order = nextSortOrder;
  }
  const nextPrice = formState.price || '';
  if (nextPrice !== normalizedValue(record.price)) {
    payload.price = nextPrice || null;
  }
  const nextPublicIp = formState.public_ip || '';
  if (nextPublicIp !== normalizedValue(record.public_ip)) {
    payload.public_ip = nextPublicIp || null;
  }
  const previousUserQuery = record.user_id
    ? String(record.user_id)
    : (record.tg_user_id
      ? String(record.tg_user_id)
      : '');
  const nextUserQuery = formState.user_query.trim();
  if (nextUserQuery !== previousUserQuery) {
    payload.user_query = nextUserQuery || null;
  }
  const previousTelegramGroupQuery = record.telegram_group_chat_id
    ? String(record.telegram_group_chat_id)
    : record.telegram_group_username || record.telegram_group_title || '';
  const nextTelegramGroupQuery = formState.telegram_group_query.trim();
  if (nextTelegramGroupQuery === previousTelegramGroupQuery) {
    const nextTelegramGroupId = formState.telegram_group_id || null;
    if (nextTelegramGroupId !== (record.telegram_group_id || null)) {
      payload.telegram_group_id = nextTelegramGroupId;
    }
  } else {
    payload.telegram_group_query = nextTelegramGroupQuery || null;
  }
  return payload;
}

async function submitEdit() {
  if (!currentRow.value) return;
  saving.value = true;
  try {
    const payload = buildAssetEditPayload(currentRow.value);
    if (Object.keys(payload).length === 0) {
      message.info('没有检测到变更');
      editOpen.value = false;
      return;
    }
    const updatedAsset = await updateDashboardCloudAssetApi(
      currentRow.value.id,
      payload,
    );
    replaceAssetInList(updatedAsset);
    message.success('代理已更新');
    editOpen.value = false;
  } catch (error: any) {
    message.error(error?.message || '更新失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadData();
  loadTelegramGroups();
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
        <Space class="cloud-assets-toolbar" wrap>
          <span>代理数据</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            class="cloud-assets-search"
            enter-button="搜索"
            placeholder="搜索用户、用户名、IP、代理链接"
            @search="loadData"
          />
          <Button size="small" :loading="syncing" @click="syncAssets">
            同步代理
          </Button>
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
          <Tag v-if="syncing" color="processing">同步中…</Tag>
          <Tag v-else-if="loading" color="processing">刷新中…</Tag>
          <Tag v-else-if="loadingMore" color="processing">继续加载中…</Tag>
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
            自动同步周期：{{ formatDuration(autoSyncEverySeconds) }}
          </Tag>
          <Tag color="orange">
            数量：AWS {{ awsExistingCount }} / 阿里云
            {{ aliyunExistingCount }}
          </Tag>
          <Tag color="purple">下次刷新：{{ nextRefreshInSeconds }}s</Tag>
          <Select
            v-if="grouped"
            v-model:value="groupMode"
            style="width: 130px"
            :options="[
              { label: '按群组分区', value: 'telegram_group' },
              { label: '按用户分区', value: 'user' },
            ]"
            @change="refreshGroupedItems(items)"
          />
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
            <Space wrap>
              <span>{{ group.user_display_name }}</span>
              <Tag color="blue">{{ group.username_label || '-' }}</Tag>
              <Tag>
                {{
                  group.telegram_group_id
                    ? group.telegram_group_chat_id || '未绑定群组'
                    : group.tg_user_id || '未绑定用户'
                }}
              </Tag>
              <Tag v-if="group.telegram_group_id" color="green">
                用户：{{ groupUserSummary(group) }}
              </Tag>
              <Tag>{{ activeAssetCount(group.items) }} 条</Tag>
            </Space>
          </template>
          <Table
            :columns="assetTableColumns"
            :data-source="group.items"
            :loading="loading"
            :pagination="false"
            row-key="id"
            :scroll="{ x: 'max-content' }"
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
              <template v-else-if="column.key === 'region_label'">
                <Space direction="vertical" :size="2">
                  <span>{{
                    regionDisplay(asDashboardCloudAssetItem(record))
                  }}</span>
                  <Tag v-if="record.region_code" color="geekblue">
                    {{ record.region_code }}
                  </Tag>
                </Space>
              </template>
              <template v-else-if="column.key === 'price'">
                <Tag
                  :color="
                    hasAssetPrice(asDashboardCloudAssetItem(record))
                      ? 'success'
                      : 'error'
                  "
                >
                  {{ assetPriceLabel(asDashboardCloudAssetItem(record)) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'auto_renew_enabled'">
                <Space direction="vertical" :size="2">
                  <Tag :color="record.auto_renew_enabled ? 'success' : 'error'">
                    {{ record.auto_renew_enabled ? '已开启' : '已关闭' }}
                  </Tag>
                  <Switch
                    :checked="Boolean(record.auto_renew_enabled)"
                    checked-children="开"
                    un-checked-children="关"
                    :disabled="!record.order_id"
                    :loading="isAutoRenewSaving(record.id)"
                    @change="
                      (checked) =>
                        toggleAutoRenew(
                          asDashboardCloudAssetItem(record),
                          Boolean(checked),
                        )
                    "
                  />
                </Space>
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
                <Space class="cloud-assets-actions" wrap>
                  <Button
                    type="link"
                    @click="openDetail(asDashboardCloudAssetItem(record))"
                  >
                    详情
                  </Button>
                  <Button
                    type="link"
                    @click="openEdit(asDashboardCloudAssetItem(record))"
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    :loading="isAssetSyncing(record.id)"
                    @click="syncAssetStatus(asDashboardCloudAssetItem(record))"
                  >
                    更新
                  </Button>
                  <Popconfirm
                    title="确认只删除代理列表记录吗？不会删除真实云服务器；后续同步会按云上真实状态重新拉回。"
                    @confirm="deleteAsset(asDashboardCloudAssetItem(record))"
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
        :columns="assetTableColumns"
        :data-source="items"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :scroll="{ x: 'max-content' }"
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
          <template v-else-if="column.key === 'region_label'">
            <Space direction="vertical" :size="2">
              <span>{{
                regionDisplay(asDashboardCloudAssetItem(record))
              }}</span>
              <Tag v-if="record.region_code" color="geekblue">
                {{ record.region_code }}
              </Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'price'">
            <Tag
              :color="
                hasAssetPrice(asDashboardCloudAssetItem(record))
                  ? 'success'
                  : 'error'
              "
            >
              {{ assetPriceLabel(asDashboardCloudAssetItem(record)) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'auto_renew_enabled'">
            <Space direction="vertical" :size="2">
              <Tag :color="record.auto_renew_enabled ? 'success' : 'error'">
                {{ record.auto_renew_enabled ? '已开启' : '已关闭' }}
              </Tag>
              <Switch
                :checked="Boolean(record.auto_renew_enabled)"
                checked-children="开"
                un-checked-children="关"
                :disabled="!record.order_id"
                :loading="isAutoRenewSaving(record.id)"
                @change="
                  (checked) =>
                    toggleAutoRenew(
                      record as DashboardCloudAssetItem,
                      Boolean(checked),
                    )
                "
              />
            </Space>
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
            <Space class="cloud-assets-actions" wrap>
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
              <Button
                type="link"
                :loading="isAssetSyncing(record.id)"
                @click="syncAssetStatus(record as DashboardCloudAssetItem)"
              >
                更新
              </Button>
              <Popconfirm
                title="确认只删除代理列表记录吗？不会删除真实云服务器；后续同步会按云上真实状态重新拉回。"
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
      width="min(720px, calc(100vw - 32px))"
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
        <Form.Item label="绑定群组">
          <Select
            v-model:value="formState.telegram_group_id"
            allow-clear
            show-search
            :filter-option="true"
            :options="telegramGroupOptions()"
            placeholder="选择要绑定的 Telegram 群组"
          />
        </Form.Item>
        <Form.Item
          extra="可输入后台群组ID、Telegram 群组 Chat ID、@用户名或群名；留空表示解绑群组。"
          label="群组识别"
        >
          <Input
            v-model:value="formState.telegram_group_query"
            placeholder="例如：1 / -1001234567890 / @groupname / 群名"
          />
        </Form.Item>
        <Form.Item label="当前显示群组">
          <Input :value="currentRow?.telegram_group_title || ''" disabled />
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
.cloud-assets-toolbar {
  row-gap: 8px;
  width: 100%;
}

.cloud-assets-search {
  min-width: 180px;
  width: min(360px, 100%);
}

.cloud-assets-actions {
  row-gap: 0;
}

:deep(.ant-card-head-title) {
  min-width: 0;
  white-space: normal;
}

:deep(.ant-table-wrapper) {
  max-width: 100%;
}

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
