<template>
    <div class="card max-w-lg w-full flex flex-col gap-6">
        <!-- 用户名输入 -->
        <AuthInput
          v-model="form.username"
          icon-type="user"
          type="text"
          required placeholder="username"
          :pattern="patterns.username"
          :min-length="3"
          :max-length="30"
          :error="errors.username"
          @blur="validateField('username')"
          @focus="clearError('username')"
        />

        <!-- 邮箱输入 -->
        <!-- @input="clearError('email')" />  没起到效果啊-->
        <AuthInput
          v-model="form.email"
          icon-type="email"
          type="email"
          required placeholder="mail@site.com"
          :pattern="patterns.email"
          :min-length="3"
          :max-length="50"
          :error="errors.email"
          @blur="validateField('email')"
          @focus="clearError('email')"
        />

        <!-- 密码输入 -->
        <AuthInput
          v-model="form.password"
          icon-type="password"
          type="password"
          required placeholder="password"
          :min-length="8"
          :max-length="25"
          :error="errors.password"
          @input="validatePasswordStrength"
          @focus="clearError('password')"
          @blur="validateField('password')"
        >
        <progress :value="passwordScore" class="flex progress" :class="progressBarClass" max="5" />
        </AuthInput>

        <!-- 确认密码 -->
        <AuthInput
          v-model="form.confirm_password"
          icon-type="password"
          type="password"
          required placeholder="confirm password"
          :min-length="8"
          :max-length="25"
          :error="errors.confirm_password"
          @blur="validateField('confirm_password')"
          @focus="clearError('confirm_password')"
        />

        <!-- 验证码 -->
        <div class="flex w-full ">
          <div class="form-control flex-5 mr-10">
            <AuthInput
              v-model="form.verify_code"
              icon-type="verify_code"
              type="text"
              required placeholder="verification code"
              :pattern="patterns.verify_code"
              :min-length="6"
              :max-length="7"
              :error="errors.verify_code"
              @blur="validateField('verify_code')"
              @focus="clearError('verify_code')"
            />
          </div>
          <div class="form-control ml-auto">
            <button
              @click="sendVerificationCode"
              class="btn btn-secondary flex-1"
              :disabled="isCountdownActive || loading.sendCode"
              :class="{ 'btn-disabled': isCountdownActive || loading.sendCode }">
              <span v-if="loading.sendCode" class="loading loading-spinner loading-xs"></span>
              <span v-else-if="isCountdownActive"> {{ countdown }}s</span>
              <span v-else>Send</span>
            </button>
          </div><!-- 固定宽度 -->
        </div>

        <!-- 注册按钮 -->
        <div class="form-control w-full mt-6">
          <button class="btn btn-primary w-full"
            @click="register"
            :disabled="!isFormValid || loading.register">
            <span v-if="loading.register" class="loading loading-spinner loading-sm"></span>
            <span v-else>Sign Up</span>
          </button>
        </div>

        <!-- 跳转到登录 -->
        <div class="text-center mt-4">
          <span class="text-sm opacity-75">Already have an account?</span>
          <router-link to="/login" class="link link-hover text-primary text-sm font-semibold ml-1">
            Sign in now
          </router-link>
        </div>
    </div> <!-- Card 结尾 -->

    <!-- DaisyUI Toast 提示 -->
    <div v-if="toast.show" class="toast toast-top toast-end z-50">
      <div :class="['alert', toast.type === 'success' ? 'alert-success' : 'alert-error']">
        <span>{{ toast.message }}</span>
        <button class="btn btn-ghost btn-xs" @click="toast.show = false">x</button>
      </div>
    </div>

</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthInput from '../components/AuthInput.vue'
import { usrSignup, sendEmailCode } from '@/utils/usr-api'
import { useCountdown } from '@/utils/useCountdown'

const router = useRouter()
// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  verify_code: ''
})

// 验证规则
const patterns = {
  username: '^[a-zA-Z][a-zA-Z0-9_-]{2,29}$', // 以字母开头，3-30个字符
  email: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  password: '^(?=.*[a-zA-Z])(?=.*\\d).{8,25}$',
  verify_code: '^[0-9]{6}$'
}

// 错误信息
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  verify_code: ''
})

// 加载状态
const loading = reactive({
  register: false,
  sendCode: false
})

// 验证码倒计时
// 使用带存储键的倒计时Hook
const {
  count: countdown,
  isActive: isCountdownActive,
  start: startCountdown,
} = useCountdown(60, 'verify_code_countdown')

// Toast提示
const toast = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' 或 'error'
})

// 密码强度
const passwordScore = ref(0)

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
    form.confirm_password &&
    form.verify_code &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirm_password &&
    !errors.verify_code &&
    form.password === form.confirm_password
  )
})

