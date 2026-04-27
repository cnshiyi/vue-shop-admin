<script lang="ts" setup>
import type { DashboardTelegramAccountsOverview } from '#/api/admin';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Space,
  Steps,
  Switch,
  Tag,
} from 'ant-design-vue';

import {
  getDashboardTelegramAccountsApi,
  startDashboardTelegramLoginApi,
  submitDashboardTelegramLoginCodeApi,
  submitDashboardTelegramLoginPasswordApi,
  updateDashboardTelegramAccountNotifyApi,
} from '#/api/admin';

const loading = ref(false);
const saving = ref(false);
const open = ref(false);
const loginStep = ref(0);
const overview = ref<DashboardTelegramAccountsOverview>({
  accounts: [],
  chats: [],
  messages: [],
  users: [],
});

const accountId = ref<null | number>(null);
const form = reactive({
  code: '',
  password: '',
  phone: '',
});

const stepTitle = ['输入手机号', '输入验证码', '输入二级密码'];

const statusTextMap: Record<string, string> = {
  code_sent: '验证码已发送',
  error: '登录失败',
  logged_in: '登录成功',
  listener_error: '监听异常',
  password_required: '等待二级密码',
  pending: '待处理',
  registered: '已登记',
  session_expired: '会话失效',
};

function statusText(status: string) {
  return statusTextMap[status] || status || '-';
}

async function loadData() {
  loading.value = true;
  try {
    overview.value = await getDashboardTelegramAccountsApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.phone = '';
  form.code = '';
  form.password = '';
  loginStep.value = 0;
  accountId.value = null;
  open.value = true;
}

async function handleLoginStep() {
  if (loginStep.value === 0) {
    if (!String(form.phone || '').trim()) {
      message.error('请输入手机号');
      return;
    }
    saving.value = true;
    try {
      const result = await startDashboardTelegramLoginApi({
        phone: form.phone,
      });
      accountId.value = result.account_id;
      message.success('验证码已发送');
      loginStep.value = 1;
    } catch (error: any) {
      message.error(error?.message || '发送验证码失败');
    } finally {
      saving.value = false;
    }
    return;
  }
  if (loginStep.value === 1) {
    if (!String(form.code || '').trim()) {
      message.error('请输入验证码');
      return;
    }
    if (!accountId.value) {
      message.error('登录会话不存在，请重新输入手机号');
      loginStep.value = 0;
      return;
    }
    saving.value = true;
    try {
      const result = await submitDashboardTelegramLoginCodeApi({
        account_id: accountId.value,
        code: form.code,
      });
      if (result.requires_password) {
        loginStep.value = 2;
      } else {
        message.success('登录成功');
        open.value = false;
        await loadData();
      }
    } catch (error: any) {
      message.error(error?.message || '验证码登录失败');
    } finally {
      saving.value = false;
    }
    return;
  }
  if (!accountId.value) {
    message.error('登录会话不存在，请重新输入手机号');
    loginStep.value = 0;
    return;
  }
  saving.value = true;
  try {
    await submitDashboardTelegramLoginPasswordApi({
      account_id: accountId.value,
      password: form.password,
    });
    message.success('登录成功');
    open.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '二级密码登录失败');
  } finally {
    saving.value = false;
  }
}

async function toggleNotify(accountId: number, notifyEnabled: boolean) {
  try {
    await updateDashboardTelegramAccountNotifyApi(accountId, {
      notify_enabled: notifyEnabled,
    });
    message.success(notifyEnabled ? '已开启通知' : '已关闭通知');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '更新通知开关失败');
    await loadData();
  }
}

function prevLoginStep() {
  if (loginStep.value > 0) loginStep.value -= 1;
}

onMounted(loadData);
</script>

<template>
  <Page title="账号列表" description="管理 Telegram 登录账号">
    <Card class="mb-4">
      <Space wrap>
        <Button type="primary" @click="openCreate">登录</Button>
        <Button :loading="loading" @click="loadData">刷新</Button>
      </Space>
      <div class="mt-2 text-xs text-[var(--ant-color-text-description)]">
        自动识别范围：用户主动与 bot 产生的资料。个人 Telegram
        账号登录采集需要单独授权流程。
      </div>
    </Card>

    <Card :loading="loading" title="账号列表">
      <List v-if="overview.accounts.length > 0" :data-source="overview.accounts">
        <template #renderItem="{ item }">
          <List.Item>
            <List.Item.Meta
              :description="`${item.phone || '-'} · ${item.username ? `@${ item.username}` : '-'} · ${item.note || ''}`"
              :title="item.label"
            />
            <Space>
              <span class="text-xs text-[var(--ant-color-text-description)]">通知</span>
              <Switch
                size="small"
                :checked="item.notify_enabled"
                @change="(checked) => toggleNotify(item.id, !!checked)"
              />
              <Tag color="blue">{{ statusText(item.status) }}</Tag>
            </Space>
          </List.Item>
        </template>
      </List>
      <Empty v-else description="暂无账号" />
    </Card>

    <Modal
      v-model:open="open"
      :confirm-loading="saving"
      :ok-text="loginStep < 2 ? '下一步' : '确定'"
      title="登录 Telegram 账号"
      @ok="handleLoginStep"
    >
      <Steps
        class="mb-5"
        size="small"
        :current="loginStep"
        :items="stepTitle.map((title) => ({ title }))"
      />
      <Form layout="vertical">
        <Form.Item v-if="loginStep === 0" label="手机号" required>
          <Input
            v-model:value="form.phone"
            placeholder="请输入 Telegram 手机号，例如 +8613800000000"
          />
        </Form.Item>
        <Form.Item v-if="loginStep === 1" label="验证码" required>
          <Input
            v-model:value="form.code"
            placeholder="请输入 Telegram 验证码"
          />
        </Form.Item>
        <Form.Item v-if="loginStep === 2" label="二级密码">
          <Input.Password
            v-model:value="form.password"
            placeholder="可为空，直接点确定"
            :visibility-toggle="false"
          />
          <div class="mt-2 text-xs text-[var(--ant-color-text-description)]">
            二级密码允许为空；为空时直接点确定。
          </div>
        </Form.Item>
      </Form>
      <template #footer>
        <Space>
          <Button v-if="loginStep > 0" @click="prevLoginStep">上一步</Button>
          <Button @click="open = false">取消</Button>
          <Button type="primary" :loading="saving" @click="handleLoginStep">
            {{ loginStep < 2 ? '下一步' : '确定' }}
          </Button>
        </Space>
      </template>
    </Modal>
  </Page>
</template>
