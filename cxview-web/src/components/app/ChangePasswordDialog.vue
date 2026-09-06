<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Password from 'primevue/password'

const visible = defineModel<boolean>('visible', { required: true })
const currentPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const submitted = ref(false)
watch(visible, (open) => { if (!open) { currentPassword.value = ''; newPassword.value = ''; confirmation.value = ''; submitted.value = false } })
function submit() { submitted.value = true; if (!currentPassword.value || newPassword.value.length < 8 || newPassword.value !== confirmation.value) return; visible.value = false }
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Cambiar contraseña" :style="{ width: 'min(92vw, 28rem)' }">
    <form class="password-form" @submit.prevent="submit">
      <p>Usa al menos 8 caracteres para mantener protegida tu cuenta.</p>
      <div class="form-field"><label for="current-password">Contraseña actual</label><Password id="current-password" v-model="currentPassword" :feedback="false" toggle-mask fluid /></div>
      <div class="form-field"><label for="new-password">Nueva contraseña</label><Password id="new-password" v-model="newPassword" :feedback="false" toggle-mask fluid /><Message v-if="submitted && newPassword.length < 8" severity="error" size="small" variant="simple">Debe tener al menos 8 caracteres.</Message></div>
      <div class="form-field"><label for="confirm-password">Confirmar contraseña</label><Password id="confirm-password" v-model="confirmation" :feedback="false" toggle-mask fluid /><Message v-if="submitted && confirmation !== newPassword" severity="error" size="small" variant="simple">Las contraseñas no coinciden.</Message></div>
      <div class="dialog-actions"><Button type="button" label="Cancelar" severity="secondary" text @click="visible = false" /><Button type="submit" label="Actualizar contraseña" icon="pi pi-lock" /></div>
    </form>
  </Dialog>
</template>
