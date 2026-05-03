<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  DashboardTelegramGroupFilterItem,
  DashboardTelegramGroupFilterPayload,
} from '#/api/admin';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createDashboardTelegramGroupApi,
  getDashboardTelegramGroupsApi,
  updateDashboardTelegramGroupApi,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const keyword = ref('');
const current = ref<DashboardTelegramGroupFilterItem | null>(null);
const groups = ref<DashboardTelegramGroupFilterItem[]>([]);

const form = reactive<DashboardTelegramGroupFilterPayload>({
  chat_id: '',
  enabled: false,
  title: '',
  username: '',
});

const columns: TableColumnsType<DashboardTelegramGroupFilterItem> = [
  { title: '群组', key: 'group' },
  { title: '转发给管理员', key: 'enabled', width: 160 },
  { title: '更新时间', key: 'updated_at', width: 190 },
  { title: '操作', key: 'action', width: 100 },
];

function resetForm() {
  current.value = null;
  form.chat_id = '';
  form.enabled = false;
  form.title = '';
  form.username = '';
}

function formatTime(value?: null | string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

async function loadData() {
  loading.value = true;
  try {
    groups.value = await getDashboardTelegramGroupsApi({
      keyword: keyword.value || undefined,
    });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(item: DashboardTelegramGroupFilterItem) {
  current.value = item;
  form.chat_id = item.chat_id;
  form.enabled = item.enabled;
  form.title = item.title;
  form.username = item.username;
  modalOpen.value = true;
}

async function submitForm() {
  if (!form.chat_id || !form.title) {
    message.warning('请填写群组 Chat ID 和群组名称');
    return;
  }
  saving.value = true;
  try {
    if (current.value) {
      await updateDashboardTelegramGroupApi(current.value.id, form);
      message.success('群组已更新');
    } else {
      await createDashboardTelegramGroupApi(form);
      message.success('群组已保存');
    }
    modalOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(
  item: DashboardTelegramGroupFilterItem,
  enabled: boolean,
) {
  const previous = item.enabled;
  item.enabled = enabled;
  try {
    const updated = await updateDashboardTelegramGroupApi(item.id, { enabled });
    Object.assign(item, updated);
    message.success(enabled ? '已开启群组转发' : '已关闭群组转发');
  } catch (error: any) {
    item.enabled = previous;
    message.error(error?.message || '操作失败');
  }
}

onMounted(() => loadData());
</script>

<template>
  <Page
    description="控制哪些 Telegram 群组消息允许转发给管理员"
    title="群组通知"
  >
    <Card :loading="loading" title="群组通知开关">
      <template #extra>
        <Space>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索群组名 / 用户名 / Chat ID"
            @search="loadData"
          />
          <Button @click="loadData">刷新</Button>
          <Button type="primary" @click="openCreate">保存群组</Button>
        </Space>
      </template>

      <Table
        :columns="columns"
        :data-source="groups"
        :pagination="false"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'group'">
            <div class="group-title">
              {{
                (record as DashboardTelegramGroupFilterItem).title ||
                (record as DashboardTelegramGroupFilterItem).chat_id
              }}
            </div>
            <div class="group-meta">
              <Tag
                v-if="(record as DashboardTelegramGroupFilterItem).username"
                color="blue"
              >
                @{{ (record as DashboardTelegramGroupFilterItem).username }}
              </Tag>
              <span>
                ID {{ (record as DashboardTelegramGroupFilterItem).chat_id }}
              </span>
            </div>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <Switch
              :checked="(record as DashboardTelegramGroupFilterItem).enabled"
              checked-children="开启"
              un-checked-children="关闭"
              @change="
                (checked) =>
                  toggleEnabled(
                    record as DashboardTelegramGroupFilterItem,
                    Boolean(checked),
                  )
              "
            />
          </template>
          <template v-else-if="column.key === 'updated_at'">
            {{
              formatTime(
                (record as DashboardTelegramGroupFilterItem).updated_at,
              )
            }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              @click="openEdit(record as DashboardTelegramGroupFilterItem)"
            >
              编辑
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="current ? '编辑群组' : '保存群组'"
      @ok="submitForm"
    >
      <Form layout="vertical">
        <Form.Item label="群组 Chat ID" required>
          <Input
            v-model:value="form.chat_id"
            :disabled="!!current"
            placeholder="例如 -1001234567890"
          />
        </Form.Item>
        <Form.Item label="群组名称" required>
          <Input v-model:value="form.title" placeholder="请输入群组名称" />
        </Form.Item>
        <Form.Item label="群组用户名">
          <Input
            v-model:value="form.username"
            placeholder="可选，例如 groupname"
          />
        </Form.Item>
        <Form.Item label="转发给管理员">
          <Switch
            v-model:checked="form.enabled"
            checked-children="开启"
            un-checked-children="关闭"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.group-title {
  font-weight: 600;
}

.group-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
  color: hsl(var(--muted-foreground));
}
</style>
