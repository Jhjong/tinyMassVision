import { defineStore } from 'pinia'
import type { User } from '@/types/usr'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const user = ref<User | null>(null)
  
  // 登录状态
  const isAuthenticated = computed(() => !!user.value)
  
  // 用户初始（用于头像显示）
  const userInitial = computed(() => {
    return user.value?.username?.charAt(0).toUpperCase() || ''
  })
  
  // 设置用户信息
  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  // 登出 - 新增方法
  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('jwtToken')
    // 清除其他可能的认证相关数据
    localStorage.removeItem('countdown_end')
  }
  
  // 从localStorage恢复用户信息
  const restoreUser = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        user.value = JSON.parse(userStr)
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
        logout() // 解析失败时清除所有数据
      }
    }
  }
  
  return {
    user,
    isAuthenticated,
    userInitial,
    setUser,
    logout, // 导出登出方法
    restoreUser,
  }
})