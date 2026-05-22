<script lang="ts" setup>
import type {
  DashboardTelegramChatUserItem,
  DashboardTelegramMessageItem,
} from '#/api/admin';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Empty, Input, message, Tag } from 'ant-design-vue';

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
const users = ref<DashboardTelegramChatUserItem[]>([]);
const messages = ref<DashboardTelegramMessageItem[]>([]);
const selectedUser = ref<DashboardTelegramChatUserItem | null>(null);
const messageScrollRef = ref<HTMLElement | null>(null);
const { canRunCloudDanger, requireCloudDangerPermission } =
  useDashboardPermissions();

const orderedMessages = computed(() => [...messages.value].toReversed());

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
  if (item.direction === 'out') return '我';
  if (item.username_snapshot) return `@${item.username_snapshot}`;
  if (item.first_name_snapshot) return item.first_name_snapshot;
  return `ID ${item.tg_user_id}`;
}

function formatTime(value?: null | string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

onMounted(() => loadData());
</script>

<template>
  <Page title="聊天记录" description="先加载用户，选中用户后再读取单用户聊天记录">
    <div class="chat-shell">
      <aside class="conversation-pane">
        <div class="pane-toolbar">
          <Input.Search
            v-model:value="keyword"
            allow-clear
            enter-button="搜索"
            placeholder="搜索用户 / 昵称 / Telegram ID"
            @search="() => loadData()"
          />
          <div class="pane-actions">
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
            v-for="user in users"
            :key="user.tg_user_id"
            class="conversation-item"
            :class="{ active: selectedUser?.tg_user_id === user.tg_user_id }"
            @click="selectUser(user)"
          >
            <div class="conversation-main">
              <div class="conversation-title-row">
                <span class="conversation-title">{{ user.display_name }}</span>
                <Tag
                  v-if="selectedUser?.tg_user_id === user.tg_user_id"
                  color="green"
                >
                  当前
                </Tag>
              </div>
              <div class="conversation-subtitle">
                {{ user.username_label || `ID ${user.tg_user_id}` }}
              </div>
              <div v-if="user.latest_message" class="conversation-subtitle">
                {{ user.latest_message }}
              </div>
            </div>
            <div class="conversation-side">
              <span>{{ user.message_count }} 条</span>
              <span>{{ formatTime(user.latest_at) }}</span>
            </div>
          </div>
          <Empty v-if="users.length === 0" description="暂无匹配用户" />
        </div>
      </aside>

      <section class="chat-pane">
        <header class="chat-header">
          <div v-if="selectedUser">
            <div class="chat-title">{{ selectedUser.display_name }}</div>
            <div class="chat-subtitle">
              {{
                selectedUser.username_label || `ID ${selectedUser.tg_user_id}`
              }}
              · {{ selectedUser.message_count }} 条消息
            </div>
          </div>
          <div v-else>
            <div class="chat-title">请选择一个用户</div>
            <div class="chat-subtitle">左侧只加载用户，聊天记录选中后再读取</div>
          </div>
        </header>

        <main ref="messageScrollRef" class="message-timeline">
          <template v-if="selectedUser && orderedMessages.length > 0">
            <div
              v-for="(item, index) in orderedMessages"
              :key="item.id"
              class="message-row"
              :class="[
                item.direction === 'out' ? 'message-row-out' : 'message-row-in',
                index % 2 === 1 ? 'message-row-alt' : '',
              ]"
            >
              <div
                class="message-bubble"
                :class="[
                  item.direction === 'out'
                    ? 'message-bubble-out'
                    : 'message-bubble-in',
                  index % 2 === 1 ? 'message-bubble-alt' : '',
                ]"
              >
                <div v-if="item.direction !== 'out'" class="message-sender">
                  {{ messagePeerText(item) }}
                </div>
                <div class="message-content">
                  {{ item.text || `[${item.content_type}]` }}
                </div>
                <div class="message-time">
                  {{ formatTime(item.created_at) }}
                </div>
              </div>
            </div>
          </template>
          <Empty
            v-else
            :description="selectedUser ? '暂无聊天记录' : '先选择左侧用户'"
          />
        </main>

        <footer class="message-editor">
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
        </footer>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.chat-shell {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - 150px);
  min-height: 620px;
}

.conversation-pane,
.chat-pane {
  display: flex;
  min-height: 0;
  overflow: hidden;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 6%);
}

.conversation-pane {
  flex-direction: column;
}

.pane-toolbar {
  flex: 0 0 auto;
  padding: 14px;
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.pane-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.conversation-list {
  flex: 1;
  min-height: 0;
  padding: 10px;
  overflow: auto;
  background: var(--ant-color-fill-quaternary);
}

.conversation-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border-secondary);
  border-bottom-color: color-mix(
    in srgb,
    var(--ant-color-text) 42%,
    transparent
  );
  border-radius: 12px;
}

.conversation-item:nth-child(even) {
  border-bottom-width: 2px;
}

.conversation-item:hover,
.conversation-item.active {
  background: var(--ant-color-primary-bg);
  border-color: var(--ant-color-primary-border);
  border-bottom-color: color-mix(
    in srgb,
    var(--ant-color-text) 58%,
    transparent
  );
}

.conversation-title-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.conversation-title,
.conversation-subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-title {
  font-weight: 600;
  color: var(--ant-color-text);
}

.conversation-side,
.chat-subtitle,
.message-time,
.message-sender {
  color: var(--ant-color-text-tertiary);
}

.conversation-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  font-size: 12px;
}

.chat-pane {
  flex-direction: column;
}

.chat-header {
  flex: 0 0 auto;
  padding: 14px 18px;
  border-bottom: 1px solid var(--ant-color-border-secondary);
}

.chat-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ant-color-text);
}

.message-timeline {
  flex: 1;
  min-height: 0;
  padding: 18px;
  overflow: auto;
  background: linear-gradient(
    180deg,
    var(--ant-color-fill-quaternary),
    var(--ant-color-bg-container)
  );
}

.message-row {
  display: flex;
  margin-bottom: 12px;
}

.message-row-in {
  justify-content: flex-start;
}

.message-row-out {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(680px, 76%);
  padding: 10px 12px;
  color: var(--ant-color-text);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: 14px;
}

.message-bubble-in {
  background: var(--ant-color-bg-container);
  box-shadow: 0 4px 14px rgb(0 0 0 / 5%);
}

.message-bubble-out {
  background: var(--ant-color-primary-bg);
  border-color: var(--ant-color-primary-border);
  box-shadow: 0 4px 14px rgb(0 0 0 / 5%);
}

.message-bubble-alt.message-bubble-in {
  background: color-mix(
    in srgb,
    var(--ant-color-bg-container) 88%,
    var(--ant-color-primary-bg)
  );
}

.message-bubble-alt.message-bubble-out {
  background: color-mix(
    in srgb,
    var(--ant-color-primary-bg) 88%,
    var(--ant-color-bg-container)
  );
}

.message-sender {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
}

.message-content {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-time {
  margin-top: 6px;
  font-size: 11px;
  text-align: right;
}

.message-editor {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
  align-items: flex-end;
  padding: 14px;
  border-top: 1px solid var(--ant-color-border-secondary);
}

.message-editor :deep(.ant-input) {
  flex: 1;
}

@media (max-width: 1200px) {
  .chat-shell {
    grid-template-columns: 1fr;
    height: auto;
  }

  .conversation-list,
  .message-timeline {
    max-height: 520px;
  }
}
</style>
