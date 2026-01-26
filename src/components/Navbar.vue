<template>
  <div class="navbar bg-base-100 shadow-sm">
    <!-- start -->
    <div class="navbar-start">
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
          <!-- 未登录时显示登录链接 -->
          <li v-if="!userStore.isAuthenticated">
            <router-link to="/login">Login</router-link>
          </li>
          
          <!-- 通用链接 -->
          <li><router-link to="/dashboard">Dashboard</router-link></li>
          
          <!-- 已登录时显示登出选项 -->
          <li v-if="userStore.isAuthenticated">
            <a @click="handleLogout" class="text-error hover:text-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- center -->
    <div class="navbar-center">
      <router-link to="/" class="btn btn-ghost text-xl">MassVision</router-link>
    </div>

    <!-- end -->
    <div class="navbar-end gap-4">
      <div v-if="userStore.isAuthenticated" class="flex items-center gap-2">
        <div class="avatar placeholder">
          <div class="bg-neutral text-neutral-content rounded-full w-8">
            <span class="text-xs">{{ userStore.userInitial }}</span>
          </div>
        </div>
        <span class="font-medium hidden sm:inline">{{ userStore.user?.username }}</span>
      </div>
      <input type="checkbox" value="dark" class="toggle theme-controller" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()

// 登出处理
const handleLogout = () => {
  console.log('Logout requested by user')
  if (confirm('Are you sure you want to logout?')) {
    console.log('User confirmed logout')
    console.log('Before logout - Token exists:', !!localStorage.getItem('jwtToken'))
    console.log('Before logout - User store:', userStore.user)
    
    userStore.logout()
    
    console.log('After logout - Token exists:', !!localStorage.getItem('jwtToken'))
    console.log('After logout - User store:', userStore.user)
    console.log('Redirecting to login page')
    
    router.push('/login')
  } else {
    console.log('Logout cancelled by user')
  }
}

onMounted(() => {
  console.log('Navbar mounted, restoring user from localStorage')
  userStore.restoreUser()
  console.log('User restored:', userStore.user)
})
</script>