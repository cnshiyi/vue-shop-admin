import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/admin',
    redirect: '/admin/analytics',
    children: [
      {
        name: 'DashboardAnalytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:chart-column',
          title: '分析页',
        },
      },
      {
        name: 'DashboardWorkspace',
        path: 'workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          title: '工作台',
        },
      },
      {
        name: 'DashboardUsers',
        path: 'users',
        component: () => import('#/views/dashboard/users/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '用户列表',
        },
      },
      {
        name: 'DashboardUserBalanceDetails',
        path: 'users/:id/balance-details',
        component: () => import('#/views/dashboard/users/balance-details.vue'),
        meta: {
          hideInMenu: true,
          title: '余额明细',
        },
      },
      {
        name: 'DashboardTasks',
        path: 'tasks',
        component: () => import('#/views/dashboard/tasks/index.vue'),
        meta: {
          icon: 'lucide:list-todo',
          title: '任务列表',
        },
      },
      {
        name: 'DashboardProducts',
        path: 'products',
        component: () => import('#/views/dashboard/products/index.vue'),
        meta: {
          icon: 'lucide:package',
          title: '商品管理',
        },
      },
      {
        name: 'DashboardCloudAssets',
        path: 'cloud-assets',
        component: () => import('#/views/dashboard/cloud-assets/index.vue'),
        meta: {
          icon: 'lucide:boxes',
          title: '代理列表',
        },
      },
      {
        name: 'DashboardCloudPlans',
        path: 'cloud-plans',
        component: () => import('#/views/dashboard/cloud-plans/index.vue'),
        meta: {
          icon: 'lucide:package-search',
          title: '套餐设置',
        },
      },
      {
        name: 'DashboardSettings',
        path: 'settings',
        component: () => import('#/views/dashboard/settings/index.vue'),
        meta: {
          icon: 'lucide:settings-2',
          title: '系统设置',
        },
      },
      {
        name: 'DashboardServerStatistics',
        path: 'server-statistics',
        component: () => import('#/views/dashboard/server-statistics/index.vue'),
        meta: {
          icon: 'lucide:chart-column-increasing',
          title: '服务器统计',
        },
      },
      {
        name: 'DashboardCloudOrderDetail',
        path: 'cloud-orders/:id',
        component: () => import('#/views/dashboard/cloud-orders/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '云订单详情',
        },
      },
      {
        name: 'DashboardCloudOrders',
        path: 'cloud-orders',
        component: () => import('#/views/dashboard/cloud-orders/index.vue'),
        meta: {
          icon: 'lucide:shopping-cart',
          title: '云订单',
        },
      },
      {
        name: 'DashboardRechargeDetail',
        path: 'recharges/:id',
        component: () => import('#/views/dashboard/recharges/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '充值详情',
        },
      },
      {
        name: 'DashboardRecharges',
        path: 'recharges',
        component: () => import('#/views/dashboard/recharges/index.vue'),
        meta: {
          icon: 'lucide:wallet',
          title: '充值列表',
        },
      },
      {
        name: 'DashboardMonitors',
        path: 'monitors',
        component: () => import('#/views/dashboard/monitors/index.vue'),
        meta: {
          icon: 'lucide:monitor-smartphone',
          title: '监控列表',
        },
      },
    ],
  },
];

export default routes;
