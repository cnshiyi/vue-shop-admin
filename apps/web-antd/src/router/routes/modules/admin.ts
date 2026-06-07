import type { RouteRecordRaw } from 'vue-router';

import {
  BellRing,
  Boxes,
  CalendarClock,
  ChartColumn,
  ChartColumnIncreasing,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  Logs,
  MessageCircle,
  MonitorSmartphone,
  PackageSearch,
  RotateCwSquare,
  Server,
  Settings2,
  ShoppingCart,
  Users,
} from '@vben/icons';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: LayoutDashboard,
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/admin',
    redirect: '/admin/cloud-assets',
    children: [
      {
        name: 'DashboardAnalytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: ChartColumn,
          title: '分析页',
        },
      },
      {
        name: 'DashboardUsers',
        path: 'users',
        component: () => import('#/views/dashboard/users/index.vue'),
        meta: {
          icon: Users,
          title: '用户列表',
        },
      },
      {
        name: 'DashboardTelegramAccounts',
        path: 'telegram-accounts',
        redirect: '/admin/telegram-accounts/accounts',
        meta: {
          icon: MessageCircle,
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
          icon: Boxes,
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
        name: 'DashboardCloudSyncJobDetail',
        path: 'cloud-sync-jobs/:id',
        component: () => import('#/views/dashboard/cloud-sync-jobs/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '同步任务详情',
        },
      },
      {
        name: 'DashboardServers',
        path: 'servers',
        component: () => import('#/views/dashboard/servers/index.vue'),
        meta: {
          icon: Server,
          title: '服务器表',
        },
      },
      {
        name: 'DashboardLifecyclePlans',
        path: 'tasks/plans',
        component: () => import('#/views/dashboard/tasks/plans.vue'),
        meta: {
          icon: CalendarClock,
          title: '计划',
        },
      },
      {
        name: 'DashboardNoticePlans',
        path: 'tasks/notices',
        component: () => import('#/views/dashboard/tasks/notices.vue'),
        meta: {
          icon: BellRing,
          title: '通知计划',
        },
      },
      {
        name: 'DashboardAutoRenewTaskDetail',
        path: 'tasks/auto-renew',
        component: () =>
          import('#/views/dashboard/tasks/auto-renew-detail.vue'),
        meta: {
          icon: RotateCwSquare,
          title: '续费列表',
        },
      },
      {
        name: 'DashboardCloudAccounts',
        path: 'cloud-accounts',
        component: () =>
          import('#/views/dashboard/settings/cloud-accounts.vue'),
        meta: {
          icon: KeyRound,
          title: '云账号设置',
        },
      },
      {
        name: 'DashboardTasks',
        path: 'tasks',
        component: () => import('#/views/dashboard/tasks/index.vue'),
        meta: {
          icon: ListTodo,
          title: '任务列表',
        },
      },
      {
        name: 'DashboardCloudPlans',
        path: 'cloud-plans',
        redirect: '/admin/cloud-plans/list',
        meta: {
          icon: PackageSearch,
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
          icon: Settings2,
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
            name: 'DashboardSettingsPayment',
            path: 'payment',
            component: () => import('#/views/dashboard/settings/payment.vue'),
            meta: { title: '收款设置' },
          },
          {
            name: 'DashboardSettingsLogs',
            path: 'logs',
            component: () => import('#/views/dashboard/settings/logs.vue'),
            meta: { title: '日志设置' },
          },
          {
            name: 'DashboardSettingsNotifications',
            path: 'notifications',
            component: () =>
              import('#/views/dashboard/settings/notifications.vue'),
            meta: { title: '通知设置' },
          },
          {
            name: 'DashboardSettingsLifecycle',
            path: 'lifecycle',
            component: () => import('#/views/dashboard/settings/lifecycle.vue'),
            meta: { title: '生命周期设置' },
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
            meta: { hideInMenu: true, title: '云账号设置' },
          },
        ],
      },
      {
        name: 'DashboardServerStatistics',
        path: 'server-statistics',
        component: () =>
          import('#/views/dashboard/server-statistics/index.vue'),
        meta: {
          icon: ChartColumnIncreasing,
          title: '服务器统计',
        },
      },
      {
        name: 'DashboardCloudOrders',
        path: 'cloud-orders',
        redirect: '/admin/cloud-orders/list',
        meta: {
          icon: ShoppingCart,
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
            name: 'DashboardCloudOrderRenewals',
            path: 'renewals',
            component: () =>
              import('#/views/dashboard/tasks/auto-renew-detail.vue'),
            meta: {
              hideInMenu: true,
              title: '续费列表',
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
          icon: Logs,
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
            name: 'DashboardIpDeleteLogs',
            path: 'ip-deletes',
            component: () =>
              import('#/views/dashboard/ip-delete-logs/index.vue'),
            meta: {
              title: 'IP删除表',
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
          icon: MonitorSmartphone,
          title: '监控列表',
        },
      },
    ],
  },
];

export default routes;
