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
    redirect: '/admin/workspace',
    children: [
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
        name: 'DashboardAnalytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:chart-column',
          title: '分析页',
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
        name: 'DashboardTelegramAccounts',
        path: 'telegram-accounts',
        redirect: '/admin/telegram-accounts/accounts',
        meta: {
          icon: 'lucide:message-circle',
          title: '账号管理',
        },
        children: [
          {
            name: 'DashboardTelegramAccountList',
            path: 'accounts',
            component: () =>
              import('#/views/dashboard/telegram-accounts/accounts.vue'),
            meta: {
              title: '账号列表',
            },
          },
          {
            name: 'DashboardTelegramChatRecords',
            path: 'chats',
            component: () =>
              import('#/views/dashboard/telegram-accounts/chats.vue'),
            meta: {
              title: '聊天记录',
            },
          },
          {
            name: 'DashboardTelegramGroups',
            path: 'groups',
            component: () =>
              import('#/views/dashboard/telegram-accounts/groups.vue'),
            meta: {
              title: '群组通知',
            },
          },
        ],
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
        name: 'DashboardCloudAssets',
        path: 'cloud-assets',
        component: () => import('#/views/dashboard/cloud-assets/index.vue'),
        meta: {
          icon: 'lucide:boxes',
          title: '代理列表',
        },
      },
      {
        name: 'DashboardCloudAssetDetail',
        path: 'cloud-assets/:id',
        component: () => import('#/views/dashboard/cloud-assets/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '代理详情',
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
        name: 'DashboardAutoRenewTaskDetail',
        path: 'tasks/auto-renew',
        component: () =>
          import('#/views/dashboard/tasks/auto-renew-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '自动续费任务详情',
        },
      },
      {
        name: 'DashboardCloudPlans',
        path: 'cloud-plans',
        redirect: '/admin/cloud-plans/list',
        meta: {
          icon: 'lucide:package-search',
          title: '套餐设置',
        },
        children: [
          {
            name: 'DashboardCloudPlansList',
            path: 'list',
            component: () => import('#/views/dashboard/cloud-plans/index.vue'),
            meta: {
              title: '套餐列表',
            },
          },
          {
            name: 'DashboardCloudPricing',
            path: 'pricing',
            component: () =>
              import('#/views/dashboard/cloud-pricing/index.vue'),
            meta: {
              title: '配置同步',
            },
          },
        ],
      },
      {
        name: 'DashboardSettings',
        path: 'settings',
        redirect: '/admin/settings/system',
        meta: {
          icon: 'lucide:settings-2',
          title: '设置',
        },
        children: [
          {
            name: 'DashboardSettingsSystem',
            path: 'system',
            component: () => import('#/views/dashboard/settings/system.vue'),
            meta: { title: '系统设置' },
          },
          {
            name: 'DashboardSettingsDatabase',
            path: 'database',
            component: () => import('#/views/dashboard/settings/database.vue'),
            meta: { title: '数据库设置' },
          },
          {
            name: 'DashboardSettingsTexts',
            path: 'texts',
            component: () => import('#/views/dashboard/settings/texts.vue'),
            meta: { title: '文案设置' },
          },
          {
            name: 'DashboardSettingsButtons',
            path: 'buttons',
            component: () => import('#/views/dashboard/settings/buttons.vue'),
            meta: { title: '按钮设置' },
          },
          {
            name: 'DashboardSettingsCloudAccounts',
            path: 'cloud-accounts',
            component: () =>
              import('#/views/dashboard/settings/cloud-accounts.vue'),
            meta: { title: '云账号设置' },
          },
        ],
      },
      {
        name: 'DashboardServerStatistics',
        path: 'server-statistics',
        component: () =>
          import('#/views/dashboard/server-statistics/index.vue'),
        meta: {
          icon: 'lucide:chart-column-increasing',
          title: '服务器统计',
        },
      },
      {
        name: 'DashboardCloudOrders',
        path: 'cloud-orders',
        redirect: '/admin/cloud-orders/list',
        meta: {
          icon: 'lucide:shopping-cart',
          title: '云订单',
        },
        children: [
          {
            name: 'DashboardCloudOrdersList',
            path: 'list',
            component: () => import('#/views/dashboard/cloud-orders/index.vue'),
            meta: {
              title: '订单列表',
            },
          },
          {
            name: 'DashboardRecharges',
            path: 'recharges',
            component: () => import('#/views/dashboard/recharges/index.vue'),
            meta: {
              title: '充值订单',
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
            name: 'DashboardCloudOrderDetail',
            path: ':id',
            component: () =>
              import('#/views/dashboard/cloud-orders/detail.vue'),
            meta: {
              hideInMenu: true,
              title: '云订单详情',
            },
          },
        ],
      },
      {
        name: 'DashboardLogs',
        path: 'logs',
        redirect: '/admin/logs/servers',
        meta: {
          icon: 'lucide:logs',
          title: '日志',
        },
        children: [
          {
            name: 'DashboardServerLogs',
            path: 'servers',
            component: () => import('#/views/dashboard/server-logs/index.vue'),
            meta: {
              title: '服务器日志',
            },
          },
          {
            name: 'DashboardShutdownLogs',
            path: 'shutdowns',
            component: () =>
              import('#/views/dashboard/shutdown-logs/index.vue'),
            meta: {
              title: '关机日志',
            },
          },
          {
            name: 'DashboardOperationLogs',
            path: 'operations',
            component: () =>
              import('#/views/dashboard/operation-logs/index.vue'),
            meta: {
              title: '操作日志',
            },
          },
        ],
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
