<script lang="ts" setup>
import type {
  DashboardSiteConfigGroup,
  DashboardSiteConfigGroupItem,
  DashboardSiteConfigItem,
} from '#/api/admin';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Input, message, Space } from 'ant-design-vue';

import {
  getDashboardSiteConfigGroupsApi,
  getDashboardSiteConfigsApi,
  initDashboardSiteConfigsApi,
  updateDashboardSiteConfigApi,
} from '#/api/admin';

const props = defineProps<{
  description?: string;
  groupKey: string;
  title: string;
}>();

const loading = ref(false);
const initLoading = ref(false);
const siteConfigs = ref<DashboardSiteConfigItem[]>([]);
const configGroups = ref<DashboardSiteConfigGroup[]>([]);
const savingMap = reactive<Record<string, boolean>>({});
const draftMap = reactive<Record<string, string>>({});
const sensitiveMap = reactive<Record<string, boolean>>({});
const maskedMap = reactive<Record<string, boolean>>({});

const activeGroup = computed(
  () =>
    configGroups.value.find((item) => item.group === props.groupKey) || null,
);
const items = computed(() => activeGroup.value?.items || []);

function syncDrafts() {
  for (const item of items.value) {
    sensitiveMap[item.key] = !!item.is_sensitive;
    if (item.is_sensitive) {
      const preview = item.value_preview || '';
      draftMap[item.key] = preview;
      maskedMap[item.key] = !!preview;
    } else {
      draftMap[item.key] = item.value || '';
      maskedMap[item.key] = false;
    }
  }
}

async function loadData() {
  loading.value = true;
  try {
    const [configs, groups] = await Promise.all([
      getDashboardSiteConfigsApi(),
      getDashboardSiteConfigGroupsApi(),
    ]);
    siteConfigs.value = configs;
    configGroups.value = groups;
    syncDrafts();
  } finally {
    loading.value = false;
  }
}

function currentConfig(item: DashboardSiteConfigGroupItem) {
  return siteConfigs.value.find((config) => config.key === item.key) || null;
}

async function initConfigs() {
  initLoading.value = true;
  try {
    await initDashboardSiteConfigsApi({ scope: 'configs' });
    message.success('配置项已初始化');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '初始化失败');
  } finally {
    initLoading.value = false;
  }
}

function activateSensitiveEdit(item: DashboardSiteConfigGroupItem) {
  if (!item.is_sensitive || !maskedMap[item.key]) {
    return;
  }
  draftMap[item.key] = '';
  maskedMap[item.key] = false;
}

async function saveItem(item: DashboardSiteConfigGroupItem) {
  const current = currentConfig(item);
  if (!current?.id) {
    message.error('该配置尚未初始化，请先点击顶部“初始化配置”');
    return;
  }
  const value = draftMap[item.key] ?? '';
  const preserveExisting =
    !!item.is_sensitive && (maskedMap[item.key] || !value.trim());
  savingMap[item.key] = true;
  try {
    await updateDashboardSiteConfigApi(current.id, {
      is_sensitive: !!sensitiveMap[item.key],
      key: item.key,
      preserve_existing: preserveExisting,
      value: preserveExisting ? '' : value,
    });
    message.success(
      preserveExisting
        ? `已保留原密钥：${item.description || item.key}`
        : `已保存：${item.description || item.key}`,
    );
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    savingMap[item.key] = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page :description="description || ''" :title="title">
    <Space class="mb-4">
      <Button type="primary" :loading="initLoading" @click="initConfigs">
初始化配置
</Button>
      <Button :loading="loading" @click="loadData">刷新</Button>
    </Space>

    <div v-if="items.length > 0" class="config-list">
      <div v-for="item in items" :key="item.key" class="config-row">
        <div class="config-head">
          <div>
            <div class="config-title">{{ item.description || item.key }}</div>
          </div>
          <Space>
            <Button
              type="primary"
              :loading="savingMap[item.key]"
              @click="saveItem(item)"
              >
保存
</Button>
          </Space>
        </div>
        <Input
          v-if="item.is_sensitive"
          v-model:value="draftMap[item.key]"
          :placeholder="item.value_preview || '请输入配置内容'"
          @focus="activateSensitiveEdit(item)"
        />
        <Input.TextArea
          v-else
          v-model:value="draftMap[item.key]"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          :placeholder="item.value || '请输入配置内容'"
        />
      </div>
    </div>

    <div v-else class="empty-hint">暂无配置项，请先点击“初始化配置”。</div>
  </Page>
</template>

<style scoped>
.config-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-row {
  padding: 16px;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 12px;
}

.config-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.config-title {
  font-size: 16px;
  font-weight: 600;
}

.empty-hint {
  color: rgb(107 114 128);
}
</style>
