<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
    <!-- Login box card -->
    <div class="card w-full bg-base-100 items-center justify-center">
      <!-- Inner card for login form -->
      <div class="flex-left card  w-full h-full items-center">
        <!-- Username input -->
        <AuthInput
          v-model="formData.username"
          icon-type="user"
          type="text"
          required
          placeholder="username"
          :error="errors.username"
          @blur="validateField('username')"
          @focus="clearError('username')"
          class="w-full"
        />
        <br />
        
        <!-- Password input -->
        <AuthInput
          v-model="formData.password"
          icon-type="password"
          type="password"
          required
          placeholder="password"
          :error="errors.password"
          @blur="validateField('password')"
          @focus="clearError('password')"
        />
        <br />
        
        <!-- Sign In button -->
        <button 
          class="btn btn-primary w-full"
          @click="handleSubmit"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm mr-2"></span>
          Sign In
        </button>
        
        <div class="text-center mt-4">
          <span class="text-sm opacity-75">New to BionetServer?</span>
          <router-link to="/register" class="link link-hover text-primary text-sm font-semibold">
            Create an account
          </router-link>
        </div>
      </div>
    </div>

    <!-- 简化Toast提示 -->
    <div v-if="toast.show" class="toast toast-top toast-end">
      <div :class="['alert', toast.type === 'success' ? 'alert-success' : 'alert-error', 'shadow-lg']">
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthInput from '@/components/AuthInput.vue'
import { login } from '@/utils/usr-api'
import { useUserStore } from '@/stores/user'
import type { UsrLogin } from '@/types/usr'

const router = useRouter()
const userStore = useUserStore()

// 响应式表单数据
const formData = reactive<UsrLogin>({
  username: '',
  password: ''
})

// 表单验证错误
const errors = reactive({
  username: '',
  password: ''
})

// 提交状态
const isSubmitting = ref(false)

// Toast通知
const toast = reactive({
  show: false,
  message: '',
  type: 'error' as 'success' | 'error'
})

/**
 * 显示Toast通知
 */
const showToast = (message: string, type: 'success' | 'error' = 'error') => {
  toast.message = message
  toast.type = type
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

/**
 * 清除指定字段的错误
 */
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}

/**
 * 验证单个字段
 */
const validateField = (field: keyof typeof errors) => {
  switch (field) {
    case 'username':
      if (!formData.username.trim()) {
        errors.username = 'Username is required'
      } else {
        errors.username = ''
      }
      break
      
    case 'password':
      if (!formData.password) {
        errors.password = 'Password is required'
      } else {
        errors.password = ''
      }
      break
  }
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  console.log('Login attempt for user:', formData.username)
  
  // 验证所有字段
  Object.keys(formData).forEach(key => {
    if (key in errors) validateField(key as keyof typeof errors)
  })
  
  const firstError = Object.values(errors).find(error => error)
  if (firstError) {
    console.warn('Form validation failed:', firstError)
    showToast(firstError, 'error')
    return
  }
  
  isSubmitting.value = true
  console.log('Submitting login request...')
  
  try {
    const response = await login(formData)
    console.log('Login response:', response.status, response.data)
    
    if (response.status === 200) {
      const { access_token } = response.data
      console.log('Login successful, token received')
      
      localStorage.setItem('jwtToken', access_token)
      console.log('Token stored in localStorage')
      
      // 获取用户信息
      const { getCurrentUser } = await import('@/utils/usr-api')
      const userResponse = await getCurrentUser()
      console.log('User info retrieved:', userResponse.data)
      
      // 更新Pinia store
      userStore.setUser({
        username: userResponse.data.username,
        email: userResponse.data.email || ''
      })
      
      console.log('User store updated')
      showToast('Login successful!', 'success')
      
      const redirectPath = router.currentRoute.value.query.redirect as string || '/dashboard'
      console.log('Redirecting to:', redirectPath)
      
      setTimeout(() => {
        router.replace(redirectPath)
      }, 500)
      
    } else {
      console.warn('Login failed with status:', response.status)
      throw new Error('Login failed')
    }
    
  } catch (error: unknown) { // 使用unknown替代any
    console.error('Login failed:', error)
    
    let errorMessage = 'Invalid username or password'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    showToast(errorMessage, 'error')
    formData.password = ''
  } finally {
    isSubmitting.value = false
    console.log('Login submission finished')
  }
}
</script>