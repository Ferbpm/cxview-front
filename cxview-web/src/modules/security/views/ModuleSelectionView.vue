<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Message from 'primevue/message'
import Select from 'primevue/select'
import AppHeader from '@/components/app/AppHeader.vue'
import { authService } from '@/modules/security/services/auth.service'

interface Option { label: string; value: string }
interface BusinessModule { key: string; name: string; description: string; image: string }

const router = useRouter()
const userName = 'Fernando Peña'
const operationType = ref<string | null>(null)
const businessUnit = ref<string | null>(null)
const location = ref<string | null>(null)
const selectionError = ref(false)
const operationTypes: Option[] = [{ label: 'Importación', value: 'import' }, { label: 'Exportación', value: 'export' }, { label: 'Operación nacional', value: 'national' }]
const businessUnits: Option[] = [{ label: 'Carga internacional', value: 'international-cargo' }, { label: 'Agenciamiento', value: 'agency' }, { label: 'Servicios logísticos', value: 'logistics-services' }]
const locations: Option[] = [{ label: 'Callao', value: 'callao' }, { label: 'Chancay', value: 'chancay' }, { label: 'Paita', value: 'paita' }]
const modules: BusinessModule[] = [
  { key: 'integrated-logistics', name: 'Logística integrada', description: 'Módulo servicio integrado de logística', image: '/images/auth-logistics.png' },
  { key: 'security', name: 'Seguridad', description: 'Administración de usuarios y accesos', image: '/images/module-security.png' },
  { key: 'temporary-depot', name: 'Depósito temporal', description: 'Gestión integral del depósito temporal', image: '/images/module-temporary-depot.png' },
  { key: 'support', name: 'Soporte', description: 'Atención y seguimiento de solicitudes', image: '/images/auth-logistics.png' },
  { key: 'master-data', name: 'Maestros', description: 'Configuración y datos base del sistema', image: '/images/module-temporary-depot.png' },
]
const notifications = [
  { id: 1, title: 'Operación actualizada', message: 'La orden VLC-2048 cambió a carga confirmada.', time: 'Hace 8 min', unread: true },
  { id: 2, title: 'Documento disponible', message: 'Ya puedes revisar el documento de embarque.', time: 'Ayer' },
]
const contextReady = computed(() => Boolean(operationType.value && businessUnit.value && location.value))

async function openModule(module: BusinessModule) {
  selectionError.value = !contextReady.value
  if (!contextReady.value) return
  const operationLabel = operationTypes.find((item) => item.value === operationType.value)?.label ?? ''
  const businessLabel = businessUnits.find((item) => item.value === businessUnit.value)?.label ?? ''
  const locationLabel = locations.find((item) => item.value === location.value)?.label ?? ''
  sessionStorage.setItem('cxview.user.context', JSON.stringify({ operationType: operationLabel, businessUnit: businessLabel, location: locationLabel, module: module.key, moduleName: module.name }))
  await router.push({ name: 'workspace' })
}
async function logout() { authService.clearOtpChallenge(); sessionStorage.removeItem('cxview.user.context'); await router.replace({ name: 'login' }) }
</script>

<template>
  <div class="module-page">
    <AppHeader :user-name="userName" :notifications="notifications" @logout="logout" />
    <main class="module-main">
      <section class="context-panel" aria-label="Contexto de trabajo">
        <div class="context-grid">
          <div class="form-field"><label for="operation">Tipo de operación</label><Select id="operation" v-model="operationType" :options="operationTypes" option-label="label" option-value="value" placeholder="Selecciona una operación" fluid /></div>
          <div class="form-field"><label for="business">Unidad de negocio</label><Select id="business" v-model="businessUnit" :options="businessUnits" option-label="label" option-value="value" placeholder="Selecciona una unidad" fluid /></div>
          <div class="form-field"><label for="location">Sede</label><Select id="location" v-model="location" :options="locations" option-label="label" option-value="value" placeholder="Selecciona una sede" fluid /></div>
        </div>
        <Message v-if="selectionError" severity="warn" :closable="false">Selecciona un tipo de operación, unidad de negocio y sede antes de abrir un módulo.</Message>
      </section>
      <section class="modules-section" aria-label="Módulos disponibles">
        <div class="modules-title"><span>Módulos asignados</span><p>Selecciona el módulo en el que deseas trabajar</p></div>
        <div class="module-grid">
          <button v-for="item in modules" :key="item.key" type="button" class="module-card" @click="openModule(item)">
            <img :src="item.image" alt="" />
            <span class="module-card__overlay"><strong>{{ item.name }}</strong><span>{{ item.description }}</span><span class="module-card__action">Ingresar <i class="pi pi-arrow-right" /></span></span>
          </button>
        </div>
      </section>
    </main>
    <footer class="module-footer">© {{ new Date().getFullYear() }} View Logistics Cargo S.A.C.</footer>
  </div>
</template>
