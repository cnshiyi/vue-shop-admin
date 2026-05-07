import { requestClient } from '#/api/request';

interface DashboardListQuery {
  archived?: 0 | 1;
  group_by?: 'telegram_group' | 'user';
  grouped?: 0 | 1;
  keyword?: string;
  page?: number;
  page_size?: number;
  paginated?: 0 | 1;
}

export interface DashboardSummary {
  cloud_orders_total: number;
  cloud_pending: number;
  monitors_total: number;
  orders_total: number;
  recharge_pending: number;
  recharges_total: number;
  users_total: number;
  server_assets_total?: number;
  due_today?: number;
  new_orders_today?: number;
  renew_due?: number;
  revenue_total?: string;
  cost_total?: string;
  profit_total?: string;
}

export interface LatestCloudOrder {
  created_at: null | string;
  id: number;
  order_no: string;
  plan_name: string;
  region_label?: string;
  region_name: string;
  status: string;
  status_label?: string;
  execution_status?: string;
  execution_status_label?: string;
  total_amount: string;
}

export interface LatestRecharge {
  amount: string;
  created_at: null | string;
  id: number;
  status: string;
  status_label?: string;
  tx_hash: null | string;
}

export interface DashboardShutdownLog {
  asset_id?: null | number;
  delete_at: null | string;
  id: number | string;
  is_old_shutdown?: boolean;
  logged_at: null | string;
  note: string;
  order_id?: null | number;
  order_no: string;
  public_ip: string;
  provider?: string;
  provider_label?: string;
  cloud_account_id?: null | number;
  cloud_account_name?: string;
  external_account_id?: string;
  account_label?: string;
  user_display_name?: string;
  username_label?: string;
  service_expires_at: null | string;
  status: string;
  status_label?: string;
  suspend_at: null | string;
}

export interface DashboardUnattachedIpDeletePlan {
  asset_name: string;
  delete_at: null | string;
  id: number;
  is_overdue?: boolean;
  note: string;
  provider_status: string;
  public_ip: string;
  user_display_name?: string;
  username_label?: string;
}

export interface DashboardChartSeries {
  trend: {
    expiry: number[];
    labels: string[];
    orders: number[];
    profit: number[];
    servers: number[];
    users: number[];
  };
}

export interface DashboardOverview {
  charts?: DashboardChartSeries;
  latest_cloud_orders: LatestCloudOrder[];
  latest_recharges: LatestRecharge[];
  shutdown_logs?: DashboardShutdownLog[];
  summary: DashboardSummary;
  unattached_ip_delete_plans?: DashboardUnattachedIpDeletePlan[];
}

export interface DashboardUserItem {
  balance: string;
  balance_trx: string;
  cloud_discount_rate: string;
  created_at: null | string;
  display_name: string;
  first_name: null | string;
  id: number;
  primary_username: string;
  proxy_count: number;
  tg_user_id: number;
  username: null | string;
  username_label: string;
  usernames: string[];
}

export interface DashboardCloudOrderItem {
  created_at: null | string;
  currency: string;
  delete_at?: null | string;
  id: number;
  order_no: string;
  order_source?: string;
  order_source_label?: string;
  order_source_tags?: string[];
  order_source_tag_labels?: string[];
  pay_amount: null | string;
  plan_name: string;
  provider: string;
  provision_note: null | string;
  public_ip: null | string;
  region_label?: string;
  region_name: string;
  server_name?: null | string;
  service_expires_at?: null | string;
  status: string;
  status_label?: string;
  suspend_at?: null | string;
  execution_status?: string;
  execution_status_label?: string;
  total_amount: string;
  username_label?: string;
}

