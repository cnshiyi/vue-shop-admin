<script lang="ts" setup>
import type {
  DashboardTelegramChatUserItem,
  DashboardTelegramMessageItem,
} from '#/api/admin';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Avatar, Button, Empty, Input, Switch, message, Tag } from 'ant-design-vue';

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
  const items = [...users.value].sort((a, b) => {
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
    key: string;
    label: string;
    items: DashboardTelegramMessageItem[];
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
  const name = user?.display_name?.trim() || user?.primary_username?.trim() || '?';
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
  <Page
    title="聊天记录"
    description="先加载用户，选中用户后再读取单用户聊天记录"
  >
    <div class="chat-shell">
      <aside class="conversation-pane">
        <div class="pane-hero">
          <div class="pane-hero-copy">
            <div class="eyebrow">Telegram Inbox</div>
            <div class="hero-title">把有效会话提到前面，不让 0 消息空用户淹没工单。</div>
          </div>
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-value">{{ usersWithMessagesCount }}</span>
              <span class="metric-label">活跃会话</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ totalMessagesCount }}</span>
              <span class="metric-label">消息总数</span>
            </div>
            <div class="metric-card metric-card-muted">
              <span class="metric-value">{{ usersWithoutMessagesCount }}</span>
              <span class="metric-label">空用户</span>
            </div>
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
                <Tag
                  v-else-if="user.message_count > 0"
                  color="blue"
                >
                  活跃
                </Tag>
                <Tag
                  v-else
                  color="default"
                >
                  空白
                </Tag>
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
          <Empty v-if="visibleUsers.length === 0" description="暂无匹配用户" />
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
                    selectedUser.username_label || `ID ${selectedUser.tg_user_id}`
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
            <div class="chat-subtitle">
              左侧只加载用户，聊天记录选中后再读取
            </div>
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
                :class="item.direction === 'out' ? 'message-row-out' : 'message-row-in'"
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
                  :class="item.direction === 'out' ? 'message-bubble-out' : 'message-bubble-in'"
                >
                  <div class="message-topline">
                    <span class="message-sender">{{ messagePeerText(item) }}</span>
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
            :description="selectedUser ? '暂无聊天记录' : '先选择左侧用户'"
          />
        </main>

        <footer class="message-editor">
          <div class="message-editor-copy">
            <div class="editor-title">快速回复</div>
            <div class="editor-desc">
              Enter 发送，Shift + Enter 换行。高风险权限仍按现有后台控制。
            </div>
          </div>
          <div class="message-editor-main">
            <Input.TextArea
              v-model:value="draftMessage"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              :disabled="!selectedUser || !canRunCloudDanger"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
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
  --chat-panel-bg: linear-gradient(180deg, rgb(12 15 24 / 96%), rgb(20 23 34 / 98%));
  --chat-card-border: rgb(255 255 255 / 9%);
  --chat-card-shadow: 0 18px 48px rgb(0 0 0 / 22%);
  --chat-soft: rgb(255 255 255 / 7%);
  --chat-soft-strong: rgb(255 255 255 / 12%);
  --chat-accent: #3f8cff;
  --chat-accent-soft: rgb(63 140 255 / 16%);
  --chat-success: #6be28c;
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  gap: 18px;
  min-height: 720px;
  height: calc(100vh - 146px);
}

.conversation-pane,
.chat-pane {
  display: flex;
  min-height: 0;
  overflow: hidden;
  color: rgb(244 247 255 / 92%);
  background: var(--chat-panel-bg);
  border: 1px solid var(--chat-card-border);
  border-radius: 24px;
  box-shadow: var(--chat-card-shadow);
}

.conversation-pane {
  flex-direction: column;
}

.pane-hero {
  position: relative;
  overflow: hidden;
  padding: 22px 22px 18px;
  background:
    radial-gradient(circle at top left, rgb(81 121 255 / 30%), transparent 42%),
    radial-gradient(circle at 90% 18%, rgb(76 225 160 / 18%), transparent 34%);
  border-bottom: 1px solid var(--chat-card-border);
}

.pane-hero-copy {
  max-width: 280px;
}

.eyebrow {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgb(161 194 255 / 88%);
  text-transform: uppercase;
}

.hero-title {
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
  color: #f7fbff;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgb(255 255 255 / 7%);
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.metric-card-muted {
  background: rgb(255 255 255 / 4%);
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.metric-label {
  font-size: 12px;
  color: rgb(220 228 255 / 66%);
}

.pane-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--chat-card-border);
  background: rgb(255 255 255 / 2%);
}

