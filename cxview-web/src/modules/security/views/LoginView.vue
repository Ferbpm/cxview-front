<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { authService } from '@/modules/security/services/auth.service'

const router = useRouter()
const username = ref('')
const password = ref('')
const remember = ref(false)
const submitted = ref(false)
const loading = ref(false)
const requestError = ref('')

const isValid = computed(() => username.value.trim().length > 0 && password.value.length > 0)

async function submit() {
  submitted.value = true
  if (!isValid.value) return
  loading.value = true
  requestError.value = ''

  try {
    await authService.login({ username: username.value.trim(), password: password.value, remember: remember.value })
    password.value = ''
    await router.push({ name: 'otp' })
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'No pudimos iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="Bienvenido de nuevo"
    title="Inicia sesión"
    description="Accede a tu centro de operaciones logísticas de forma segura."
  >
    <form class="auth-form" novalidate @submit.prevent="submit">
      <Message v-if="requestError" severity="error" :closable="false">{{ requestError }}</Message>
      <div class="form-field">
        <label for="username">Usuario o correo</label>
        <span class="p-input-icon-left input-wrap">
          <i class="pi pi-user" aria-hidden="true" />
          <InputText id="username" v-model="username" autocomplete="username" placeholder="nombre@empresa.com" fluid />
        </span>
        <Message v-if="submitted && !username.trim()" severity="error" size="small" variant="simple">Ingresa tu usuario.</Message>
      </div>

      <div class="form-field">
        <div class="field-heading">
          <label for="password">Contraseña</label>
          <button class="text-action" type="button">¿Olvidaste tu contraseña?</button>
        </div>
        <Password id="password" v-model="password" autocomplete="current-password" placeholder="Ingresa tu contraseña" :feedback="false" toggle-mask fluid />
        <Message v-if="submitted && !password" severity="error" size="small" variant="simple">Ingresa tu contraseña.</Message>
      </div>

      <label class="remember-row" for="remember">
        <Checkbox v-model="remember" input-id="remember" binary />
        <span>Recordar mi sesión</span>
      </label>

      <Button type="submit" label="Ingresar de forma segura" icon="pi pi-arrow-right" icon-pos="right" :loading="loading" fluid />
    </form>

    <div class="support-note">
      <i class="pi pi-headphones" aria-hidden="true" />
      <span>¿Necesitas ayuda? <a href="mailto:servicioalclient@viewlc.com.pe">Contacta a soporte</a></span>
    </div>
  </AuthLayout>
</template>
