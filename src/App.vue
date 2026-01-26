<template>
  <div class="flex flex-col min-h-screen">
    <Navbar />
    <div class="flex flex-1 items-center justify-center p-[clamp(0.5rem,10vw,2rem)]">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue'
</script>
