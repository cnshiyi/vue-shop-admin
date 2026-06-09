<script lang="ts" setup>
import type {
  DashboardTelegramChatUserItem,
  DashboardTelegramMessageItem,
} from '#/api/admin';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Avatar,
  Button,
  Empty,
  Input,
  message,
  Switch,
  Tag,
} from 'ant-design-vue';

import {
  getDashboardTelegramAccountsApi,
  getDashboardTelegramMessagesApi,
  sendDashboardTelegramMessageApi,
} from '#/api/admin';
import { useDashboardPermissions } from '#/utils/dashboard-permissions';

const loading = ref(false);
const sending = ref(false);
const keyword = ref('');
const draftMessage = ref('');
const showEmptyUsers = ref(false);
const users = ref<DashboardTelegramChatUserItem[]>([]);
const messages = ref<DashboardTelegramMessageItem[]>([]);
const selectedUser = ref<DashboardTelegramChatUserItem | null>(null);
const messageScrollRef = ref<HTMLElement | null>(null);
const { canRunCloudDanger, requireCloudDangerPermission } =
  useDashboardPermissions();

const orderedMessages = computed(() => [...messages.value].toReversed());
const usersWithMessagesCount = computed(
  () => users.value.filter((item) => item.message_count > 0).length,
);
const usersWithoutMessagesCount = computed(
  () => users.value.filter((item) => item.message_count <= 0).length,
);
const totalMessagesCount = computed(() =>
  users.value.reduce((sum, item) => sum + (item.message_count || 0), 0),
);

const visibleUsers = computed(() => {
  const items = [...users.value].toSorted((a, b) => {
    const aHasMessages = a.message_count > 0 ? 1 : 0;
    const bHasMessages = b.message_count > 0 ? 1 : 0;
    if (aHasMessages !== bHasMessages) return bHasMessages - aHasMessages;
    return String(b.latest_at || '').localeCompare(String(a.latest_at || ''));
  });
  if (showEmptyUsers.value) return items;
  return items.filter((item) => item.message_count > 0);
});

const timelineGroups = computed(() => {
  const groups: Array<{
    items: DashboardTelegramMessageItem[];
    key: string;
    label: string;
  }> = [];
  for (const item of orderedMessages.value) {
    const key = (item.created_at || '').slice(0, 10) || 'unknown';
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: formatGroupDate(item.created_at),
        items: [],
      };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
});

