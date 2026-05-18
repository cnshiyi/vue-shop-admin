<script lang="ts" setup>
import SiteConfigGroup from './components/site-config-group.vue';
</script>

<template>
  <SiteConfigGroup
    group-key="system"
    title="系统设置"
    description="后台密码、Google 验证器与系统基础开关。"
    :show-password-card="true"
  />
</template>