export interface DashboardCloudOrderDetail extends DashboardCloudOrderItem {
  completed_at: null | string;
  currency: string;
  delete_at: null | string;
  expired_at: null | string;
  image_name: string;
  instance_id: null | string;
  ip_recycle_at: null | string;
  last_renewed_at: null | string;
  last_user_id: null | number;
  lifecycle_days: number;
  login_password: null | string;
  login_user: null | string;
  mtproxy_host: null | string;
  mtproxy_link: null | string;
  proxy_links?: ProxyLinkItem[];
  mtproxy_port: number;
  mtproxy_secret: null | string;
  paid_at: null | string;
  pay_method: string;
  plan_id: number;
  previous_public_ip: null | string;
  provision_note: null | string;
  provider_resource_id: null | string;
  quantity: number;
  region_code: string;
  region_label?: string;
  renew_grace_expires_at: null | string;
  server_name: null | string;
  service_expires_at: null | string;
  service_started_at: null | string;
  static_ip_name: null | string;
  suspend_at: null | string;
  tg_user_id: null | number;
  tx_hash: null | string;
  updated_at: null | string;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardRechargeItem {
  amount: string;
  completed_at: null | string;
  created_at: null | string;
  currency: string;
  id: number;
  pay_amount: null | string;
  receive_address: null | string;
  status: string;
  status_label?: string;
  tg_user_id: null | number;
  tx_hash: null | string;
  updated_at: null | string;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardRechargeDetail extends DashboardRechargeItem {
  pay_amount: null | string;
  receive_address: null | string;
  tg_user_id: null | number;
  updated_at: null | string;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface ProxyLinkItem {
  name?: string;
  port?: string;
  secret?: string;
  server?: string;
  url: string;
}

export interface DashboardCloudAssetIpLogItem {
  created_at: null | string;
  event_label?: string;
  event_type: string;
  id: number;
  note?: null | string;
  previous_public_ip?: null | string;
  public_ip?: null | string;
}

export interface DashboardCloudOrderSummaryItem {
  created_at: null | string;
  detail_path?: string;
  id: number;
  order_detail_path?: string;
  order_id: number;
  order_link_path?: string;
  order_no: string;
  order_source?: string;
  order_source_label?: string;
  order_source_tags?: string[];
  order_source_tag_labels?: string[];
  provider?: string;
  provider_label?: string;
  public_ip?: null | string;
  replacement_for_id?: null | number;
  service_expires_at?: null | string;
  service_started_at?: null | string;
  status: string;
  status_label?: string;
  updated_at: null | string;
}

export interface DashboardCloudAssetItem {
  account_label: null | string;
  actual_expires_at: null | string;
  asset_name: null | string;
  cloud_account_id: null | number;
  currency: string;
  telegram_group_chat_id?: null | number;
  telegram_group_id?: null | number;
  telegram_group_title?: string;
  telegram_group_username?: string;
  days_left?: null | number;
  id: number;
  auto_renew_enabled?: boolean;
  sort_order: number;
  instance_id: null | string;
  is_active: boolean;
  ip_change_quota?: number;
  server_id?: null | number;
  status: string;
  status_countdown?: string;
  status_label?: string;
  provider_status?: null | string;
  preserve_link_status?: null | string;
  kind: string;
  mtproxy_host: null | string;
  mtproxy_link: null | string;
  proxy_links?: ProxyLinkItem[];
  mtproxy_port: null | number;
  mtproxy_secret: null | string;
  note?: null | string;
  order_detail_path?: string;
  order_id: null | number;
  order_link_path?: string;
  order_no: string;
  price: string;
  provider: null | string;
  provider_label?: string;
  provider_resource_id: null | string;
  public_ip: null | string;
  region_code?: null | string;
  region_label?: null | string;
  region_name: null | string;
  source: string;
  source_label?: string;
  tg_user_id: null | number;
  updated_at: null | string;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardCloudAssetDetail extends DashboardCloudAssetItem {
  created_at?: null | string;
  delete_at?: null | string;
  history_orders?: DashboardCloudOrderSummaryItem[];
  ip_logs?: DashboardCloudAssetIpLogItem[];
  ip_recycle_at?: null | string;
  last_renewed_at?: null | string;
  order_status?: string;
  order_status_label?: string;
  provision_note?: null | string;
  related_order?: DashboardCloudOrderSummaryItem | null;
  renew_grace_expires_at?: null | string;
  service_expires_at?: null | string;
  service_started_at?: null | string;
  suspend_at?: null | string;
}

export interface DashboardCloudAssetGroup {
  default_expanded: boolean;
  items: DashboardCloudAssetItem[];
  telegram_group_chat_id?: null | number;
  telegram_group_id?: null | number;
  telegram_group_title?: string;
  telegram_group_username?: string;
  tg_user_id: null | number;
  user_display_name: string;
  user_key: string;
  username_label: string;
}

export interface DashboardCloudAssetGroupedResponse {
  groups: DashboardCloudAssetGroup[];
  items: DashboardCloudAssetItem[];
}

export interface DashboardCloudAssetsResponse {
  items: DashboardCloudAssetItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface DashboardBotOperationLogItem {
  action_label?: string;
  action_type: string;
  chat_id: null | number;
  created_at: null | string;
  id: number;
  message_id: null | number;
  payload: null | string;
  tg_user_id: null | number;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardCloudIpLogItem {
  asset_id: null | number;
  asset_name: null | string;
  created_at: null | string;
  event_label?: string;
  event_type: string;
  id: number;
  instance_id: null | string;
  note: null | string;
  order_id: null | number;
  order_no: null | string;
  previous_public_ip: null | string;
  provider: null | string;
  provider_label?: string;
  provider_resource_id: null | string;
  public_ip: null | string;
  region_code: null | string;
  region_label?: null | string;
  region_name: null | string;
  server_id: null | number;
  tg_user_id: null | number;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardServerItem {
  account_label: null | string;
  days_left?: null | number;
  expires_at: null | string;
  id: number;
  instance_id: null | string;
  is_active: boolean;
  status: string;
  status_label?: string;
  provider_status?: null | string;
  login_user: null | string;
  order_detail_path?: string;
  order_id: null | number;
  order_no: string;
  provider: null | string;
  provider_label?: string;
  provider_resource_id: null | string;
  public_ip: null | string;
  region_label?: null | string;
  region_name: null | string;
  server_name: null | string;
  source: string;
  source_label?: string;
  status_countdown?: string;
  tg_user_id: null | number;
  updated_at: null | string;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardCloudPlanItem {
  bandwidth: string;
  cost_price?: string;
  cpu: string;
  currency: string;
  id: number;
  is_active: boolean;
  memory: string;
  config_id?: string;
  provider_plan_id?: string;
  plan_description?: null | string;
  display_plan_name?: string;
  display_cpu?: string;
  display_memory?: string;
  display_storage?: string;
  display_bandwidth?: string;
  display_description?: string;
  plan_name: string;
  price: string;
  provider: string;
  provider_label?: string;
  region_code: string;
  region_label?: string;
  region_name: string;
  sort_order: number;
  storage: string;
}

export interface DashboardCloudPricingItem extends DashboardCloudPlanItem {
  bundle_code: string;
}

export interface DashboardCloudPlanSyncResult {
  before_regions: Array<{
    provider: string;
    region_code: string;
    region_name: string;
  }>;
  provider_region_summary: Array<{
    pricing_count: number;
    provider: string;
    region_code: string;
    region_name: string;
  }>;
  regions: Array<{
    provider: string;
    region_code: string;
    region_name: string;
  }>;
  refreshed_regions: number;
  summary: {
    after_plan_count: number;
    after_pricing_count: number;
    before_plan_count: number;
    before_pricing_count: number;
    region_count: number;
  };
  synced: boolean;
}

export interface DashboardCloudPlanUpdatePayload {
  bandwidth?: string;
  cost_price?: number;
  cpu?: string;
  currency?: string;
  display_bandwidth?: string;
  display_cpu?: string;
  display_description?: string;
  display_memory?: string;
  display_plan_name?: string;
  display_storage?: string;
  is_active?: boolean;
  memory?: string;
  config_id?: string;
  provider_plan_id?: string;
  plan_description?: string;
  plan_name?: string;
  price?: number;
  provider?: string;
  region_code?: string;
  region_name?: string;
  sort_order?: number;
  storage?: string;
}

export interface DashboardSiteConfigUpdatePayload {
  is_sensitive: boolean;
  key: string;
  preserve_existing?: boolean;
  sort_order?: number;
  value: string;
}

export interface DashboardSiteConfigItem {
  description?: string;
  id: number;
  is_sensitive: boolean;
  key: string;
  value: string;
  value_preview?: string;
  sort_order?: number;
}

export interface DashboardTaskItem {
  created_at: null | string;
  id: number;
  execution_status?: string;
  execution_status_label?: string;
  note: null | string;
  order_no: string;
  plan_name: string;
  provider: string;
  provider_label?: string;
  public_ip: null | string;
  related_path: string;
  status: string;
  status_label?: string;
  task_label: string;
  task_type: string;
  updated_at: null | string;
}

export interface DashboardAutoRenewTaskDueItem {
  auto_renew_at: null | string;
  balance: null | string;
  delete_at: null | string;
  id: number;
  ip: string;
  ip_recycle_at: null | string;
  last_failure_reason?: null | string;
  next_run_at?: null | string;
  order_id?: null | number;
  order_no: string;
  provider: string;
  provider_label?: string;
  queue_status?: string;
  queue_status_label?: string;
  related_path: string;
  service_expires_at: null | string;
  status: string;
  status_label?: string;
  suspend_at: null | string;
  tg_user_id: null | number;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardAutoRenewTaskHistoryItem {
  balance_after: null | string;
  balance_before: null | string;
  balance_change: null | string;
  batch_id: string;
  currency: string;
  executed_at: null | string;
  failure_reason: null | string;
  id: number;
  ip: string;
  is_success: boolean;
  order_id: null | number;
  order_no: string;
  provider: null | string;
  provider_label?: string;
  related_path: string;
  result_label: string;
  service_expires_at: null | string;
  tg_user_id: null | number;
  user_display_name: string;
  user_id: null | number;
  username_label: string;
}

export interface DashboardAutoRenewTaskDetail {
  due_count: number;
  due_items: DashboardAutoRenewTaskDueItem[];
  future_plan_items: DashboardAutoRenewTaskDueItem[];
  history_items: DashboardAutoRenewTaskHistoryItem[];
  interval_minutes: number;
  last_run_at: null | string;
  latest_batch_count: number;
  latest_batch_failure_count: number;
  latest_batch_id: string;
  latest_batch_success_count: number;
  latest_failed_ips: string[];
  next_run_at: null | string;
  recent_failure_count: number;
  recent_success_count: number;
  status_label: string;
  task_key: string;
  task_label: string;
}

export interface DashboardCloudAccountConfigItem {
  access_key: string;
  access_key_preview?: string;
  effective_region?: null | string;
  external_account_id?: string;
  id: number;
  is_active: boolean;
  shutdown_enabled: boolean;
  last_checked_at?: null | string;
  name: string;
  provider: string;
  provider_label?: string;
  region_hint?: null | string;
  secret_key: string;
  secret_key_preview?: string;
  status?: null | string;
  status_label?: null | string;
  status_note?: null | string;
}

export interface DashboardSiteConfigGroupItem {
  default_value?: string;
  description?: string;
  id: null | number;
  is_sensitive: boolean;
  key: string;
  value: string;
  value_preview?: string;
  sort_order?: number;
}

export interface DashboardSiteConfigGroup {
  group: string;
  items: DashboardSiteConfigGroupItem[];
}

export interface DashboardTotpStartResult {
  enabled: boolean;
  otpauthUrl: string;
  secret: string;
}

export interface DashboardTotpBindResult {
  enabled: boolean;
}

export interface DashboardButtonConfigItem {
  button_label?: string;
  enabled?: boolean;
  key: string;
  label: string;
  locked?: boolean;
  message?: string;
  sort_order: number;
  type: 'business' | 'link';
  url?: string;
}

export interface DashboardButtonConfig {
  items: DashboardButtonConfigItem[];
  row_size: number;
}

export interface DashboardCloudAccountCreatePayload {
  access_key: string;
  external_account_id?: string;
  is_active: boolean;
  shutdown_enabled: boolean;
  name: string;
  provider: string;
  region_hint?: null | string;
  secret_key: string;
}

export interface DashboardCloudAccountLogItem {
  action: string;
  created_at: null | string;
  error_message: string;
  id: number;
  is_success: boolean;
  request_payload: string;
  response_payload: string;
  source: string;
  source_label?: string;
  target: string;
}

export interface DashboardCloudAccountDetail extends DashboardCloudAccountConfigItem {
  active_cloud_asset_count: number;
  cloud_asset_count: number;
  cloud_order_count: number;
  created_at: null | string;
  latest_failed_log_at: null | string;
  latest_success_log_at: null | string;
  recent_logs: DashboardCloudAccountLogItem[];
  running_cloud_order_count: number;
  sync_log_count: number;
  updated_at: null | string;
}

export type DashboardCloudAccountUpdatePayload =
  Partial<DashboardCloudAccountCreatePayload>;

export interface DashboardTelegramLoginAccountItem {
  created_at: null | string;
  has_session?: boolean;
  id: number;
  label: string;
  last_synced_at: null | string;
  listener_push_enabled: boolean;
  note: string;
  notify_enabled: boolean;
  phone: string;
  status: string;
  updated_at: null | string;
  username: string;
}

export interface DashboardTelegramChatUserItem {
  display_name: string;
  first_name: string;
  id: number;
  latest_at: null | string;
  latest_message: string;
  message_count: number;
  primary_username: string;
  tg_user_id: number;
  username_label: string;
  usernames: string[];
}

export interface DashboardTelegramChatItem {
  archived: boolean;
  chat_id: number;
  is_group?: boolean;
  login_account_id: null | number;
  login_account_label: string;
  latest_at: null | string;
  latest_message: string;
  message_count: number;
  source: string;
  source_label: string;
  subtitle: string;
  title: string;
}

export interface DashboardTelegramMessageItem {
  chat_id: number;
  chat_title: string;
  content_type: string;
  created_at: null | string;
  direction: 'in' | 'out';
  direction_label: string;
  first_name_snapshot: string;
  id: number;
  login_account_id: null | number;
  login_account_label: string;
  message_id: null | number;
  source: string;
  source_label: string;
  text: string;
  tg_user_id: number;
  username_snapshot: string;
}

export interface DashboardTelegramGroupFilterItem {
  chat_id: number;
  collapsed: boolean;
  created_at: null | string;
  enabled: boolean;
  id: number;
  push_enabled: boolean;
  title: string;
  updated_at: null | string;
  username: string;
}

export interface DashboardTelegramGroupMemberItem {
  display_label: string;
  display_name: string;
  first_name: string;
  last_seen_at: null | string;
  message_count: number;
  tg_user_id: number;
  username: string;
}

export interface DashboardTelegramGroupDetail {
  group: DashboardTelegramGroupFilterItem;
  members: DashboardTelegramGroupMemberItem[];
  messages: DashboardTelegramMessageItem[];
}

export interface DashboardTelegramGroupFilterPayload {
  chat_id?: number | string;
  collapsed?: boolean;
  enabled?: boolean;
  push_enabled?: boolean;
  title?: string;
  username?: string;
}

export interface DashboardTelegramAccountsOverview {
  accounts: DashboardTelegramLoginAccountItem[];
  chats: DashboardTelegramChatItem[];
  messages: DashboardTelegramMessageItem[];
  users: DashboardTelegramChatUserItem[];
}

export interface DashboardTelegramLoginAccountCreatePayload {
  label: string;
  note?: string;
  phone?: string;
  username?: string;
}

export interface DashboardAdminUserItem {
  date_joined: null | string;
  email: string;
  id: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: null | string;
  username: string;
}

export interface DashboardAdminUserUpsertPayload {
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  password?: string;
  username?: string;
}

export interface DashboardChangePasswordPayload {
  confirm_password: string;
  new_password: string;
  old_password: string;
}

export interface DashboardServerStatisticsRegion {
  region_code: string;
  region_label: string;
}

export interface DashboardServerStatisticsItem {
  account_label: string;
  provider_label: string;
  total_count: number;
  [key: string]: number | string;
}

export interface DashboardServerStatisticsResponse {
  items: DashboardServerStatisticsItem[];
  regions: DashboardServerStatisticsRegion[];
  summary: DashboardServerStatisticsItem;
}

export interface DashboardMonitorItem {
  address: string;
  chain_balance_error?: null | string;
  chain_trx_balance?: null | string;
  chain_usdt_balance?: null | string;
  created_at: null | string;
  daily_expense: string;
  daily_expense_currency: string;
  daily_income: string;
  daily_income_currency: string;
  id: number;
  is_active: boolean;
  monitor_resources: boolean;
  monitor_transfers: boolean;
  usdt_threshold: string;
  trx_threshold: string;
  energy_threshold: number;
  bandwidth_threshold: number;
  remark: null | string;
  resource_checked_at: null | string;
  stats_date: null | string;
  tg_user_id: null | number;
  username: null | string;
}

export async function getDashboardOverviewApi() {
  return requestClient.get<DashboardOverview>('/admin/dashboard/overview/');
}

export async function getDashboardShutdownLogsApi(
  params: { limit?: number } = {},
) {
  return requestClient.get<DashboardShutdownLog[]>(
    '/admin/dashboard/shutdown-logs/',
    { params },
  );
}

export async function getDashboardUsersApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardUserItem[]>('/admin/users/', { params });
}

export async function getDashboardTasksApi() {
  return requestClient.get<DashboardTaskItem[]>('/admin/tasks/');
}

export async function getDashboardAutoRenewTaskDetailApi() {
  return requestClient.get<DashboardAutoRenewTaskDetail>(
    '/admin/tasks/auto-renew/',
  );
}

export interface DashboardAutoRenewRunResultItem {
  error?: null | string;
  ip: string;
  ok: boolean;
  order_id: number;
  order_no: string;
  queue_status: string;
  renewed_order_id: number;
}

export interface DashboardAutoRenewRunResult {
  batch_id: string;
  failure_count: number;
  items: DashboardAutoRenewRunResultItem[];
  message?: string;
  success_count: number;
  total: number;
}

export async function runDashboardAutoRenewTasksApi() {
  return requestClient.post<DashboardAutoRenewRunResult>(
    '/admin/tasks/auto-renew/run/',
  );
}

export async function runDashboardAutoRenewOrderApi(orderId: number) {
  return requestClient.post<DashboardAutoRenewRunResult>(
    `/admin/tasks/auto-renew/orders/${orderId}/run/`,
  );
}

export async function updateDashboardUserBalanceApi(
  userId: number,
  payload: { balance: string; balance_trx: string },
) {
  return requestClient.post(`/admin/users/${userId}/balance/`, payload);
}

export async function updateDashboardUserDiscountApi(
  userId: number,
  payload: { cloud_discount_rate: string },
) {
  return requestClient.post(`/admin/users/${userId}/discount/`, payload);
}

export interface DashboardUserBalanceDetailItem {
  after_balance?: string;
  amount: string;
  balance_field: 'balance' | 'balance_trx';
  before_balance?: string;
  created_at: null | string;
  currency: string;
  description: string;
  direction: 'in' | 'out';
  direction_label: string;
  id: string;
  related_id: null | number;
  related_path: null | string;
  title: string;
  type: string;
  type_label: string;
}

export interface DashboardUserBalanceDetailsResponse {
  items: DashboardUserBalanceDetailItem[];
  user: DashboardUserItem;
}

export async function getDashboardUserBalanceDetailsApi(userId: number) {
  return requestClient.get<DashboardUserBalanceDetailsResponse>(
    `/admin/users/${userId}/balance-details/`,
  );
}

export async function getDashboardCloudAssetsApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudAssetItem[]>('/admin/cloud-assets/', {
    params,
  });
}

export async function getDashboardCloudAssetsPageApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudAssetsResponse>(
    '/admin/cloud-assets/',
    {
      params: { ...params, paginated: 1 },
    },
  );
}

export async function getDashboardCloudAssetsGroupedApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudAssetGroupedResponse>(
    '/admin/cloud-assets/',
    {
      params: { ...params, grouped: 1 },
    },
  );
}

export async function getDashboardCloudAssetDetailApi(assetId: number) {
  return requestClient.get<DashboardCloudAssetDetail>(
    `/admin/cloud-assets/${assetId}/`,
  );
}

export interface DashboardCloudAssetsSyncResult {
  accounts?: {
    aliyun?: Array<null | {
      id: number;
      label: string;
      name: string;
      provider: string;
    }>;
    aws?: Array<null | {
      id: number;
      label: string;
      name: string;
      provider: string;
    }>;
  };
  aliyun_region?: string;
  aws_region?: string;
  aws_regions?: string[];
  errors?: string[];
  logs?: string[];
  ok?: boolean;
  synced?: Record<string, boolean>;
  warnings?: string[];
}

export async function syncDashboardCloudAssetsApi(
  region = 'cn-hongkong',
  awsRegion = 'all',
) {
  return requestClient.post<DashboardCloudAssetsSyncResult>(
    '/admin/cloud-assets/sync/',
    { aws_region: awsRegion, region },
    { timeout: 0 },
  );
}

export interface DashboardCloudAssetsSyncStatus {
  aliyun_existing_count: number;
  auto_sync_every_seconds: number;
  aws_existing_count: number;
  last_synced_at: null | string;
  unattached_ip_count?: number;
}

export interface DashboardCloudAssetSyncResult {
  account?: null | {
    id: number;
    label: string;
    name: string;
    provider: string;
  };
  asset?: DashboardCloudAssetItem | null;
  errors?: string[];
  logs?: string[];
  ok?: boolean;
  provider?: string;
  region_code?: string;
}

export async function getDashboardCloudAssetsSyncStatusApi() {
  return requestClient.get<DashboardCloudAssetsSyncStatus>(
    '/admin/cloud-assets/sync-status/',
  );
}

export async function getDashboardCloudIpLogsApi(
  params: DashboardListQuery & {
    log_type?: 'ip' | 'operation' | 'server';
  } = {},
) {
  return requestClient.get<DashboardCloudIpLogItem[]>(
    '/admin/cloud-assets/ip-logs/',
    { params },
  );
}

export async function getDashboardBotOperationLogsApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardBotOperationLogItem[]>(
    '/admin/bot/operation-logs/',
    { params },
  );
}

export interface DashboardCloudAssetUpdatePayload {
  actual_expires_at?: null | string;
  is_active?: boolean;
  note?: null | string;
  price?: null | string;
  public_ip?: null | string;
  sort_order?: number;
  telegram_group_id?: null | number;
  telegram_group_query?: null | string;
  user_query?: null | string;
}

export async function updateDashboardCloudAssetApi(
  assetId: number,
  payload: DashboardCloudAssetUpdatePayload,
) {
  return requestClient.post<DashboardCloudAssetItem>(
    `/admin/cloud-assets/${assetId}/`,
    payload,
  );
}

export async function toggleDashboardCloudAssetAutoRenewApi(
  assetId: number,
  enabled: boolean,
) {
  return requestClient.post<DashboardCloudAssetItem>(
    `/admin/cloud-assets/${assetId}/auto-renew/`,
    { enabled },
  );
}

export async function deleteDashboardServerApi(serverId: number) {
  return requestClient.post<boolean>(`/admin/servers/${serverId}/delete/`);
}

export async function syncDashboardCloudAssetStatusApi(assetId: number) {
  return requestClient.post<DashboardCloudAssetSyncResult>(
    `/admin/cloud-assets/${assetId}/sync/`,
  );
}

export async function deleteDashboardCloudAssetApi(assetId: number) {
  return requestClient.post<boolean>(`/admin/cloud-assets/${assetId}/delete/`);
}

export async function rebuildDashboardServerPreserveLinkApi(serverId: number) {
  return requestClient.post<{
    accepted: boolean;
    message: string;
    order_id: number;
    order_no: string;
    replacement_for_id: number;
  }>(`/admin/servers/${serverId}/rebuild-preserve-link/`, undefined, {
    timeout: 120_000,
  });
}

export async function getDashboardCloudOrdersApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudOrderItem[]>('/admin/cloud-orders/', {
    params,
  });
}

export async function getDashboardCloudOrderDetailApi(orderId: number) {
  return requestClient.get<DashboardCloudOrderDetail>(
    `/admin/cloud-orders/${orderId}/`,
  );
}

export interface DashboardCloudOrderUpdatePayload {
  delete_at?: null | string;
  mtproxy_host?: null | string;
  mtproxy_link?: null | string;
  mtproxy_port?: null | number | string;
  pay_amount?: null | string;
  previous_public_ip?: null | string;
  provision_note?: null | string;
  public_ip?: null | string;
  server_name?: null | string;
  service_expires_at?: null | string;
  status?: string;
  suspend_at?: null | string;
  total_amount?: null | string;
  user_query?: null | string;
}

export async function updateDashboardCloudOrderApi(
  orderId: number,
  payload: DashboardCloudOrderUpdatePayload,
) {
  return requestClient.post<DashboardCloudOrderDetail>(
    `/admin/cloud-orders/${orderId}/`,
    payload,
  );
}

export async function updateDashboardCloudOrderStatusApi(
  orderId: number,
  payload: { status: string },
) {
  return requestClient.post<DashboardCloudOrderDetail>(
    `/admin/cloud-orders/${orderId}/status/`,
    payload,
  );
}

export async function deleteDashboardCloudOrderApi(orderId: number) {
  return requestClient.post<boolean>(`/admin/cloud-orders/${orderId}/delete/`);
}

export async function getDashboardServersApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardServerItem[]>('/admin/servers/', {
    params,
  });
}

export async function getDashboardCloudPlansApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudPlanItem[]>('/admin/cloud-plans/', {
    params,
  });
}

export async function getDashboardCloudPricingApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardCloudPricingItem[]>(
    '/admin/cloud-pricing/',
    { params },
  );
}

