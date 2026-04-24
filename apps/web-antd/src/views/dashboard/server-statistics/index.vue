<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Space, Table } from 'ant-design-vue';

import {
  getDashboardServersStatisticsApi,
  type DashboardServerStatisticsItem,
  type DashboardServerStatisticsRegion,
} from '#/api/admin';

const loading = ref(false);
const keyword = ref('');
const items = ref<DashboardServerStatisticsItem[]>([]);
const regions = ref<DashboardServerStatisticsRegion[]>([]);
const summary = ref<DashboardServerStatisticsItem | null>(null);

const columns = computed(() => {
  const regionColumns = regions.value.map((region) => ({
    title: region.region_label,
    dataIndex: region.region_code || region.region_label,
    key: region.region_code || region.region_label,
    width: 120,
    align: 'center' as const,
  }));

  return [
    { title: '账号', dataIndex: 'account_label', key: 'account_label', width: 220, fixed: 'left' as const },
    ...regionColumns,
    { title: '合计', dataIndex: 'total_count', key: 'total_count', width: 120, align: 'center' as const },
  ];
});

const tableData = computed(() => {
  if (!summary.value) {
    return items.value;
  }
  return [...items.value, summary.value];
});

async function loadData() {
  loading.value = true;
  try {
    const response = await getDashboardServersStatisticsApi({ keyword: keyword.value.trim() });
    items.value = response.items;
    regions.value = response.regions;
    summary.value = response.summary;
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  keyword.value = '';
  loadData();
}

function rowClassName(record: DashboardServerStatisticsItem) {
  return record.account_label === '合计' ? 'statistics-summary-row' : '';
}

onMounted(loadData);
</script>

<template>
  <Page description="账号在前、地区在后，底部显示汇总" title="数量统计">
    <Card>
      <template #title>
        <Space>
          <span>服务器数量统计</span>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索地区、账号、厂商"
            style="width: 320px"
            @search="loadData"
          />
          <Button size="small" @click="resetSearch">重置</Button>
          <Button size="small" @click="loadData">刷新</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :row-class-name="rowClassName"
        row-key="account_label"
        :scroll="{ x: Math.max(780, 240 + regions.length * 120) }"
        size="small"
      />
    </Card>
  </Page>
</template>

<style scoped>
:deep(.statistics-summary-row > td) {
  font-weight: 700;
  color: hsl(var(--foreground));
  background: hsl(var(--accent));
}

:deep(.statistics-summary-row:hover > td) {
  background: hsl(var(--accent));
}
</style>
