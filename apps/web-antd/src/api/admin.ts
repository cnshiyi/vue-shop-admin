import { requestClient } from '#/api/request';

interface DashboardListQuery {
  grouped?: 0 | 1;
  keyword?: string;
}

export interface DashboardSummary {
  cloud_orders_total: number;
  cloud_pending: number;
  monitors_total: number;
  orders_total: number;
  products_total: number;
  recharge_pending: number;
  recharges_total: number;
  users_total: number;
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

export interface DashboardOverview {
  latest_cloud_orders: LatestCloudOrder[];
  latest_recharges: LatestRecharge[];
  summary: DashboardSummary;
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
  tg_user_id: number;
  username: null | string;
  username_label: string;
  usernames: string[];
}

export interface DashboardCloudOrderItem {
  created_at: null | string;
  id: number;
  order_no: string;
  plan_name: string;
  provider: string;
  public_ip: null | string;
  region_label?: string;
  region_name: string;
  status: string;
  status_label?: string;
  total_amount: string;
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
  mtproxy_port: number;
  mtproxy_secret: null | string;
  paid_at: null | string;
  pay_amount: null | string;
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

export interface DashboardCloudAssetItem {
  actual_expires_at: null | string;
  asset_name: null | string;
  currency: string;
  days_left?: null | number;
  id: number;
  instance_id: null | string;
  is_active: boolean;
  server_id?: null | number;
  status: string;
  status_countdown?: string;
  status_label?: string;
  provider_status?: null | string;
  kind: string;
  mtproxy_host: null | string;
  mtproxy_link: null | string;
  mtproxy_port: null | number;
  mtproxy_secret: null | string;
  note?: null | string;
  order_id: null | number;
  order_no: string;
  price: string;
  provider: null | string;
  provider_label?: string;
  provider_resource_id: null | string;
  public_ip: null | string;
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

export interface DashboardCloudAssetGroup {
  default_expanded: boolean;
  items: DashboardCloudAssetItem[];
  tg_user_id: null | number;
  user_display_name: string;
  user_key: string;
  username_label: string;
}

export interface DashboardCloudAssetGroupedResponse {
  groups: DashboardCloudAssetGroup[];
  items: DashboardCloudAssetItem[];
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
  plan_description?: null | string;
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
  before_regions: Array<{ provider: string; region_code: string; region_name: string }>;
  provider_region_summary: Array<{
    pricing_count: number;
    provider: string;
    region_code: string;
    region_name: string;
  }>;
  regions: Array<{ provider: string; region_code: string; region_name: string }>;
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
  is_active?: boolean;
  memory?: string;
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
  value: string;
}

export interface DashboardSiteConfigItem {
  description?: string;
  id: number;
  is_sensitive: boolean;
  key: string;
  value: string;
  value_preview?: string;
}

export interface DashboardTaskItem {
  created_at: null | string;
  id: number;
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

export interface DashboardProductItem {
  content_image: null | string;
  content_text: null | string;
  content_type: string;
  content_video: null | string;
  created_at: null | string;
  description: null | string;
  id: number;
  is_active: boolean;
  name: string;
  price: string;
  sort_order: number;
  stock: number;
  updated_at: null | string;
}

export interface DashboardProductPayload {
  content_image?: null | string;
  content_text?: null | string;
  content_type: string;
  content_video?: null | string;
  description?: null | string;
  is_active: boolean;
  name: string;
  price: string;
  sort_order: number;
  stock: number;
}

export interface DashboardCloudAccountConfigItem {
  access_key: string;
  id: number;
  is_active: boolean;
  last_checked_at?: null | string;
  name: string;
  provider: string;
  provider_label?: string;
  region_hint?: null | string;
  secret_key: string;
  status?: null | string;
  status_label?: null | string;
  status_note?: null | string;
}

export interface DashboardSiteConfigGroupItem {
  description?: string;
  id: null | number;
  is_sensitive: boolean;
  key: string;
  value: string;
}

export interface DashboardSiteConfigGroup {
  group: string;
  items: DashboardSiteConfigGroupItem[];
}

export interface DashboardCloudAccountCreatePayload {
  access_key: string;
  is_active: boolean;
  name: string;
  provider: string;
  region_hint?: null | string;
  secret_key: string;
}

export interface DashboardCloudAccountUpdatePayload extends DashboardCloudAccountCreatePayload {}

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
  created_at: null | string;
  daily_expense: string;
  daily_expense_currency: string;
  daily_income: string;
  daily_income_currency: string;
  id: number;
  is_active: boolean;
  monitor_resources: boolean;
  monitor_transfers: boolean;
  remark: null | string;
  resource_checked_at: null | string;
  stats_date: null | string;
  tg_user_id: null | number;
  username: null | string;
}

export async function getDashboardOverviewApi() {
  return requestClient.get<DashboardOverview>('/admin/dashboard/overview/');
}

export async function getDashboardUsersApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardUserItem[]>('/admin/users/', { params });
}

export async function getDashboardTasksApi() {
  return requestClient.get<DashboardTaskItem[]>('/admin/tasks/');
}

export async function getDashboardProductsApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardProductItem[]>('/admin/products/', { params });
}

export async function createDashboardProductApi(payload: DashboardProductPayload) {
  return requestClient.post<{ id: number }>('/admin/products/create/', payload);
}

export async function updateDashboardProductApi(productId: number, payload: DashboardProductPayload) {
  return requestClient.post<{ id: number }>(`/admin/products/${productId}/`, payload);
}

export async function updateDashboardUserBalanceApi(userId: number, payload: { balance: string; balance_trx: string }) {
  return requestClient.post(`/admin/users/${userId}/balance/`, payload);
}

export async function updateDashboardUserDiscountApi(userId: number, payload: { cloud_discount_rate: string }) {
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
  return requestClient.get<DashboardUserBalanceDetailsResponse>(`/admin/users/${userId}/balance-details/`);
}

export async function getDashboardCloudAssetsApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardCloudAssetItem[]>('/admin/cloud-assets/', { params });
}

export async function getDashboardCloudAssetsGroupedApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardCloudAssetGroupedResponse>('/admin/cloud-assets/', {
    params: { ...params, grouped: 1 },
  });
}

export async function syncDashboardCloudAssetsApi(region = 'cn-hongkong') {
  return requestClient.post('/admin/cloud-assets/sync/', { region });
}

export async function updateDashboardCloudAssetApi(assetId: number, payload: Record<string, any>) {
  return requestClient.post(`/admin/cloud-assets/${assetId}/`, payload);
}

export async function deleteDashboardServerApi(serverId: number) {
  return requestClient.post<boolean>(`/admin/servers/${serverId}/delete/`);
}

export async function getDashboardCloudOrdersApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardCloudOrderItem[]>('/admin/cloud-orders/', { params });
}

export async function getDashboardCloudOrderDetailApi(orderId: number) {
  return requestClient.get<DashboardCloudOrderDetail>(`/admin/cloud-orders/${orderId}/`);
}

export async function updateDashboardCloudOrderStatusApi(orderId: number, payload: { status: string }) {
  return requestClient.post<DashboardCloudOrderDetail>(`/admin/cloud-orders/${orderId}/status/`, payload);
}

export async function getDashboardServersApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardServerItem[]>('/admin/servers/', { params });
}

export async function getDashboardCloudPlansApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardCloudPlanItem[]>('/admin/cloud-plans/', { params });
}

export async function getDashboardCloudPricingApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardCloudPricingItem[]>('/admin/cloud-pricing/', { params });
}

export async function syncDashboardCloudPlansApi() {
  return requestClient.post<DashboardCloudPlanSyncResult>('/admin/cloud-plans/sync/');
}

export async function createDashboardCloudPlanApi(payload: DashboardCloudPlanUpdatePayload) {
  return requestClient.post<DashboardCloudPlanItem>('/admin/cloud-plans/create/', payload);
}

export async function updateDashboardCloudPlanApi(planId: number, payload: DashboardCloudPlanUpdatePayload) {
  return requestClient.post<DashboardCloudPlanItem>(`/admin/cloud-plans/${planId}/`, payload);
}

export async function deleteDashboardCloudPlanApi(planId: number) {
  return requestClient.post(`/admin/cloud-plans/${planId}/delete/`);
}

export async function getDashboardSiteConfigsApi() {
  return requestClient.get<DashboardSiteConfigItem[]>('/admin/settings/site-configs/');
}

export async function getDashboardSiteConfigGroupsApi() {
  return requestClient.get<DashboardSiteConfigGroup[]>('/admin/settings/site-configs/groups/');
}

export async function updateDashboardSiteConfigApi(configId: number, payload: DashboardSiteConfigUpdatePayload) {
  return requestClient.post<DashboardSiteConfigItem>(`/admin/settings/site-configs/${configId}/`, payload);
}

export async function initDashboardSiteConfigsApi() {
  return requestClient.post('/admin/settings/site-configs/init/');
}

export async function getDashboardCloudAccountsApi() {
  return requestClient.get<DashboardCloudAccountConfigItem[]>('/admin/settings/cloud-accounts/');
}

export async function createDashboardCloudAccountApi(payload: DashboardCloudAccountCreatePayload) {
  return requestClient.post<DashboardCloudAccountConfigItem>('/admin/settings/cloud-accounts/create/', payload);
}

export async function updateDashboardCloudAccountApi(accountId: number, payload: DashboardCloudAccountUpdatePayload) {
  return requestClient.post<DashboardCloudAccountConfigItem>(`/admin/settings/cloud-accounts/${accountId}/`, payload);
}

export async function deleteDashboardCloudAccountApi(accountId: number) {
  return requestClient.post<boolean>(`/admin/settings/cloud-accounts/${accountId}/delete/`);
}

export async function verifyDashboardCloudAccountApi(accountId: number, payload: { region?: string } = {}) {
  return requestClient.post<{ account: DashboardCloudAccountConfigItem; instance_count: number; provider: string; region: string; valid: boolean }>(`/admin/settings/cloud-accounts/${accountId}/verify/`, payload);
}

export async function getDashboardServersStatisticsApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardServerStatisticsResponse>('/admin/servers/statistics/', { params });
}

export async function syncDashboardServersApi(region = 'cn-hongkong', awsRegion = 'ap-southeast-1') {
  return requestClient.post('/admin/servers/sync/', { region, aws_region: awsRegion });
}

export async function getDashboardRechargesApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardRechargeItem[]>('/admin/recharges/', { params });
}

export async function getDashboardRechargeDetailApi(rechargeId: number) {
  return requestClient.get<DashboardRechargeDetail>(`/admin/recharges/${rechargeId}/`);
}

export async function updateDashboardRechargeStatusApi(rechargeId: number, payload: { status: string }) {
  return requestClient.post<DashboardRechargeDetail>(`/admin/recharges/${rechargeId}/status/`, payload);
}

export async function getDashboardMonitorsApi(params: DashboardListQuery = {}) {
  return requestClient.get<DashboardMonitorItem[]>('/admin/monitors/', { params });
}
