<script lang="ts" setup>
import type { WorkbenchQuickNavItem, WorkbenchTodoItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchQuickNav,
  WorkbenchTodo,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Tag,
} from 'ant-design-vue';

import { getDashboardOverviewApi } from '#/api/admin';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const overview = ref<Awaited<
  ReturnType<typeof getDashboardOverviewApi>
> | null>(null);

const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1677ff',
    icon: 'lucide:chart-column',
    title: '分析页',
    url: '/admin/analytics',
  },
  {
    color: '#13c2c2',
    icon: 'lucide:users',
    title: '用户列表',
    url: '/admin/users',
  },
  {
    color: '#14b8a6',
    icon: 'lucide:list-todo',
    title: '任务列表',
    url: '/admin/tasks',
  },
  {
    color: '#722ed1',
    icon: 'lucide:shopping-cart',
    title: '云订单',
    url: '/admin/cloud-orders',
  },
  {
    color: '#14b8a6',
    icon: 'lucide:package-search',
    title: '套餐设置',
    url: '/admin/cloud-plans/list',
  },
  {
    color: '#fa8c16',
    icon: 'lucide:wallet-cards',
    title: '充值列表',
    url: '/admin/logs/recharges',
  },
  {
    color: '#52c41a',
    icon: 'lucide:boxes',
    title: '代理列表',
    url: '/admin/cloud-assets',
  },
  {
    color: '#eb2f96',
    icon: 'lucide:settings-2',
    title: '系统设置',
    url: '/admin/settings',
  },
];

const summaryCards = computed(() => {
  const summary = overview.value?.summary;
  return [
    { label: '用户总量', value: summary?.users_total ?? 0 },
    { label: '云订单', value: summary?.cloud_orders_total ?? 0 },
    { label: '待处理云订单', value: summary?.cloud_pending ?? 0 },
    { label: '充值记录', value: summary?.recharges_total ?? 0 },
    { label: '待确认充值', value: summary?.recharge_pending ?? 0 },
    { label: '地址监控', value: summary?.monitors_total ?? 0 },
  ];
});

const todoItems = computed<WorkbenchTodoItem[]>(() => {
  const summary = overview.value?.summary;
  return [
    {
      completed: (summary?.cloud_pending ?? 0) === 0,
      content: `当前还有 ${summary?.cloud_pending ?? 0} 个云订单待处理，建议优先检查开通/续费异常。`,
      date: '实时',
      title: '云订单待办',
    },
    {
      completed: (summary?.recharge_pending ?? 0) === 0,
      content: `当前还有 ${summary?.recharge_pending ?? 0} 条充值待确认，注意核对链上到账。`,
      date: '实时',
      title: '充值待办',
    },
    {
      completed: (summary?.monitors_total ?? 0) > 0,
      content: `当前地址监控数 ${summary?.monitors_total ?? 0}，如资源巡检异常可去监控列表排查。`,
      date: '巡检',
      title: '监控配置',
    },
  ];
});

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await getDashboardOverviewApi();
  } finally {
    loading.value = false;
  }
}

function navTo(nav: WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch(() => {});
  }
}

function statusColor(status: string) {
  if (['completed', 'paid', 'success', 'active'].includes(status))
    return 'green';
  if (['pending', 'creating', 'provisioning', 'renew_pending'].includes(status))
    return 'orange';
  if (['failed', 'expired', 'cancelled', 'deleted'].includes(status))
    return 'red';
  return 'blue';
}

onMounted(loadOverview);
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{ userStore.userInfo?.realName || '管理员' }}，欢迎回到 Shop 工作台
      </template>
      <template #description>
        这里聚焦“操作入口 + 待办处理 + 最近变动”，分析类数据请进入分析页查看。
      </template>
      <template #extra>
        <Space>
          <Button @click="router.push('/admin/analytics')">查看分析页</Button>
          <Button type="primary" @click="loadOverview">刷新数据</Button>
        </Space>
      </template>
    </WorkbenchHeader>

    <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Card
        v-for="item in summaryCards"
        :key="item.label"
        :loading="loading"
        class="rounded-xl"
      >
        <Statistic :title="item.label" :value="item.value" />
      </Card>
    </div>

    <Row class="mt-5" :gutter="16">
      <Col :xl="16" :span="24">
        <Card title="最近云订单" :loading="loading">
          <List
            v-if="overview?.latest_cloud_orders?.length"
            :data-source="overview.latest_cloud_orders"
          >
            <template #renderItem="{ item }">
              <List.Item>
                <List.Item.Meta
                  :description="`${item.region_label || item.region_name || '-'} · ${item.plan_name || '-'}`"
                  :title="item.order_no || `#${item.id}`"
                />
                <div class="text-right">
                  <Tag :color="statusColor(item.status)">{{
                    item.status_label || item.status
                  }}</Tag>
                  <div class="mt-1 text-sm text-gray-500">
                    {{ item.total_amount }} USDT
                  </div>
                </div>
              </List.Item>
            </template>
          </List>
          <Empty v-else description="暂无云订单" />
        </Card>

        <Card class="mt-5" title="最近充值" :loading="loading">
          <List
            v-if="overview?.latest_recharges?.length"
            :data-source="overview.latest_recharges"
          >
            <template #renderItem="{ item }">
              <List.Item>
                <List.Item.Meta
                  :description="item.tx_hash || '暂无交易哈希'"
                  :title="`充值 #${item.id}`"
                />
                <div class="text-right">
                  <Tag :color="statusColor(item.status)">{{
                    item.status_label || item.status
                  }}</Tag>
                  <div class="mt-1 text-sm text-gray-500">
                    {{ item.amount }}
                  </div>
                </div>
              </List.Item>
            </template>
          </List>
          <Empty v-else description="暂无充值记录" />
        </Card>
      </Col>

      <Col :xl="8" :span="24">
        <WorkbenchQuickNav
          :items="quickNavItems"
          title="快捷操作"
          @click="navTo"
        />
        <WorkbenchTodo class="mt-5" :items="todoItems" title="当前待办" />
        <AnalysisChartCard class="mt-5" title="工作台定位">
          <div class="space-y-3 text-sm text-gray-500">
            <div>聚焦日常处理与入口跳转</div>
            <div>适合运营、客服、值班快速处理问题</div>
            <div>分析页专注展示概览与处理率</div>
          </div>
        </AnalysisChartCard>
      </Col>
    </Row>
  </div>
</template>
