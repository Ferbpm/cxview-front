<script setup lang="ts">
import BrandLogo from '@/components/brand/BrandLogo.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <main class="auth-page">
    <section class="auth-shell" aria-label="Acceso a CXView">
      <aside class="auth-visual">
        <img src="/images/auth-logistics.png" alt="Buque de carga en un puerto internacional" />
        <div class="auth-visual__veil" />
        <div class="auth-visual__content">
          <div class="auth-visual__message">
            <span class="auth-visual__line" />
            <p>Logística conectada, decisiones más claras.</p>
            <span>Controla tu operación de principio a fin desde un solo lugar.</span>
          </div>
          <div class="auth-visual__trust">
            <i class="pi pi-shield" aria-hidden="true" />
            <span>Acceso protegido y cifrado</span>
          </div>
        </div>
      </aside>

      <section class="auth-content">
        <div class="auth-content__brand"><BrandLogo /></div>
        <div class="auth-content__inner">
          <span class="auth-eyebrow">{{ eyebrow }}</span>
          <h1>{{ title }}</h1>
          <p class="auth-description">{{ description }}</p>
          <slot />
        </div>
        <p class="auth-footer">© {{ new Date().getFullYear() }} View Logistics Cargo. Todos los derechos reservados.</p>
      </section>
    </section>
  </main>
</template>
