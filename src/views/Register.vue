<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="card w-full max-w-sm items-center justify-center">
      <div class="card w-full h-full items-center justify-center p-8">
        <!-- 用户名输入 -->
        <AuthInput
          v-model="form.username"
          icon-type="user"
          type="text"
          required
          placeholder="username"
          :pattern="patterns.username"
          :min-length="3"
          :max-length="30"
          title="Only letters, numbers or dash"
          @blur="validateField('username')"
        />
        <p v-if="errors.username" class="validator-hint text-error text-sm mt-1">{{ errors.username }}</p>
        <p v-else class="validator-hint text-sm mt-1">3-30位字母、数字或横线</p>

        <!-- 邮箱输入 -->
        <AuthInput
          v-model="form.email"
          icon-type="email"
          type="email"
          required
          placeholder="email"
          :pattern="patterns.email"
          :min-length="3"
          :max-length="50"
          @blur="validateField('email')"
          @input="clearError('email')"
        />
        <p v-if="errors.email" class="validator-hint text-error text-sm mt-1">{{ errors.email }}</p>
        <p v-else class="validator-hint text-sm mt-1">请输入有效的邮箱地址</p>

        <!-- 密码输入 -->
        <AuthInput
          v-model="form.password"
          icon-type="password"
          type="password"
          required
          placeholder="password"
          :min-length="8"
          :max-length="30"
          @input="validatePasswordStrength"
          @blur="validateField('password')"
        />
        <div class="w-full mt-2">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs">密码强度</span>
            <span class="text-xs font-medium" :class="strengthClass">{{ strengthText }}</span>
          </div>
          <progress 
            class="progress w-full h-2" 
            :class="progressBarClass"
            :value="passwordScore" 
            max="5"
          ></progress>
          <p v-if="errors.password" class="validator-hint text-error text-sm mt-1">{{ errors.password }}</p>
          <p v-else class="validator-hint text-sm mt-1">至少8位，包含字母和数字</p>
        </div>

        <!-- 确认密码 -->
        <AuthInput
          v-model="form.confirmPassword"
          icon-type="password"
          type="password"
          required
          placeholder="confirm password"
          :min-length="8"
          :max-length="30"
          @blur="validateField('confirmPassword')"
          @input="clearError('confirmPassword')"
        />
        <p v-if="errors.confirmPassword" class="validator-hint text-error text-sm mt-1">{{ errors.confirmPassword }}</p>

        <!-- 验证码 -->
        <div class="flex gap-2 mt-4">
          <AuthInput
            v-model="form.vericode"
            icon-type="vericode"
            type="text"
            required
            placeholder="verification code"
            pattern="[0-9]*"
            :min-length="6"
            :max-length="6"
            class="flex-1"
            @blur="validateField('vericode')"
          />
          <div class="form-control">
            <button 
              @click="sendVerificationCode" 
              class="btn btn-secondary"
              :disabled="isCountdownActive || loading.sendCode"
              :class="{ 'btn-disabled': isCountdownActive || loading.sendCode }"
            >
              <span v-if="loading.sendCode" class="loading loading-spinner loading-xs"></span>
              <span v-else-if="isCountdownActive">{{ countdown }}秒后重试</span>
              <span v-else>发送验证码</span>
            </button>
          </div>
        </div>
        <p v-if="errors.vericode" class="validator-hint text-error text-sm mt-1">{{ errors.vericode }}</p>
        <p v-else class="validator-hint text-sm mt-1">6位数字验证码</p>

        <!-- 注册按钮 -->
        <div class="form-control w-full mt-6">
          <button 
            class="btn btn-primary w-full" 
            @click="register"
            :disabled="!isFormValid || loading.register"
          >
            <span v-if="loading.register" class="loading loading-spinner loading-sm"></span>
            <span v-else>注册</span>
          </button>
        </div>

        <!-- 跳转到登录 -->
        <div class="text-center mt-4">
          <span class="text-sm opacity-75">已有账号？</span>
          <router-link to="/login" class="link link-hover text-primary text-sm font-semibold ml-1">
            立即登录
          </router-link>
        </div>
      </div>
    </div>

    <!-- DaisyUI Toast 提示 -->
    <div v-if="toast.show" class="toast toast-top toast-end z-50">
      <div :class="['alert', toast.type === 'success' ? 'alert-success' : 'alert-error']">
        <span>{{ toast.message }}</span>
        <button class="btn btn-ghost btn-xs" @click="toast.show = false">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthInput from '../components/AuthInput.vue'
import http from '../utils/http'
import { secureStorage } from '../utils/auth.js'

const router = useRouter()

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  vericode: ''
})

// 验证规则
const patterns = {
  username: '^[a-zA-Z0-9_-]{3,30}$',
  email: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
}

// 错误信息
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  vericode: ''
})

// 加载状态
const loading = reactive({
  register: false,
  sendCode: false
})

// 验证码倒计时
const isCountdownActive = ref(false)
const countdown = ref(60)

