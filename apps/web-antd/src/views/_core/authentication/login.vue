<script lang="ts" setup>
import { ref } from 'vue';

import { Alert, Button, Card } from 'ant-design-vue';

import { githubLoginStartApi } from '#/api';

const loading = ref(false);
const errorMessage = ref('');

function githubRedirectUri() {
  return `${window.location.origin}/auth/github/callback`;
}

async function handleGithubLogin() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { authorizeUrl } = await githubLoginStartApi(githubRedirectUri());
    window.location.href = authorizeUrl;
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      'GitHub 登录初始化失败，请检查 OAuth 配置';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card class="github-login-card" :bordered="false">
    <div class="github-login-content">
      <h2 class="github-login-title">后台登录</h2>
      <p class="github-login-desc">
        使用已授权的 GitHub 账号进入后台，账号密码登录已关闭。
      </p>

      <Alert
        v-if="errorMessage"
        class="mb-4"
        show-icon
        type="error"
        :message="errorMessage"
      />

      <Button
        block
        size="large"
        type="primary"
        :loading="loading"
        @click="handleGithubLogin"
      >
        GitHub 登录
      </Button>
    </div>
  </Card>
</template>

<style scoped>
.github-login-card {
  width: 100%;
}

.github-login-content {
  text-align: center;
}

.github-login-title {
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.github-login-desc {
  margin-bottom: 24px;
  color: hsl(var(--muted-foreground));
}
</style>
