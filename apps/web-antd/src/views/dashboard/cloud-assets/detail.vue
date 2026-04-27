<script lang="ts" setup>
import type {
  DashboardCloudAssetDetail,
  DashboardCloudAssetIpLogItem,
} from '#/api/admin';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Empty,
  message,
  Space,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDashboardCloudAssetDetailApi } from '#/api/admin';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<DashboardCloudAssetDetail | null>(null);

const assetId = computed(() => Number(route.params.id || 0));

const logColumns = [
  { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
  { title: '事件', dataIndex: 'event_label', key: 'event_label', width: 120 },
  { title: '当前 IP', dataIndex: 'public_ip', key: 'public_ip', width: 140 },
  {
    title: '上一个 IP',
    dataIndex: 'previous_public_ip',
    key: 'previous_public_ip',
    width: 140,
  },
  { title: '说明', dataIndex: 'note', key: 'note' },
];

function empty(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function formatExpiryTime(value?: null | string) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function statusColor(status?: string) {
  if (['completed', 'paid', 'running'].includes(status || '')) return 'green';
  if (
    [
      'expiring',
      'pending',
      'provisioning',
      'renew_pending',
      'unknown',
    ].includes(status || '')
  )
    return 'orange';
  if (['deleted', 'expired', 'failed', 'terminated'].includes(status || ''))
    return 'red';
  return 'blue';
}

async function loadData() {
  if (!assetId.value) {
    message.error('代理 ID 不正确');
    return;
  }
  loading.value = true;
  try {
    detail.value = await getDashboardCloudAssetDetailApi(assetId.value);
  } catch (error: any) {
    detail.value = null;
    message.error(error?.message || '加载代理详情失败');
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/admin/cloud-assets').catch(() => {});
}

onMounted(loadData);
</script>

<template>
  <Page description="查看代理、云账号、IP、生命周期和构建过程" title="代理详情">
    <Card :loading="loading">
      <template #title>
        <Space>
          <Button size="small" @click="goBack">返回代理列表</Button>
          <span>{{ detail?.asset_name || `代理 #${assetId}` }}</span>
          <Tag v-if="detail" :color="statusColor(detail.status)">
            {{ detail.status_label || detail.status }}
          </Tag>
          <Button v-if="detail" size="small" @click="loadData">刷新</Button>
        </Space>
      </template>

      <template v-if="detail">
        <Descriptions bordered :column="2" size="small" title="基础信息">
          <Descriptions.Item label="资产 ID">{{ detail.id }}</Descriptions.Item>
          <Descriptions.Item label="类型">{{ detail.kind }}</Descriptions.Item>
          <Descriptions.Item label="资产名称">
            {{ empty(detail.asset_name) }}
          </Descriptions.Item>
          <Descriptions.Item label="来源">
            {{ empty(detail.source_label || detail.source) }}
          </Descriptions.Item>
          <Descriptions.Item label="厂商">
            {{ empty(detail.provider_label || detail.provider) }}
          </Descriptions.Item>
          <Descriptions.Item label="地区">
            {{ empty(detail.region_label || detail.region_name) }}
          </Descriptions.Item>
          <Descriptions.Item label="云账号ID" :span="2">
            <Typography.Paragraph
              :copyable="
                detail.account_label ? { text: detail.account_label } : false
              "
              class="!mb-0 break-all font-mono"
            >
              {{ empty(detail.account_label) }}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="内部云账号记录 ID">
            {{ empty(detail.cloud_account_id) }}
          </Descriptions.Item>
          <Descriptions.Item label="排序">
            {{ empty(detail.sort_order) }}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          bordered
          :column="2"
          class="mt-4"
          size="small"
          title="服务器与 IP"
        >
          <Descriptions.Item label="公网 IP">
            {{ empty(detail.public_ip) }}
          </Descriptions.Item>
          <Descriptions.Item label="实例 ID">
            {{ empty(detail.instance_id) }}
          </Descriptions.Item>
          <Descriptions.Item label="云资源 ID" :span="2">
            <Typography.Paragraph
              :copyable="
                detail.provider_resource_id
                  ? { text: detail.provider_resource_id }
                  : false
              "
              class="!mb-0 break-all font-mono"
            >
              {{ empty(detail.provider_resource_id) }}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="资产到期时间">
            {{ formatExpiryTime(detail.actual_expires_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="剩余天数">
            {{ empty(detail.status_countdown) }}
          </Descriptions.Item>
          <Descriptions.Item label="服务开始时间">
            {{ formatTime(detail.service_started_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="服务到期时间">
            {{ formatExpiryTime(detail.service_expires_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="续费宽限到期">
            {{ formatTime(detail.renew_grace_expires_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="最后续费时间">
            {{ formatTime(detail.last_renewed_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="计划关机时间">
            {{ formatTime(detail.suspend_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="计划删机时间">
            {{ formatTime(detail.delete_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="IP 保留到期">
            {{ formatTime(detail.ip_recycle_at) }}
          </Descriptions.Item>
          <Descriptions.Item label="剩余更换IP次数">
            {{ empty(detail.ip_change_quota) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ formatTime(detail.updated_at) }}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          bordered
          :column="2"
          class="mt-4"
          size="small"
          title="代理链接"
        >
          <Descriptions.Item label="MTProxy 主机">
            {{ empty(detail.mtproxy_host) }}
          </Descriptions.Item>
          <Descriptions.Item label="MTProxy 端口">
            {{ empty(detail.mtproxy_port) }}
          </Descriptions.Item>
          <Descriptions.Item label="MTProxy 密钥" :span="2">
            <Typography.Paragraph
              :copyable="
                detail.mtproxy_secret ? { text: detail.mtproxy_secret } : false
              "
              class="!mb-0 break-all font-mono"
            >
              {{ empty(detail.mtproxy_secret) }}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="MTProxy 链接" :span="2">
            <Typography.Paragraph
              :copyable="
                detail.mtproxy_link ? { text: detail.mtproxy_link } : false
              "
              class="!mb-0 break-all font-mono"
            >
              {{ empty(detail.mtproxy_link) }}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>

        <Card
          v-if="detail.proxy_links?.length"
          class="mt-4"
          size="small"
          title="全部代理链路"
        >
          <div
            v-for="(item, index) in detail.proxy_links"
            :key="`${item.url}-${index}`"
            class="mb-3 last:mb-0"
          >
            <div class="mb-1 text-sm opacity-75">
              {{ item.name || `链路 ${index + 1}` }}
            </div>
            <Typography.Paragraph
              :copyable="{ text: item.url }"
              class="!mb-0 break-all font-mono"
            >
              {{ item.url }}
            </Typography.Paragraph>
          </div>
        </Card>

        <Descriptions
          bordered
          :column="2"
          class="mt-4"
          size="small"
          title="用户与订单"
        >
          <Descriptions.Item label="用户">
            {{ empty(detail.user_display_name) }}
          </Descriptions.Item>
          <Descriptions.Item label="用户名">
            {{ empty(detail.username_label) }}
          </Descriptions.Item>
          <Descriptions.Item label="Telegram ID">
            {{ empty(detail.tg_user_id) }}
          </Descriptions.Item>
          <Descriptions.Item label="后台用户 ID">
            {{ empty(detail.user_id) }}
          </Descriptions.Item>
          <Descriptions.Item label="订单号">
            {{ empty(detail.order_no) }}
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            {{ empty(detail.order_status_label || detail.order_status) }}
          </Descriptions.Item>
          <Descriptions.Item label="价格">
            {{ empty(detail.price) }}
            {{ empty(detail.currency) }}
          </Descriptions.Item>
          <Descriptions.Item label="资产状态">
            <Tag :color="statusColor(detail.status)">
              {{ empty(detail.status_label || detail.status) }}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" size="small" title="构建过程 / 创建说明">
          <Typography.Paragraph class="!mb-0 whitespace-pre-wrap break-all">
            {{ empty(detail.provision_note || detail.note) }}
          </Typography.Paragraph>
        </Card>

        <Card class="mt-4" size="small" title="IP / 生命周期日志">
          <Table
            :columns="logColumns"
            :data-source="detail.ip_logs || []"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'created_at'">
                {{
                  formatTime(
                    (record as DashboardCloudAssetIpLogItem).created_at,
                  )
                }}
              </template>
              <template v-else-if="column.key === 'note'">
                <Typography.Paragraph
                  class="!mb-0 whitespace-pre-wrap break-all"
                >
                  {{ empty((record as DashboardCloudAssetIpLogItem).note) }}
                </Typography.Paragraph>
              </template>
            </template>
          </Table>
        </Card>
      </template>

      <Empty v-else-if="!loading" description="未找到代理详情" />
    </Card>
  </Page>
</template>
