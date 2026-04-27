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

import { Button, Card, Col, Row, Space } from 'ant-design-vue';

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
    icon: 'lucide:message-circle',
    title: '账号管理',
    url: '/admin/telegram-accounts',
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
    title: '充值订单',
    url: '/admin/cloud-orders/recharges',
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

const shortcutCards = computed(() => {
  const summary = overview.value?.summary;
  return [
    {
      action: '处理云订单',
      description: `待处理 ${summary?.cloud_pending ?? 0} 个`,
      path: '/admin/cloud-orders/list',
      title: '云订单',
    },
    {
      action: '核对充值',
      description: `待确认 ${summary?.recharge_pending ?? 0} 条`,
      path: '/admin/cloud-orders/recharges',
      title: '充值订单',
    },
    {
      action: '查看待续费',
      description: `7 天内待续费 ${summary?.renew_due ?? 0} 台`,
      path: '/admin/cloud-assets',
      title: '代理列表',
    },
    {
      action: '搜索聊天',
      description: '用户资料与聊天记录',
      path: '/admin/telegram-accounts',
      title: '账号管理',
    },
    {
      action: '调整套餐',
      description: '价格、文案、排序',
      path: '/admin/cloud-plans/list',
      title: '套餐设置',
    },
    {
      action: '系统配置',
      description: '文案、按钮、云账号',
      path: '/admin/settings',
      title: '后台设置',
    },
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

    <Row class="mt-5" :gutter="16">
      <Col :xl="16" :span="24">
        <Card title="快捷处理入口" :loading="loading">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card
              v-for="item in shortcutCards"
              :key="item.title"
              class="rounded-xl"
              size="small"
            >
              <div class="text-base font-semibold">{{ item.title }}</div>
              <div class="mt-2 min-h-5 text-sm text-gray-500">
                {{ item.description }}
              </div>
              <Button
                class="mt-4"
                type="primary"
                block
                @click="router.push(item.path)"
              >
                {{ item.action }}
              </Button>
            </Card>
          </div>
        </Card>

        <Card class="mt-5" title="值班提示">
          <div
            class="grid grid-cols-1 gap-3 text-sm text-gray-500 md:grid-cols-3"
          >
            <div>先处理待支付/创建失败/续费异常。</div>
            <div>充值只做核对入口，不在工作台堆运营报表。</div>
            <div>趋势、利润、转化统一去分析页看。</div>
          </div>
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
