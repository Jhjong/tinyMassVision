<template>
    <div class="card max-w-lg w-full flex flex-col gap-6">
        <!-- 用户名输入 -->
        <AuthInput
          v-model="form.username"
          icon-type="user"
          type="text"
          required placeholder="username: only letters, numbers"
          :pattern="patterns.username"
          :min-length="3"
          :max-length="30"
          title="Only letters, numbers or dash"
          @blur="validateField('username')"
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
          @blur="validateField('email')"
          @input="clearError('email')"
        />

        <!-- 密码输入 -->
        <AuthInput
          v-model="form.password"
          icon-type="password"
          type="password"
          required placeholder="password"
          :min-length="8"
          :max-length="30"
          @input="validatePasswordStrength"
          @blur="validateField('password')"
        >
        <progress class="flex progress"
          :class="progressBarClass"
          :value="passwordScore" max="5">
        </progress>
        </AuthInput>

        <!-- 确认密码 -->
        <AuthInput
          v-model="form.confirmPassword"
          icon-type="password"
          type="password"
          required placeholder="confirm password"
          :min-length="8"
          :max-length="30"
          @blur="validateField('confirmPassword')"
          @input="clearError('confirmPassword')"
        />

        <!-- 验证码 -->
        <div class="flex w-full gap-6">
          <AuthInput
            v-model="form.verify_code"
            icon-type="vericode"
            type="text"
            required placeholder="verification code"
            pattern="[0-9]*"
            :min-length="6"
            :max-length="6"
            class="flex-1"
            @blur="validateField('vericode')"
          />
          <div class="form-control">
            <button @click="sendVerificationCode" class="btn btn-secondary"
              :disabled="isCountdownActive || loading.sendCode"
              :class="{ 'btn-disabled': isCountdownActive || loading.sendCode }">
              <span v-if="loading.sendCode" class="loading loading-spinner loading-xs"></span>
              <span v-else-if="isCountdownActive">Retry in {{ countdown }} seconds</span>
              <span v-else>Send</span>
            </button>
          </div>
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
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthInput from '../components/AuthInput.vue'
import { usrSignup, sendEmailCode } from '@/utils/usr-api'

const router = useRouter()

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verify_code: ''
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
  const texts = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  return texts[passwordScore.value - 1] || 'Very weak'
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
    form.verify_code &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.vericode &&
    form.password === form.confirmPassword
  )
})

// 字段验证函数
const validateField = (field: keyof typeof errors) => {
  switch (field) {
    case 'username':
      console.error(errors.username+' ')
      if (!form.username) {
        errors.username = 'Username is required'
      } else if (!new RegExp(patterns.username).test(form.username)) {
        errors.username = 'Username is invalid'
      } else {
        errors.username = ''
      }
      break

    case 'email':
      if (!form.email) {
        errors.email = 'Email address is required'
      } else if (!new RegExp(patterns.email).test(form.email)) {
        errors.email = 'Please enter a valid email address (e.g., example@domain.com)'
      } else {
        errors.email = ''
      }
      console.error(errors.email)
      break

    case 'password':
      if (!form.password) {
        errors.password = 'Password is required'
      } else if (form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
        errors.password = 'Password must contain both letters and numbers'
      } else {
        errors.password = ''
      }
      break

    case 'confirmPassword':
      if (!form.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      } else {
        errors.confirmPassword = ''
      }
      break

    case 'vericode':
      if (!form.verify_code) {
        errors.vericode = 'Verification code is required'
      } else if (!/^\d{6}$/.test(form.verify_code)) {
        errors.vericode = 'Verification code must be 6 digits'
      } else {
        errors.vericode = ''
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
const showToast = (message: string, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true

  setTimeout(() => { toast.show = false }, 3000)
}

// 发送验证码
const sendVerificationCode = async () => {

  validateField('email')

  if (errors.email || !form.email) {
    showToast('Please enter a valid email address first', 'error')
    return
  }

  loading.sendCode = true

  try {
    // 调用接口
    const response = await sendEmailCode(form.email)

    if (response.status === 200) {
      showToast('Verification code has been sent to your email', 'success')
      startCountdown()
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
  Object.keys(form).forEach(
    key => {
      if (key in errors) validateField(key as keyof typeof errors)
    }
  )

  // 检查是否有错误
  const hasErrors = Object.values(errors).some(error => error)
  if (hasErrors) {
    showToast('Please fix errors in the form', 'error')
    return
  }

  // 检查密码一致性
  if (form.password !== form.confirmPassword) {
    showToast('Passwords do not match', 'error')
    return
  }

  loading.register = true

  try {
      // 调用注册接口
      const response = await usrSignup({
        username: form.username,
        email: form.email,
        password: form.password,
        verify_code: form.verify_code,
        identity: null, // must be null
        active: true // always active
      })

      if (response.status === 200 || response.status === 201) {
        showToast('Registration successful! Redirecting to login page...', 'success')
        // 2秒后跳转到登录页
        setTimeout(() => {router.replace('/login')}, 2000)
      } else {
        throw new Error(response.data?.message || 'Registration failed')
      }

      } catch (error) { // 注册失败处理
        if (error instanceof Error) {
          const errorDetail = error?.message || 'Registration failed, please check your information and try again'
          showToast(errorDetail, 'error')
        } else {
          console.error('Unknown error:', error)
          showToast('An unknown error occurred, please try again', 'error')
        }
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
