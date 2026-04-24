import type { RouteRecordStringComponent } from '@vben/types';

import adminRoutes from '#/router/routes/modules/admin';

function toMenuRoutes(routes: any[]): RouteRecordStringComponent[] {
  return routes.map((route) => {
    const menuRoute: RouteRecordStringComponent = {
      ...route,
      component: route.children?.length ? 'BasicLayout' : resolveViewComponent(route.component),
    };

    if (route.children?.length) {
      menuRoute.children = toMenuRoutes(route.children);
    }

    return menuRoute;
  });
}

function resolveViewComponent(component: unknown): string {
  const text = String(component ?? '');
  const matched = text.match(/views\/(.+?)\.vue/);
  if (matched?.[1]) {
    return `/views/${matched[1]}.vue`;
  }
  return '/views/_core/fallback/not-found.vue';
}

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  return toMenuRoutes(adminRoutes as any[]);
}
