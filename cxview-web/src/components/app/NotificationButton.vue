<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Popover from 'primevue/popover'

export interface SystemNotification { id: number; title: string; message: string; time: string; unread?: boolean }
defineProps<{ notifications: SystemNotification[] }>()
const popover = ref<InstanceType<typeof Popover> | null>(null)
</script>

<template>
  <Button v-tooltip.bottom="'Notificaciones'" rounded text severity="secondary" aria-label="Abrir notificaciones" class="header-icon-button" @click="popover?.toggle($event)">
    <i class="pi pi-bell notification-bell" aria-hidden="true" />
    <span v-if="notifications.some((item) => item.unread)" class="notification-dot" aria-label="Tienes notificaciones nuevas" />
  </Button>
  <Popover ref="popover" class="notifications-popover">
    <div class="notifications-panel">
      <div class="notifications-panel__header"><div><span class="panel-kicker">Centro de actividad</span><h2>Notificaciones</h2></div><span class="notification-count">{{ notifications.length }}</span></div>
      <div v-if="notifications.length" class="notification-list">
        <article v-for="item in notifications" :key="item.id" class="notification-item" :class="{ 'notification-item--unread': item.unread }">
          <span class="notification-item__icon"><i class="pi pi-info-circle" /></span>
          <div><strong>{{ item.title }}</strong><p>{{ item.message }}</p><time>{{ item.time }}</time></div>
        </article>
      </div>
      <div v-else class="notifications-empty"><i class="pi pi-check-circle" /><span>Estás al día</span></div>
    </div>
  </Popover>
</template>
