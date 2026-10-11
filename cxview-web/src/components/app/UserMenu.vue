<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import ChangePasswordDialog from './ChangePasswordDialog.vue'

defineProps<{ userName: string }>()
const emit = defineEmits<{ logout: []; changeModule: [] }>()
const menu = ref<InstanceType<typeof Menu> | null>(null)
const changePasswordVisible = ref(false)
const items = [
  { label: 'Mi perfil', icon: 'pi pi-user' },
  { label: 'Cambiar contraseña', icon: 'pi pi-lock', command: () => { changePasswordVisible.value = true } },
  { separator: true },
  { label: 'Cambiar módulo', icon: 'pi pi-th-large', command: () => emit('changeModule') },
]
</script>

<template>
  <div class="user-control">
    <Button class="user-menu-button" text severity="secondary" aria-haspopup="true" aria-controls="user-menu" @click="menu?.toggle($event)">
      <span class="user-avatar">{{ userName.charAt(0).toUpperCase() }}</span><span class="user-menu-button__text"><small>Sesión activa</small><strong>{{ userName }}</strong></span><i class="pi pi-angle-down" />
    </Button>
    <Menu id="user-menu" ref="menu" :model="items" popup />
    <Button v-tooltip.bottom="'Cerrar sesión'" icon="pi pi-sign-out" rounded severity="secondary" outlined aria-label="Cerrar sesión" class="header-icon-button" @click="emit('logout')" />
    <ChangePasswordDialog v-model:visible="changePasswordVisible" :user-name="userName" />
  </div>
</template>