async function scrollMessagesToBottom() {
  await nextTick();
  const el = messageScrollRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

async function loadData(options: { keepSelected?: boolean } = {}) {
  loading.value = true;
  const currentTgUserId = selectedUser.value?.tg_user_id;
  try {
    const overview = await getDashboardTelegramAccountsApi({
      keyword: keyword.value || undefined,
      scope: 'users',
    });
    users.value = overview.users || [];
    if (options.keepSelected && currentTgUserId) {
      selectedUser.value =
        users.value.find((item) => item.tg_user_id === currentTgUserId) ||
        selectedUser.value;
    } else {
      selectedUser.value = null;
      messages.value = [];
    }
  } finally {
    loading.value = false;
  }
}

async function selectUser(user: DashboardTelegramChatUserItem) {
  selectedUser.value = user;
  loading.value = true;
  try {
    messages.value = await getDashboardTelegramMessagesApi({
      tg_user_id: user.tg_user_id,
    });
    await scrollMessagesToBottom();
  } finally {
    loading.value = false;
  }
}

async function sendMessage() {
  if (!requireCloudDangerPermission('发送 Telegram 消息')) return;
  const text = draftMessage.value.trim();
  if (!selectedUser.value || !text) return;
  const user = selectedUser.value;
  if (!user.latest_chat_id) {
    message.error('该用户暂无可回复会话');
    return;
  }
  sending.value = true;
  try {
    const sent = await sendDashboardTelegramMessageApi({
      chat_id: user.latest_chat_id,
      login_account_id: user.latest_login_account_id,
      text,
    });
    messages.value = [
      sent,
      ...messages.value.filter((item) => item.id !== sent.id),
    ];
    draftMessage.value = '';
    await loadData({ keepSelected: true });
    await scrollMessagesToBottom();
  } catch (error: any) {
    message.error(error?.message || '发送失败');
  } finally {
    sending.value = false;
  }
}

function messagePeerText(item: DashboardTelegramMessageItem) {
  if (item.direction === 'out') return '客服';
  if (item.username_snapshot) return `@${item.username_snapshot}`;
  if (item.first_name_snapshot) return item.first_name_snapshot;
  return `ID ${item.tg_user_id}`;
}

function userInitial(user: DashboardTelegramChatUserItem | null) {
  const name =
    user?.display_name?.trim() || user?.primary_username?.trim() || '?';
  return name.slice(0, 1).toUpperCase();
}

function messageInitial(item: DashboardTelegramMessageItem) {
  return messagePeerText(item).replace(/^@/, '').slice(0, 1).toUpperCase();
}

function formatTime(value?: null | string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

function formatShortTime(value?: null | string) {
  if (!value) return '--:--';
  return value.slice(11, 16);
}

function formatGroupDate(value?: null | string) {
  if (!value) return '未知日期';
  return value.slice(0, 10).replaceAll('-', '.');
}

function previewText(user: DashboardTelegramChatUserItem) {
  if (user.latest_message) return user.latest_message;
  return user.message_count > 0 ? '有消息，但最后一条为空' : '暂无聊天记录';
}

onMounted(() => loadData());
</script>

<template>
  <Page title="聊天记录">
    <div class="chat-shell">
      <aside class="conversation-pane">
        <div class="pane-summary">
          <div class="summary-item">
            <span class="summary-label">活跃会话</span>
            <strong>{{ usersWithMessagesCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">消息</span>
            <strong>{{ totalMessagesCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">空用户</span>
            <strong>{{ usersWithoutMessagesCount }}</strong>
          </div>
        </div>

        <div class="pane-toolbar">
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索用户 / 昵称 / Telegram ID"
            @search="() => loadData()"
          />
          <div class="pane-actions">
            <label class="switch-line">
              <Switch v-model:checked="showEmptyUsers" size="small" />
              <span>显示 0 消息用户</span>
            </label>
            <Button
              :loading="loading"
              @click="() => loadData({ keepSelected: true })"
            >
              刷新
            </Button>
          </div>
        </div>

        <div class="conversation-list">
          <div
            v-for="user in visibleUsers"
            :key="user.tg_user_id"
            class="conversation-item"
            :class="{ active: selectedUser?.tg_user_id === user.tg_user_id }"
            @click="selectUser(user)"
          >
            <Avatar class="conversation-avatar" :size="44">
              {{ userInitial(user) }}
            </Avatar>
            <div class="conversation-main">
              <div class="conversation-title-row">
                <span class="conversation-title">{{ user.display_name }}</span>
                <Tag
                  v-if="selectedUser?.tg_user_id === user.tg_user_id"
                  color="green"
                >
                  当前
                </Tag>
                <Tag v-else-if="user.message_count > 0" color="blue">
                  活跃
                </Tag>
                <Tag v-else color="default"> 空白 </Tag>
              </div>
              <div class="conversation-subtitle">
                {{ user.username_label || `ID ${user.tg_user_id}` }}
              </div>
              <div class="conversation-preview">
                {{ previewText(user) }}
              </div>
            </div>
            <div class="conversation-side">
              <span class="conversation-count">{{ user.message_count }} 条</span>
              <span>{{ formatTime(user.latest_at) }}</span>
            </div>
          </div>
          <Empty v-if="visibleUsers.length === 0" description="无活跃会话" />
        </div>
      </aside>

      <section class="chat-pane">
        <header class="chat-header">
          <template v-if="selectedUser">
            <div class="chat-header-main">
              <Avatar class="chat-avatar" :size="54">
                {{ userInitial(selectedUser) }}
              </Avatar>
              <div>
                <div class="chat-title">{{ selectedUser.display_name }}</div>
                <div class="chat-subtitle">
                  {{
                    selectedUser.username_label ||
                    `ID ${selectedUser.tg_user_id}`
                  }}
                </div>
              </div>
            </div>
            <div class="chat-header-meta">
              <div class="meta-pill">
                <span class="meta-pill-label">消息</span>
                <strong>{{ selectedUser.message_count }}</strong>
              </div>
              <div class="meta-pill">
                <span class="meta-pill-label">最近活跃</span>
                <strong>{{ formatTime(selectedUser.latest_at) }}</strong>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="chat-title">请选择一个用户</div>
          </template>
        </header>

        <main ref="messageScrollRef" class="message-timeline">
          <template v-if="selectedUser && timelineGroups.length > 0">
            <section
              v-for="group in timelineGroups"
              :key="group.key"
              class="timeline-group"
            >
              <div class="timeline-date">
                <span>{{ group.label }}</span>
              </div>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="message-row"
                :class="
                  item.direction === 'out'
                    ? 'message-row-out'
                    : 'message-row-in'
                "
              >
                <Avatar
                  v-if="item.direction !== 'out'"
                  class="message-avatar"
                  :size="32"
                >
                  {{ messageInitial(item) }}
                </Avatar>
                <div
                  class="message-bubble"
                  :class="
                    item.direction === 'out'
                      ? 'message-bubble-out'
                      : 'message-bubble-in'
                  "
                >
                  <div class="message-topline">
                    <span class="message-sender">{{
                      messagePeerText(item)
                    }}</span>
                    <Tag
                      class="message-source"
                      :color="item.direction === 'out' ? 'blue' : 'default'"
                    >
                      {{ item.direction === 'out' ? '已回复' : '收到' }}
                    </Tag>
                    <Tag
                      v-if="item.content_type !== 'text'"
                      class="message-source"
                      color="gold"
                    >
                      {{ item.content_type }}
                    </Tag>
                  </div>
                  <div class="message-content">
                    {{ item.text || `[${item.content_type}]` }}
                  </div>
                  <div class="message-time">
                    {{ formatShortTime(item.created_at) }} ·
                    {{ item.source_label || item.source }}
                  </div>
                </div>
              </div>
            </section>
          </template>
          <Empty
            v-else
            :description="selectedUser ? '暂无聊天记录' : '未选择用户'"
          />
        </main>

        <footer class="message-editor">
          <div class="message-editor-main">
            <Input.TextArea
              v-model:value="draftMessage"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              :disabled="!selectedUser || !canRunCloudDanger"
              placeholder="输入回复内容"
              @press-enter.exact.prevent="sendMessage"
            />
            <Button
              type="primary"
              :disabled="
                !selectedUser || !draftMessage.trim() || !canRunCloudDanger
              "
              :loading="sending"
              @click="sendMessage"
            >
              发送
            </Button>
          </div>
        </footer>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.chat-shell {
  --chat-border: #d7dde8;
  --chat-muted: #667085;
  --chat-soft: #f6f8fb;
  --chat-accent: #1f6feb;

  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 12px;
  height: calc(100vh - 146px);
  min-height: 660px;
}

.conversation-pane,
.chat-pane {
  display: flex;
  min-height: 0;
  overflow: hidden;
  color: #1f2937;
  background: #fff;
  border: 1px solid var(--chat-border);
  border-radius: 8px;
}

.conversation-pane {
  flex-direction: column;
}

.pane-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--chat-border);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  background: #fbfcfe;
  border-right: 1px solid var(--chat-border);
}

.summary-item:last-child {
  border-right: 0;
}

.summary-item strong {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
}

.summary-label {
  font-size: 12px;
  color: var(--chat-muted);
}

.pane-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--chat-soft);
  border-bottom: 1px solid var(--chat-border);
}

.pane-toolbar :deep(.ant-input),
.pane-toolbar :deep(.ant-btn),
.message-editor-main :deep(.ant-input) {
  border-radius: 6px;
}

.pane-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.switch-line {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--chat-muted);
}

.conversation-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: auto;
  background: #fff;
}

