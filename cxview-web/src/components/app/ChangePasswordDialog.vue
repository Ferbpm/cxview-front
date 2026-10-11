<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { authService } from '@/modules/security/services/auth.service'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{ userName: string }>()
const newPassword = ref('')
const confirmation = ref('')
const submitted = ref(false)
const saving = ref(false)
const error = ref('')
watch(visible, (open) => { if (!open) { newPassword.value = ''; confirmation.value = ''; submitted.value = false; error.value = '' } })
async function submit() {
  submitted.value = true
  if (newPassword.value.length < 8 || newPassword.value !== confirmation.value) return
  saving.value = true
  error.value = ''
  try {
    const users = await authService.listSecurityUsers({ login: props.userName })
    const user = users.find((item) => item.login.toLowerCase() === props.userName.toLowerCase())
    if (!user) throw new Error('No se encontró el usuario de la sesión.')
    await authService.changeSecurityUserPassword(user.id, newPassword.value)
    visible.value = false
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'No fue posible cambiar la contraseña.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Cambiar contraseña" class="company-dialog" :style="{ width: 'min(92vw, 28rem)' }">
    <form class="password-form" @submit.prevent="submit">
      <p>Usa al menos 8 caracteres para mantener protegida tu cuenta.</p>
      <Message v-if="error" severity="error" size="small" variant="simple">{{ error }}</Message>
      <div class="form-field"><label for="new-password">Nueva contraseña</label><Password id="new-password" v-model="newPassword" :feedback="false" toggle-mask fluid /><Message v-if="submitted && newPassword.length < 8" severity="error" size="small" variant="simple">Debe tener al menos 8 caracteres.</Message></div>
      <div class="form-field"><label for="confirm-password">Confirmar contraseña</label><Password id="confirm-password" v-model="confirmation" :feedback="false" toggle-mask fluid /><Message v-if="submitted && confirmation !== newPassword" severity="error" size="small" variant="simple">Las contraseñas no coinciden.</Message></div>
      <div class="dialog-actions"><Button type="button" label="Cancelar" class="company-secondary-button" text @click="visible = false" /><Button type="submit" label="Actualizar contraseña" icon="pi pi-lock" class="company-primary-button" :loading="saving" /></div>
    </form>
  </Dialog>
</template>