export async function syncDashboardCloudPlansApi() {
  return requestClient.post<DashboardCloudPlanSyncResult>(
    '/admin/cloud-plans/sync/',
    undefined,
    { timeout: 120_000 },
  );
}

export async function createDashboardCloudPlanApi(
  payload: DashboardCloudPlanUpdatePayload,
) {
  return requestClient.post<DashboardCloudPlanItem>(
    '/admin/cloud-plans/create/',
    payload,
  );
}

export async function updateDashboardCloudPlanApi(
  planId: number,
  payload: DashboardCloudPlanUpdatePayload,
) {
  return requestClient.post<DashboardCloudPlanItem>(
    `/admin/cloud-plans/${planId}/`,
    payload,
  );
}

export async function deleteDashboardCloudPlanApi(planId: number) {
  return requestClient.post(`/admin/cloud-plans/${planId}/delete/`);
}

export async function getDashboardSiteConfigsApi() {
  return requestClient.get<DashboardSiteConfigItem[]>(
    '/admin/settings/site-configs/',
  );
}

export async function getDashboardSiteConfigGroupsApi() {
  return requestClient.get<DashboardSiteConfigGroup[]>(
    '/admin/settings/site-configs/groups/',
  );
}

export async function updateDashboardSiteConfigApi(
  configId: number,
  payload: DashboardSiteConfigUpdatePayload,
) {
  return requestClient.post<DashboardSiteConfigItem>(
    `/admin/settings/site-configs/${configId}/`,
    payload,
  );
}