.conversation-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 6px;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.conversation-item:hover,
.conversation-item.active {
  background: #eef5ff;
  border-color: #9cc2ff;
}

.conversation-avatar,
.chat-avatar,
.message-avatar {
  flex: none;
  color: #fff;
  background: #2f6fbd;
}

.conversation-main {
  min-width: 0;
}

.conversation-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-title,
.conversation-subtitle,
.conversation-preview {
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.conversation-subtitle {
  margin-bottom: 7px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--chat-muted);
  white-space: nowrap;
}

.conversation-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  font-size: 13px;
  line-height: 1.5;
  color: #344054;
  -webkit-box-orient: vertical;
}

.conversation-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  min-width: 92px;
  font-size: 11px;
  color: var(--chat-muted);
}

.conversation-count {
  font-weight: 700;
  color: #111827;
}

.chat-pane {
  position: relative;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 12px 16px;
  background: var(--chat-soft);
  border-bottom: 1px solid var(--chat-border);
}

.chat-header-main {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.chat-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.chat-subtitle {
  margin-top: 4px;
  color: var(--chat-muted);
}

.chat-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 132px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid var(--chat-border);
  border-radius: 6px;
}

.meta-pill-label {
  font-size: 11px;
  color: var(--chat-muted);
  text-transform: uppercase;
}

.message-timeline {
  flex: 1;
  min-height: 0;
  padding: 18px 20px;
  overflow: auto;
  background: #f3f6fa;
}

.timeline-group + .timeline-group {
  margin-top: 18px;
}

.timeline-date {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0 16px;
}

.timeline-date span {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
  background: #fff;
  border: 1px solid var(--chat-border);
  border-radius: 6px;
}

.message-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.message-row-in {
  justify-content: flex-start;
}

.message-row-out {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(720px, 78%);
  padding: 12px 14px 10px;
  border: 1px solid var(--chat-border);
  border-radius: 8px;
}

.message-bubble-in {
  background: #fff;
}

.message-bubble-out {
  background: #eaf3ff;
  border-color: #9cc2ff;
}

.message-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.message-sender {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
}

.message-source {
  margin-inline-end: 0;
}

.message-content {
  font-size: 15px;
  line-height: 1.65;
  color: #1f2937;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-time {
  margin-top: 10px;
  font-size: 11px;
  color: var(--chat-muted);
  text-align: right;
}

.message-editor {
  padding: 12px 14px;
  background: #fff;
  border-top: 1px solid var(--chat-border);
}

.message-editor-main {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-editor-main :deep(.ant-input) {
  border-radius: 6px;
}

.message-editor-main :deep(.ant-input[disabled]) {
  color: #98a2b3;
  background: #f2f4f7;
}

@media (max-width: 1320px) {
  .chat-shell {
    grid-template-columns: 320px minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .chat-shell {
    grid-template-columns: 1fr;
    height: auto;
  }

  .conversation-list,
  .message-timeline {
    max-height: 520px;
  }

  .message-editor {
    grid-template-columns: 1fr;
  }
}
</style>
