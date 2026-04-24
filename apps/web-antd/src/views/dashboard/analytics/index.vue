<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { Button, Card, Col, Empty, List, Progress, Row, Space, Statistic, Tag } from 'ant-design-vue';

import { getDashboardOverviewApi } from '#/api/admin';

const router = useRouter();
const loading = ref(false);
const overview = ref<Awaited<ReturnType<typeof getDashboardOverviewApi>> | null>(null);

const overviewItems = computed<AnalysisOverviewItem[]>(() => {
  const summary = overview.value?.summary;
  return [
    {
      icon: SvgCardIcon,
      title: '用户总量',
      totalTitle: 'Telegram 用户',
      totalValue: summary?.users_total ?? 0,
      value: summary?.users_total ?? 0,
    },
    {
      icon: SvgCakeIcon,
      title: '商品总量',
      totalTitle: '已配置商品',
      totalValue: summary?.products_total ?? 0,
      value: summary?.products_total ?? 0,
    },
    {
      icon: SvgDownloadIcon,
      title: '云订单总量',
      totalTitle: '云服务器订单',
      totalValue: summary?.cloud_orders_total ?? 0,
      value: summary?.cloud_pending ?? 0,
    },
    {
      icon: SvgBellIcon,
      title: '充值总量',
      totalTitle: '充值记录',
      totalValue: summary?.recharges_total ?? 0,
      value: summary?.recharge_pending ?? 0,
    },
  ];
});

const chartTabs: TabOption[] = [
  { label: '业务总览', value: 'business' },
  { label: '最近动态', value: 'activity' },
];

const progressItems = computed(() => {
  const summary = overview.value?.summary;
  const cloudTotal = Math.max(summary?.cloud_orders_total ?? 0, 1);
  const rechargeTotal = Math.max(summary?.recharges_total ?? 0, 1);
  return [
    {
      label: '云订单处理率',
      percent: Math.round(((cloudTotal - (summary?.cloud_pending ?? 0)) / cloudTotal) * 100),
      strokeColor: '#1677ff',
    },
    {
      label: '充值确认率',
      percent: Math.round(((rechargeTotal - (summary?.recharge_pending ?? 0)) / rechargeTotal) * 100),
      strokeColor: '#52c41a',
    },
    {
      label: '商品配置完成度',
      percent: summary?.products_total ? 100 : 0,
      strokeColor: '#722ed1',
    },
  ];
});

function statusColor(status: string) {
  if (['completed', 'paid', 'success', 'active'].includes(status)) return 'green';
  if (['pending', 'creating', 'provisioning', 'renew_pending'].includes(status)) return 'orange';
  if (['failed', 'expired', 'cancelled', 'deleted'].includes(status)) return 'red';
  return 'blue';
}

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await getDashboardOverviewApi();
  } finally {
    loading.value = false;
  }
}

onMounted(loadOverview);
</script>

<template>
  <div class="p-5">
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="text-2xl font-semibold">分析页</div>
        <div class="mt-1 text-sm text-gray-500">聚焦业务概览、处理率与最近动态，和工作台形成分工。</div>
      </div>
      <Space>
        <Button @click="router.push('/admin/workspace')">返回工作台</Button>
        <Button type="primary" @click="loadOverview">刷新分析</Button>
      </Space>
    </div>

    <AnalysisOverview :items="overviewItems" />

    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #business>
        <Row :gutter="16">
          <Col :lg="8" :span="24">
            <Card :loading="loading" title="核心总览">
              <div class="space-y-4">
                <Statistic title="普通订单" :value="overview?.summary?.orders_total ?? 0" />
                <Statistic title="地址监控" :value="overview?.summary?.monitors_total ?? 0" />
                <Statistic title="待处理云订单" :value="overview?.summary?.cloud_pending ?? 0" />
                <Statistic title="待确认充值" :value="overview?.summary?.recharge_pending ?? 0" />
              </div>
            </Card>
          </Col>
          <Col :lg="16" :span="24">
            <Card :loading="loading" title="处理进度">
              <div class="space-y-5">
                <div v-for="item in progressItems" :key="item.label">
                  <div class="mb-2 flex items-center justify-between text-sm text-gray-500">
                    <span>{{ item.label }}</span>
                    <span>{{ item.percent }}%</span>
                  </div>
                  <Progress :percent="item.percent" :show-info="false" :stroke-color="item.strokeColor" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </template>

      <template #activity>
        <Row :gutter="16">
          <Col :lg="12" :span="24">
            <Card :loading="loading" title="最近云订单动态">
              <List v-if="overview?.latest_cloud_orders?.length" :data-source="overview.latest_cloud_orders">
                <template #renderItem="{ item }">
                  <List.Item>
                    <List.Item.Meta :description="`${item.region_label || item.region_name || '-'} · ${item.plan_name || '-'}`" :title="item.order_no || `#${item.id}`" />
                    <Tag :color="statusColor(item.status)">{{ item.status_label || item.status }}</Tag>
                  </List.Item>
                </template>
              </List>
              <Empty v-else description="暂无云订单动态" />
            </Card>
          </Col>
          <Col :lg="12" :span="24">
            <Card :loading="loading" title="最近充值动态">
              <List v-if="overview?.latest_recharges?.length" :data-source="overview.latest_recharges">
                <template #renderItem="{ item }">
                  <List.Item>
                    <List.Item.Meta :description="item.tx_hash || '暂无交易哈希'" :title="`充值 #${item.id} · ${item.amount}`" />
                    <Tag :color="statusColor(item.status)">{{ item.status_label || item.status }}</Tag>
                  </List.Item>
                </template>
              </List>
              <Empty v-else description="暂无充值动态" />
            </Card>
          </Col>
        </Row>
      </template>
    </AnalysisChartsTabs>

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard class="mt-5 md:mt-0 md:mr-4 md:w-1/3" title="数据来源">
        <div class="space-y-3 text-sm text-gray-500">
          <div>Django API</div>
          <div>`/api/admin/dashboard/overview/`</div>
          <div>实时读取数据库聚合结果</div>
        </div>
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:mr-4 md:w-1/3" title="分析页定位">
        <div class="space-y-3 text-sm text-gray-500">
          <div>看整体</div>
          <div>看处理率</div>
          <div>看最近动态</div>
        </div>
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="推荐动作">
        <div class="space-y-3 text-sm text-gray-500">
          <div>待办处理去工作台</div>
          <div>订单异常去云订单</div>
          <div>配置缺口去系统设置/商品管理</div>
        </div>
      </AnalysisChartCard>
    </div>
  </div>
</template>