export async function initDashboardSiteConfigsApi(
  payload: { scope?: 'all' | 'configs' } = {},
) {
  return requestClient.post('/admin/settings/site-configs/init/', payload);
}

export async function startDashboardTotpBindApi(
  payload: { old_otp_token?: string } = {},
) {
  return requestClient.post<DashboardTotpStartResult>(
    '/admin/auth/totp/start',
    payload,
  );
}

export async function bindDashboardTotpApi(payload: { otp_token: string }) {
  return requestClient.post<DashboardTotpBindResult>(
    '/admin/auth/totp/bind',
    payload,
  );
}

export async function initDashboardTextConfigsApi(
  payload: { mode?: 'missing_only' | 'reset_defaults' } = {},
) {
  return requestClient.post<{ created: number; mode: string; updated: number }>(
    '/admin/settings/site-configs/init-texts/',
    payload,
  );
}

export async function getDashboardButtonConfigApi() {
  return requestClient.get<DashboardButtonConfig>('/admin/settings/buttons/');
}

export async function updateDashboardButtonConfigApi(
  payload: DashboardButtonConfig,
) {
  return requestClient.post<DashboardButtonConfig>(
    '/admin/settings/buttons/update/',
    payload,
  );
}

export async function initDashboardButtonConfigApi() {
  return requestClient.post<DashboardButtonConfig>(
    '/admin/settings/buttons/init/',
  );
}

