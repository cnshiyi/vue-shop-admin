import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

function userInfoFlag(value: unknown) {
  if (value === true) return true;
  if (typeof value === 'string') {
    return ['1', 'on', 'true', 'yes'].includes(value.toLowerCase());
  }
  return false;
}

export function useDashboardPermissions() {
  const userStore = useUserStore();

  const canRunCloudDanger = computed(() => {
    const info = (userStore.userInfo || {}) as Record<string, any>;
    const roles = new Set(userStore.userRoles || []);
    const permissions = new Set(
      Array.isArray(info.permissions) ? info.permissions : [],
    );
    return (
      roles.has('superuser') ||
      userInfoFlag(info.is_superuser) ||
      permissions.has('superuser') ||
      permissions.has('cloud:danger')
    );
  });

  function requireCloudDangerPermission(action = '该操作') {
    if (canRunCloudDanger.value) {
      return true;
    }
    message.warning(`${action}需要超级管理员权限`);
    return false;
  }

  return {
    canRunCloudDanger,
    requireCloudDangerPermission,
  };
}