// Toast提示
const toast = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' 或 'error'
})

// 密码强度
const passwordScore = ref(0)
const strengthText = computed(() => {
  const texts = ['极弱', '弱', '一般', '强', '很强']
  return texts[passwordScore.value - 1] || '极弱'
})
const strengthClass = computed(() => {
  const classes = ['text-error', 'text-warning', 'text-warning', 'text-success', 'text-success']
  return classes[passwordScore.value - 1] || 'text-error'
})
const progressBarClass = computed(() => {
  const classes = ['progress-error', 'progress-warning', 'progress-warning', 'progress-success', 'progress-success']
  return classes[passwordScore.value - 1] || 'progress-error'
})

// 表单验证状态
const isFormValid = computed(() => {
  return (
    form.username &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    form.vericode &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.vericode &&
    form.password === form.confirmPassword
  )
})

// 字段验证函数
const validateField = (field) => {
  switch (field) {
    case 'username':
      if (!form.username) {
        errors.username = '用户名不能为空'
      } else if (!new RegExp(patterns.username).test(form.username)) {
        errors.username = '用户名只能包含字母、数字、下划线和横线（3-30位）'
      } else {
        errors.username = ''
      }
      break

    case 'email':
      if (!form.email) {
        errors.email = '邮箱不能为空'
      } else if (!new RegExp(patterns.email).test(form.email)) {
        errors.email = '请输入有效的邮箱地址（如 example@domain.com）'
      } else {
        errors.email = ''
      }
      break

    case 'password':
      if (!form.password) {
        errors.password = '密码不能为空'
      } else if (form.password.length < 8) {
        errors.password = '密码长度至少8位'
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
        errors.password = '密码必须包含字母和数字'
      } else {
        errors.password = ''
      }
      break

    case 'confirmPassword':
      if (!form.confirmPassword) {
        errors.confirmPassword = '请确认密码'
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致'
      } else {
        errors.confirmPassword = ''
      }
      break

    case 'vericode':
      if (!form.vericode) {
        errors.vericode = '验证码不能为空'
      } else if (!/^\d{6}$/.test(form.vericode)) {
        errors.vericode = '验证码必须是6位数字'
      } else {
        errors.vericode = ''
      }
      break
  }
}

// 清除错误
const clearError = (field) => {
  errors[field] = ''
}

// 密码强度检测
const validatePasswordStrength = () => {
  let score = 0
  const password = form.password
  
  if (!password) {
    passwordScore.value = 0
    return
  }
  
  // 长度得分
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // 字符类型得分
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  // 限制最高分
  passwordScore.value = Math.min(score, 5)
}

// 显示Toast
const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

// 发送验证码
const sendVerificationCode = async () => {
  // 先验证邮箱格式
  validateField('email')
  if (errors.email || !form.email) {
    showToast('请先输入有效的邮箱地址', 'error')
    return
  }

  loading.sendCode = true
  
  try {
    // 调用后端发送验证码接口
    const response = await http.post('/send-email-code', {
      email: form.email
    })
    
    if (response.status === 200) {
      showToast('验证码已发送到您的邮箱', 'success')
      startCountdown()
    } else {
      throw new Error(response.data?.message || '发送验证码失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    showToast(error.response?.data?.message || '发送验证码失败，请重试', 'error')
  } finally {
    loading.sendCode = false
  }
}

// 启动倒计时
const startCountdown = () => {
  isCountdownActive.value = true
  countdown.value = 60
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      isCountdownActive.value = false
      countdown.value = 60
    }
  }, 1000)
}

// 注册函数
const register = async () => {
  // 验证所有字段
  Object.keys(form).forEach(key => {
    if (key in errors) validateField(key)
  })
  
  // 检查是否有错误
  const hasErrors = Object.values(errors).some(error => error)
  if (hasErrors) {
    showToast('请检查表单中的错误', 'error')
    return
  }
  
  // 检查密码一致性
  if (form.password !== form.confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return
  }
  
  loading.register = true
  
  try {
    // 使用auth.js中的哈希函数
    const hashedPassword = secureStorage.hashPassword(form.password)
    
    // 调用注册接口
    const response = await http.post('/signup', {
      username: form.username,
      email: form.email,
      password: hashedPassword, // 传输哈希后的密码
      vericode: form.vericode
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.status === 200 || response.status === 201) {
      showToast('注册成功！正在跳转到登录页面...', 'success')
      
      // 2秒后跳转到登录页
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    } else {
      throw new Error(response.data?.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    showToast(error.response?.data?.message || '注册失败，请检查信息后重试', 'error')
  } finally {
    loading.register = false
  }
}

// 监听密码变化，实时验证确认密码
watch(() => form.password, () => {
  if (form.confirmPassword) {
    validateField('confirmPassword')
  }
})
</script>

<style scoped>
.validator-hint {
  margin-top: 4px;
  margin-bottom: 8px;
}

.progress {
  transition: all 0.3s ease;
}

.toast {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>