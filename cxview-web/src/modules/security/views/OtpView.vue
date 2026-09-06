<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputOtp from 'primevue/inputotp'
import Message from 'primevue/message'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { authService } from '@/modules/security/services/auth.service'

const router = useRouter()
const toast = useToast()
const challenge = authService.getOtpChallenge()
const otp = ref('')
const submitted = ref(false)
const loading = ref(false)
const resendDisabled = ref(false)
const seconds = ref(0)
const requestError = ref('')

if (!challenge) void router.replace({ name: 'login' })

async function validateOtp() {
  submitted.value = true
  if (otp.value.length !== 6 || !challenge) return
  loading.value = true
  requestError.value = ''

  try {
    await authService.verifyOtp(challenge.challengeId, otp.value)
    authService.clearOtpChallenge()
    toast.add({ severity: 'success', summary: 'Identidad verificada', detail: 'Código validado correctamente.', life: 3000 })
    await router.replace({ name: 'module-selection' })
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'No pudimos validar el código.'
  } finally {
    loading.value = false
  }
}

async function resend() {
  if (!challenge) return
  resendDisabled.value = true
  seconds.value = 30
  requestError.value = ''

  try {
    await authService.resendOtp(challenge.challengeId)
    toast.add({ severity: 'info', summary: 'Código reenviado', detail: `Enviamos un nuevo código a ${challenge.maskedDestination}.`, life: 3500 })
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'No pudimos reenviar el código.'
  }

  const timer = window.setInterval(() => {
    seconds.value -= 1
    if (seconds.value <= 0) {
      window.clearInterval(timer)
      resendDisabled.value = false
    }
  }, 1000)
}
</script>

<template>
  <AuthLayout
    eyebrow="Verificación en dos pasos"
    title="Confirma tu identidad"
    description="Protegemos tu cuenta con una capa adicional de seguridad."
  >
    <div class="otp-notice">
      <span class="otp-notice__icon"><i class="pi pi-envelope" aria-hidden="true" /></span>
      <p>Enviamos un código de 6 dígitos a <strong>{{ challenge?.maskedDestination ?? 'tu correo registrado' }}</strong></p>
    </div>

    <form class="auth-form otp-form" novalidate @submit.prevent="validateOtp">
      <Message v-if="requestError" severity="error" :closable="false">{{ requestError }}</Message>
      <div class="form-field">
        <label for="otp">Código de verificación</label>
        <InputOtp id="otp" v-model="otp" :length="6" integer-only aria-label="Código de verificación de 6 dígitos" />
        <Message v-if="submitted && otp.length !== 6" severity="error" size="small" variant="simple">Completa los 6 dígitos para continuar.</Message>
      </div>

      <Button type="submit" label="Verificar y continuar" icon="pi pi-check" icon-pos="right" :loading="loading" fluid />
      <Button type="button" label="Volver al inicio de sesión" icon="pi pi-arrow-left" severity="secondary" variant="text" fluid @click="router.push({ name: 'login' })" />
    </form>

    <div class="resend-row">
      <span>¿No recibiste el código?</span>
      <Button type="button" :label="resendDisabled ? `Reenviar en ${seconds}s` : 'Reenviar código'" link :disabled="resendDisabled" @click="resend" />
    </div>
  </AuthLayout>
</template>