export async function getDashboardCloudAccountsApi() {
  return requestClient.get<DashboardCloudAccountConfigItem[]>(
    '/admin/settings/cloud-accounts/',
  );
}

export async function createDashboardCloudAccountApi(
  payload: DashboardCloudAccountCreatePayload,
) {
  return requestClient.post<DashboardCloudAccountConfigItem>(
    '/admin/settings/cloud-accounts/create/',
    payload,
  );
}

export async function updateDashboardCloudAccountApi(
  accountId: number,
  payload: DashboardCloudAccountUpdatePayload,
) {
  return requestClient.post<DashboardCloudAccountConfigItem>(
    `/admin/settings/cloud-accounts/${accountId}/`,
    payload,
  );
}

export async function getDashboardCloudAccountDetailApi(accountId: number) {
  return requestClient.get<DashboardCloudAccountDetail>(
    `/admin/settings/cloud-accounts/${accountId}/`,
  );
}

export async function deleteDashboardCloudAccountApi(accountId: number) {
  return requestClient.post<boolean>(
    `/admin/settings/cloud-accounts/${accountId}/delete/`,
  );
}

export async function verifyDashboardCloudAccountApi(
  accountId: number,
  payload: { region?: string } = {},
) {
  return requestClient.post<{
    account: DashboardCloudAccountConfigItem;
    instance_count: number;
    provider: string;
    region: string;
    valid: boolean;
  }>(`/admin/settings/cloud-accounts/${accountId}/verify/`, payload);
}

export async function getDashboardTelegramAccountsApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardTelegramAccountsOverview>(
    '/admin/telegram/accounts/',
    { params },
  );
}

export async function createDashboardTelegramAccountApi(
  payload: DashboardTelegramLoginAccountCreatePayload,
) {
  return requestClient.post<DashboardTelegramLoginAccountItem>(
    '/admin/telegram/accounts/create/',
    payload,
  );
}

export async function checkDashboardTelegramAccountStatusApi(
  accountId: number,
) {
  return requestClient.post<DashboardTelegramLoginAccountItem>(
    `/admin/telegram/accounts/${accountId}/status/`,
  );
}

export async function updateDashboardTelegramAccountNotifyApi(
  accountId: number,
  payload: {
    listener_push_enabled?: boolean;
    notify_enabled?: boolean;
  },
) {
  return requestClient.post<DashboardTelegramLoginAccountItem>(
    `/admin/telegram/accounts/${accountId}/notify/`,
    payload,
  );
}

export async function startDashboardTelegramLoginApi(payload: {
  phone: string;
}) {
  return requestClient.post<{
    account: DashboardTelegramLoginAccountItem;
    account_id: number;
    next_step: string;
  }>('/admin/telegram/login/start/', payload);
}

export async function submitDashboardTelegramLoginCodeApi(payload: {
  account_id: number;
  code: string;
}) {
  return requestClient.post<{
    account: DashboardTelegramLoginAccountItem;
    account_id: number;
    next_step: string;
    requires_password?: boolean;
  }>('/admin/telegram/login/code/', payload);
}

