<script setup lang="ts">
import BrandLogo from '@/components/brand/BrandLogo.vue'
import NotificationButton, { type SystemNotification } from './NotificationButton.vue'
import UserMenu from './UserMenu.vue'
defineProps<{ userName: string; notifications: SystemNotification[]; context?: string[] }>()
const emit = defineEmits<{ logout: [] }>()
</script>
<template>
  <header class="app-header">
    <BrandLogo header-variant />
    <div v-if="context?.length" class="header-context" aria-label="Contexto de trabajo"><span v-for="item in context" :key="item">{{ item }}</span></div>
    <div class="app-header__actions"><NotificationButton :notifications="notifications" /><span class="header-divider" /><UserMenu :user-name="userName" @logout="emit('logout')" /></div>
  </header>
</template>