// 字段验证函数
const validateField = (field: keyof typeof errors) => {
  switch (field) {
    case 'username':
      if (!form.username) {
        errors.username = 'Username is required'
      }
      else if (!new RegExp(patterns.username).test(form.username)) {
        errors.username = `Username is invalid:
                          * must be 3-30 characters long
                          * contain only letters, numbers, dash`
      }
      else {
        errors.username = ''
      }
      break

    case 'email':
      if (!form.email) {
        errors.email = 'Email address is required'
      }
      else if (!new RegExp(patterns.email).test(form.email)) {
        errors.email = `Please enter a valid email address
                        (e.g., example@domain.com)`
      }
      else {
        errors.email = ''
      }
      console.error(errors.email)
      break

    case 'password':
      if (!form.password) {
        errors.password = 'Password is required'
      }
      else if (!new RegExp(patterns.password).test(form.password)) {
        errors.password = `Password is invalid:
                          * must be 8-25 characters long
                          * contain both letters and numbers`
      } else {
        errors.password = ''
      }
      break

    case 'confirm_password':
      if (!form.confirm_password) {
        errors.confirm_password = 'Please confirm your password'
      } else if (form.password !== form.confirm_password) {
        errors.confirm_password = 'Passwords do not match'
      } else {
        errors.confirm_password = ''
      }
      break

    case 'verify_code':
      if (!form.verify_code) {
        errors.verify_code = 'Verification code is required'
      } else if (!new RegExp(patterns.verify_code).test(form.verify_code)) {
        errors.verify_code = 'Verification code must be 6 digits'
      } else {
        errors.verify_code = ''
      }
      break
  }
}

// 清除错误
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}

// 密码强度检测
const validatePasswordStrength = () => {
  console.log('Validating password strength for:', form.password ? `[${form.password.length} chars]` : 'empty')
  
  let score = 0
  const password = form.password

  if (!password) {
    passwordScore.value = 0
    console.log('Password empty, score: 0')
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
  console.log('Password strength score:', passwordScore.value)
}

// 显示Toast
const showToast = (message: string, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true

  setTimeout(() => { toast.show = false }, 3000)
}

// 发送验证码
const sendVerificationCode = async () => {

  // 验证所有必填字段
  const requiredFields: Array<keyof typeof errors> = ['username', 'email', 'password']
  let hasErrors = false
  
  requiredFields.forEach(field => {
    validateField(field)
    if (errors[field]) hasErrors = true
  })
  
  if (hasErrors) {
    showToast('Please complete all required fields correctly', 'error')
    return
  }
  
  // 验证密码强度
  if (passwordScore.value < 3) {
    showToast('Password strength should be at least Fair', 'warning')
    return
  }
  
  // 验证密码一致性
  if (form.password !== form.confirm_password) {
    showToast('Passwords do not match', 'error')
    return
  }

  loading.sendCode = true

  try {
    const response = await sendEmailCode(form.email)
    
    if (response.status === 200) {
      console.log('Verification code sent successfully to:', form.email)
      showToast('Verification code has been sent to your email', 'success')
      startPersistentCountdown() // 这会自动处理持久化
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to send verification code:', error)
      showToast(error.message || 'Failed to send verification code, please try again', 'error')
    } else {
      console.error('Unknown error:', error)
      showToast('An unknown error occurred, please try again', 'error')
    }
  } finally {
    loading.sendCode = false
  }
}

// 启动倒计时
const startPersistentCountdown = () => {
  const endTime = Date.now() + 60 * 1000
  localStorage.setItem('countdown_end', endTime.toString())
  startCountdown()
}

// 注册函数
const register = async () => {
  console.log('Registration attempt started')
  console.log('Form data:', { ...form, password: '[HIDDEN]', confirm_password: '[HIDDEN]' })
  
  // 验证所有字段
  Object.keys(form).forEach(
    key => {
      if (key in errors) validateField(key as keyof typeof errors)
    }
  )
  
  const hasErrors = Object.values(errors).some(error => error)
  if (hasErrors) {
    console.warn('Form has validation errors:', errors)
    showToast('Please fix errors in the form', 'error')
    return
  }
  
  if (form.password !== form.confirm_password) {
    console.warn('Password mismatch')
    showToast('Passwords do not match', 'error')
    return
  }
  
  loading.register = true
  console.log('Calling registration API...')

  try {
    const response = await usrSignup({
      username: form.username,
      email: form.email,
      password: form.password,
      verify_code: form.verify_code,
      identity: null,
      active: true
    })
    
    console.log('Registration API response:', response.status, response.data)
    
    if (response.status === 200 || response.status === 201) {
      console.log('Registration successful, redirecting to login')
      showToast('Registration successful! Redirecting to login page...', 'success')
      
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    } else {
      console.warn('Registration failed with status:', response.status)
      throw new Error(response.data?.message || 'Registration failed')
    }
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorDetail = error.message || 'Registration failed, please check your information and try again'
      showToast(errorDetail, 'error')
    } else {
      console.error('Unknown error:', error)
      showToast('An unknown error occurred, please try again', 'error')
    }
  } finally {
    loading.register = false
    console.log('Registration attempt finished')
  }
}

// 监听密码变化，实时验证确认密码
watch(() => form.password, () => {
  if (form.confirm_password) {
    validateField('confirm_password')
  }
})

// 组件挂载时恢复状态
onMounted(() => {
  console.log('Countdown initialized, current count:', countdown.value)
  console.log('Countdown active:', isCountdownActive.value)
})
</script>

<style scoped>
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