export async function submitDashboardTelegramLoginPasswordApi(payload: {
  account_id: number;
  password?: string;
}) {
  return requestClient.post<{
    account: DashboardTelegramLoginAccountItem;
    account_id: number;
    next_step: string;
  }>('/admin/telegram/login/password/', payload);
}

export async function sendDashboardTelegramMessageApi(payload: {
  chat_id: number;
  login_account_id?: null | number;
  text: string;
}) {
  return requestClient.post<DashboardTelegramMessageItem>(
    '/admin/telegram/messages/send/',
    payload,
  );
}

export async function updateDashboardTelegramChatArchiveApi(payload: {
  archived: boolean;
  chat_id: number;
  title?: string;
}) {
  return requestClient.post<{ archived: boolean; chat_id: number }>(
    '/admin/telegram/chats/archive/',
    payload,
  );
}

export async function getDashboardTelegramGroupsApi(
  params: DashboardListQuery & { binding_only?: boolean } = {},
) {
  return requestClient.get<DashboardTelegramGroupFilterItem[]>(
    '/admin/telegram/groups/',
    { params },
  );
}

export async function createDashboardTelegramGroupApi(
  payload: DashboardTelegramGroupFilterPayload,
) {
  return requestClient.post<DashboardTelegramGroupFilterItem>(
    '/admin/telegram/groups/create/',
    payload,
  );
}

