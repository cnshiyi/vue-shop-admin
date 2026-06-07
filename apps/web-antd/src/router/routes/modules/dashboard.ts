import type { RouteRecordRaw } from 'vue-router';

import { ChartArea, LayoutDashboard } from '@vben/icons';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: LayoutDashboard,
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        redirect: '/admin/analytics',
        meta: {
          affixTab: true,
          icon: ChartArea,
          title: $t('page.dashboard.analytics'),
        },
      },
    ],
  },
];

export default routes;