.pane-toolbar :deep(.ant-input-group-addon),
.pane-toolbar :deep(.ant-input),
.message-editor-main :deep(.ant-input) {
  color: #eff4ff;
  background: rgb(255 255 255 / 4%);
  border-color: rgb(255 255 255 / 10%);
}

.pane-toolbar :deep(.ant-input::placeholder),
.message-editor-main :deep(.ant-input::placeholder) {
  color: rgb(220 228 255 / 36%);
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
  color: rgb(220 228 255 / 72%);
}

.conversation-list {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 2%), transparent 18%),
    rgb(8 10 17 / 26%);
}

.conversation-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  background: rgb(255 255 255 / 4%);
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: 18px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.conversation-item:hover,
.conversation-item.active {
  background: linear-gradient(135deg, rgb(63 140 255 / 16%), rgb(255 255 255 / 6%));
  border-color: rgb(95 160 255 / 44%);
  box-shadow: 0 14px 24px rgb(0 0 0 / 16%);
  transform: translateY(-1px);
}

.conversation-avatar,
.chat-avatar,
.message-avatar {
  flex: none;
  color: #fff;
  background:
    linear-gradient(145deg, rgb(93 136 255 / 94%), rgb(63 205 162 / 74%));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 26%);
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
  color: #fff;
  white-space: nowrap;
}

.conversation-subtitle {
  margin-bottom: 7px;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(186 202 245 / 74%);
  white-space: nowrap;
}

.conversation-preview {
  display: -webkit-box;
  font-size: 13px;
  line-height: 1.5;
  color: rgb(240 245 255 / 84%);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.conversation-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  min-width: 92px;
  font-size: 11px;
  color: rgb(194 205 234 / 72%);
}

.conversation-count {
  font-weight: 700;
  color: rgb(238 244 255 / 92%);
}

.chat-pane {
  position: relative;
  flex-direction: column;
  background:
    radial-gradient(circle at top right, rgb(81 121 255 / 18%), transparent 32%),
    linear-gradient(180deg, rgb(11 14 23 / 96%), rgb(16 18 28 / 98%));
}

.chat-header {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--chat-card-border);
  background: rgb(255 255 255 / 3%);
}

.chat-header-main {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.chat-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.chat-subtitle {
  margin-top: 4px;
  color: rgb(186 202 245 / 78%);
}

.chat-header-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 14px;
  min-width: 132px;
  background: rgb(255 255 255 / 4%);
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 16px;
}

.meta-pill-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgb(186 202 245 / 66%);
  text-transform: uppercase;
}

.message-timeline {
  flex: 1;
  min-height: 0;
  padding: 22px 26px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 2%), transparent 16%),
    linear-gradient(180deg, rgb(14 17 26 / 82%), rgb(14 17 26 / 94%));
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
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(210 221 248 / 72%);
  background: rgb(255 255 255 / 4%);
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 999px;
  text-transform: uppercase;
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
  padding: 14px 16px 12px;
  border-radius: 22px;
  border: 1px solid rgb(255 255 255 / 9%);
  box-shadow: 0 16px 30px rgb(0 0 0 / 18%);
}

.message-bubble-in {
  background: linear-gradient(180deg, rgb(255 255 255 / 8%), rgb(255 255 255 / 4%));
}

.message-bubble-out {
  background: linear-gradient(135deg, rgb(63 140 255 / 22%), rgb(39 60 118 / 48%));
  border-color: rgb(88 151 255 / 32%);
}

.message-topline {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.message-sender {
  font-size: 12px;
  font-weight: 700;
  color: rgb(236 243 255 / 92%);
}

.message-source {
  margin-inline-end: 0;
}

.message-content {
  font-size: 15px;
  line-height: 1.7;
  color: #f5f8ff;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-time {
  margin-top: 10px;
  font-size: 11px;
  color: rgb(186 202 245 / 66%);
  text-align: right;
}

.message-editor {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: end;
  padding: 18px 22px 20px;
  border-top: 1px solid var(--chat-card-border);
  background: rgb(8 10 17 / 38%);
}

.editor-title {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.editor-desc {
  font-size: 12px;
  line-height: 1.6;
  color: rgb(186 202 245 / 68%);
}

.message-editor-main {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-editor-main :deep(.ant-input) {
  border-radius: 16px;
}

.message-editor-main :deep(.ant-input[disabled]) {
  color: rgb(180 190 214 / 54%);
  background: rgb(255 255 255 / 3%);
}

@media (max-width: 1320px) {
  .chat-shell {
    grid-template-columns: 340px minmax(0, 1fr);
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
