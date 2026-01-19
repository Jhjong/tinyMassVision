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
    active: true,
    identity: null               // 默认身份
  }
  
  return api.post('/user_signup', payload)
}

// 发送验证码接口
export async function sendEmailCode(email) {
  const payload = {
    email: email,
    // send_time 是可选的，可以不传或传当前时间
    send_time: new Date().toISOString()
  }
  
  return api.post('/emailrequest', payload)
}

// 获取当前用户信息
export async function getCurrentUser() {
  return api.get('/user')
}

export default api