import axios, { AxiosError } from 'axios';


// 响应拦截器

// 响应错误定义
interface FastAPIError {
  loc: string[];
  msg: string;
  type: string;
}

interface ErrorResponse {
  detail: FastAPIError[] | string;
}

function formatErrorMessage(detail: FastAPIError[] | string): string {
  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const loc = item.loc.slice(1).join('.'); // 去掉 "body" 等前缀
      return `${loc}: ${item.msg}`;
    }).join('；');
  }

  return 'Response Failed';
}

const error_catch = (error: AxiosError<ErrorResponse>) => {
  if (error.response?.data) {
    const { detail } = error.response.data;
    // 格式化错误信息
    const errorMessage = formatErrorMessage(detail);
    // 提示报错
    console.error('API Error:', errorMessage);
    // 替换错误信息
    error.message = errorMessage;
  }
  return Promise.reject(error);
}

// 认证api
const auth_api = axios.create({baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:9000',});

//认证api token 注入
auth_api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

auth_api.interceptors.response.use(
  (response) => response,
  error_catch
);

//无认证api
const api = axios.create({baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:9000',});


export {auth_api, api};