export async function updateDashboardTelegramGroupApi(
  groupId: number,
  payload: DashboardTelegramGroupFilterPayload,
) {
  return requestClient.post<DashboardTelegramGroupFilterItem>(
    `/admin/telegram/groups/${groupId}/`,
    payload,
  );
}

export async function getDashboardTelegramGroupDetailApi(groupId: number) {
  return requestClient.get<DashboardTelegramGroupDetail>(
    `/admin/telegram/groups/${groupId}/detail/`,
  );
}

export async function getDashboardTelegramMessagesApi(
  params: DashboardListQuery & {
    chat_id?: number;
    tg_user_id?: number;
    user_id?: number;
  } = {},
) {
  return requestClient.get<DashboardTelegramMessageItem[]>(
    '/admin/telegram/messages/',
    { params },
  );
}

export async function getDashboardAdminUsersApi() {
  return requestClient.get<DashboardAdminUserItem[]>(
    '/admin/settings/admin-users/',
  );
}

export async function createDashboardAdminUserApi(
  payload: DashboardAdminUserUpsertPayload,
) {
  return requestClient.post<DashboardAdminUserItem>(
    '/admin/settings/admin-users/create/',
    payload,
  );
}

export async function updateDashboardAdminUserApi(
  userId: number,
  payload: DashboardAdminUserUpsertPayload,
) {
  return requestClient.post<DashboardAdminUserItem>(
    `/admin/settings/admin-users/${userId}/`,
    payload,
  );
}

export async function deleteDashboardAdminUserApi(userId: number) {
  return requestClient.post<boolean>(
    `/admin/settings/admin-users/${userId}/delete/`,
  );
}

export async function changeDashboardMyPasswordApi(
  payload: DashboardChangePasswordPayload,
) {
  return requestClient.post<boolean>(
    '/admin/settings/password/change/',
    payload,
  );
}

export async function getDashboardServersStatisticsApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardServerStatisticsResponse>(
    '/admin/servers/statistics/',
    { params },
  );
}

export async function syncDashboardServersApi(
  region = 'cn-hongkong',
  awsRegion = 'all',
) {
  return requestClient.post(
    '/admin/servers/sync/',
    {
      region,
      aws_region: awsRegion,
    },
    { timeout: 300_000 },
  );
}

export async function getDashboardRechargesApi(
  params: DashboardListQuery = {},
) {
  return requestClient.get<DashboardRechargeItem[]>('/admin/recharges/', {
    params,
  });
}

export async function getDashboardRechargeDetailApi(rechargeId: number) {
  return requestClient.get<DashboardRechargeDetail>(
    `/admin/recharges/${rechargeId}/`,
  );
}

export async function updateDashboardRechargeStatusApi(
  rechargeId: number,
  payload: { status: string },
) {
  return requestClient.post<DashboardRechargeDetail>(
    `/admin/recharges/${rechargeId}/status/`,
    payload,
  );
}

export async function getDashboardMonitorsApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardMonitorItem[]>('/admin/monitors/', {
    params,
  });
}
