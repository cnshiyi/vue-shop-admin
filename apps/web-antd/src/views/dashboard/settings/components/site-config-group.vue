<script lang="ts" setup>
import type {
  DashboardSiteConfigGroup,
  DashboardSiteConfigGroupItem,
  DashboardSiteConfigItem,
} from '#/api/admin';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Space,
  Tag,
} from 'ant-design-vue';
import QRCode from 'qrcode';

import {
  bindDashboardTotpApi,
  getDashboardSiteConfigGroupsApi,
  getDashboardSiteConfigsApi,
  initDashboardSiteConfigsApi,
  startDashboardTotpBindApi,
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
const items = computed(() =>
  (activeGroup.value?.items || []).filter(
    (item) => item.key !== 'dashboard_totp_secret',
  ),
);
const totpItem = computed(
  () =>
    (activeGroup.value?.items || []).find(
      (item) => item.key === 'dashboard_totp_secret',
    ) || null,
);
const totpQrCode = ref('');
const totpSecret = ref('');
const totpToken = ref('');
const totpGenerating = ref(false);
const totpBinding = ref(false);

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

async function generateTotpQrCode() {
  totpGenerating.value = true;
  try {
    const result = await startDashboardTotpBindApi();
    totpSecret.value = result.secret;
    totpToken.value = '';
    totpQrCode.value = await QRCode.toDataURL(result.otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
    });
    message.success('二维码已生成，请用 Google Authenticator 扫码');
  } catch (error: any) {
    message.error(error?.message || '生成二维码失败');
  } finally {
    totpGenerating.value = false;
  }
}

async function bindTotp() {
  if (!totpToken.value.trim()) {
    message.error('请输入 Google Authenticator 中显示的 6 位动态码');
    return;
  }
  totpBinding.value = true;
  try {
    await bindDashboardTotpApi({ otp_token: totpToken.value.trim() });
    message.success('Google 二级验证已绑定');
    totpQrCode.value = '';
    totpSecret.value = '';
    totpToken.value = '';
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '动态码校验失败');
  } finally {
    totpBinding.value = false;
  }
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

    <Card v-if="totpItem" class="mb-4" :bordered="false">
      <div class="totp-head">
        <div>
          <div class="config-title">
            {{ totpItem.description || '后台 Google Authenticator 二级验证' }}
          </div>
          <div class="config-desc">
            生成二维码后，用 Google Authenticator 扫码，再输入 6
            位动态码完成绑定。
          </div>
        </div>
        <Tag :color="totpItem.value_preview ? 'green' : 'default'">
          {{ totpItem.value_preview ? '已绑定' : '未绑定' }}
        </Tag>
      </div>
      <Alert
        class="mb-4"
        show-icon
        type="info"
        message="密钥只用于本次绑定；动态码校验通过后才会加密写入后台配置。"
      />
      <Space class="mb-4">
        <Button
          type="primary"
          :loading="totpGenerating"
          @click="generateTotpQrCode"
        >
          {{ totpItem.value_preview ? '重新生成二维码' : '生成绑定二维码' }}
        </Button>
      </Space>
      <div v-if="totpQrCode" class="totp-bind-box">
        <img class="totp-qrcode" :src="totpQrCode" alt="TOTP QR Code" />
        <div class="totp-bind-form">
          <div class="config-desc mb-2">
            不能扫码时，可手动输入密钥：{{ totpSecret }}
          </div>
          <Input
            v-model:value="totpToken"
            class="mb-3"
            autocomplete="one-time-code"
            inputmode="numeric"
            :maxlength="6"
            placeholder="输入 Google Authenticator 6 位动态码"
          />
          <Button type="primary" :loading="totpBinding" @click="bindTotp">
            校验并绑定
          </Button>
        </div>
      </div>
    </Card>

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
        <Input.TextArea
          v-if="item.key === 'trongrid_api_key'"
          v-model:value="draftMap[item.key]"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          :placeholder="item.value_preview || '多个 Key 请每行一个，或用逗号/分号分隔'"
          @focus="activateSensitiveEdit(item)"
        />
        <Input
          v-else-if="item.is_sensitive"
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

.config-desc {
  margin-top: 4px;
  color: rgb(107 114 128);
}

.totp-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.totp-bind-box {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.totp-qrcode {
  width: 220px;
  height: 220px;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 12px;
}

.totp-bind-form {
  flex: 1;
  min-width: 260px;
}

.empty-hint {
  color: rgb(107 114 128);
}
</style>
