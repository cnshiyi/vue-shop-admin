import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    expiresIn?: number;
  }

  export interface RefreshTokenResult {
    data: LoginResult;
    status: number;
  }

  export interface GitHubStartResult {
    authorizeUrl: string;
  }

  export interface GitHubCallbackParams {
    code: string;
    redirectUri: string;
    state: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

export async function githubLoginStartApi(redirectUri: string) {
  return requestClient.post<AuthApi.GitHubStartResult>('/auth/github/start', {
    redirectUri,
  });
}

export async function githubLoginCallbackApi(
  data: AuthApi.GitHubCallbackParams,
) {
  return requestClient.post<AuthApi.LoginResult>('/auth/github/callback', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
