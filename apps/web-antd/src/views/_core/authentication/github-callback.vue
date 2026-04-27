<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Alert, Spin } from 'ant-design-vue';

import { useAuthStore } from '#/store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref('');

function redirectUri() {
  return `${window.location.origin}/auth/github/callback`;
}

onMounted(async () => {
  const code = String(route.query.code || '');
  const state = String(route.query.state || '');
  if (!code || !state) {
    errorMessage.value = 'GitHub 回调参数缺失，请重新登录';
    return;
  }
  try {
    await authStore.authGithubCallback({
      code,
      redirectUri: redirectUri(),
      state,
    });
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message || error?.message || 'GitHub 登录失败';
    window.setTimeout(() => {
      router.replace('/auth/login');
    }, 1800);
  }
});
</script>

<template>
  <div class="github-callback">
    <Alert v-if="errorMessage" show-icon type="error" :message="errorMessage" />
    <div v-else class="github-callback-loading">
      <Spin size="large" />
      <p class="mt-4 github-callback-desc">正在完成 GitHub 登录...</p>
    </div>
  </div>
</template>

<style scoped>
.github-callback {
  width: 100%;
}

.github-callback-loading {
  text-align: center;
}

.github-callback-desc {
  color: hsl(var(--muted-foreground));
}
</style>
