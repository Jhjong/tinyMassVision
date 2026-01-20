import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 JWT 令牌
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 登录接口 - 使用 x-www-form-urlencoded 格式
export async function login(username, password) {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  params.append('grant_type', 'password')
  
  return api.post('/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

// 注册接口
export async function userSignup(userData) {
  const payload = {
    username: userData.username,
    email: userData.email,
    password: userData.password,
    verify_code: userData.vericode,
    // 移除 active 字段，交由后端根据业务逻辑（如邮箱验证）设置
  }
  
  return api.post('/user_signup', payload)
}

// 发送验证码接口
export async function sendEmailCode(email) {
  const payload = {
    email: email,
    // 移除 send_time 字段，由后端服务器自动生成当前时间
  }
  
  return api.post('/emailrequest', payload)
}

// 获取当前用户信息
export async function getCurrentUser() {
  return api.get('/user')
}

export default api