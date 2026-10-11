<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Message from 'primevue/message'
import Select from 'primevue/select'
import AppHeader from '@/components/app/AppHeader.vue'
import { authService, type AssignedBusinessUnit, type AssignedModule, type AssignedOperationType, type AssignedSite, type AuthorizedMenu } from '@/modules/security/services/auth.service'

interface Option { label: string; value: string }
interface BusinessModule { key: string; name: string; description: string; image: string }

const router = useRouter()
const userName = authService.getCurrentUser() ?? 'Usuario'
const operationType = ref<string | null>(null)
const businessUnit = ref<string | null>(null)
const location = ref<string | null>(null)
const selectionError = ref(false)
const operationTypes = ref<Option[]>([])
const operationTypesLoading = ref(true)
const operationTypesError = ref('')
const businessUnits = ref<Option[]>([])
const businessUnitsLoading = ref(true)
const businessUnitsError = ref('')
const sites = ref<AssignedSite[]>([])
const sitesLoading = ref(true)
const sitesError = ref('')
const locations = computed<Option[]>(() => sites.value.map((site) => ({ label: `${site.name} (${site.abbreviation})`, value: site.siteId })))
const modules = ref<BusinessModule[]>([])
const modulesLoading = ref(true)
const modulesError = ref('')
const menusError = ref('')
const openingModuleId = ref<string | null>(null)
const notifications = [
  { id: 1, title: 'Operación actualizada', message: 'La orden VLC-2048 cambió a carga confirmada.', time: 'Hace 8 min', unread: true },
  { id: 2, title: 'Documento disponible', message: 'Ya puedes revisar el documento de embarque.', time: 'Ayer' },
]
const WORKSPACE_CONTEXT_KEY = 'cxview.user.context'
const contextReady = computed(() => Boolean(operationType.value && businessUnit.value && location.value))
const securityAvailable = computed(() => modules.value.some(isSecurityModule))

function moduleImage(name: string) {
  const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (normalizedName.includes('seguridad')) return '/images/module-security.png'
  if (normalizedName.includes('deposito')) return '/images/module-temporary-depot.png'
  return '/images/auth-logistics.png'
}

function isSecurityModule(module: Pick<BusinessModule, 'name'>) {
  return module.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('seguridad')
}

onMounted(async () => {
  try {
    const operationTypesResponse = await authService.listOperationTypes(userName)
    operationTypes.value = operationTypesResponse.map((item: AssignedOperationType) => ({ label: item.name, value: item.operationTypeId }))
  } catch (error) {
    operationTypesError.value = error instanceof Error ? error.message : 'No fue posible cargar los tipos de operación asignados.'
  } finally {
    operationTypesLoading.value = false
  }

  try {
    const businessUnitsResponse = await authService.listBusinessUnits(userName)
    businessUnits.value = businessUnitsResponse.map((item: AssignedBusinessUnit) => ({ label: item.name, value: item.businessUnitId }))
  } catch (error) {
    businessUnitsError.value = error instanceof Error ? error.message : 'No fue posible cargar las unidades de negocio asignadas.'
  } finally {
    businessUnitsLoading.value = false
  }

  try {
    const modulesResponse = await authService.listModules(userName)
    modules.value = modulesResponse.map((item: AssignedModule) => ({
      key: item.moduleId,
      name: item.name,
      description: item.description || item.applicationName,
      image: moduleImage(item.name),
    }))
  } catch (error) {
    modulesError.value = error instanceof Error ? error.message : 'No fue posible cargar los módulos asignados.'
  } finally {
    modulesLoading.value = false
  }

  try {
    sites.value = await authService.listAssignedSites(userName)
    location.value = sites.value.find((site) => site.isDefault)?.siteId ?? sites.value[0]?.siteId ?? null
  } catch (error) {
    sitesError.value = error instanceof Error ? error.message : 'No fue posible cargar las sedes asignadas.'
  } finally {
    sitesLoading.value = false
  }
})

async function openModule(module: BusinessModule) {
  const transversal = isSecurityModule(module)
  selectionError.value = !transversal && !contextReady.value
  if (!transversal && !contextReady.value) return
  menusError.value = ''
  openingModuleId.value = module.key
  try {
    const menus = await authService.listMenus(userName, module.key)
    const operationLabel = transversal ? '' : operationTypes.value.find((item) => item.value === operationType.value)?.label ?? ''
    const businessLabel = transversal ? '' : businessUnits.value.find((item) => item.value === businessUnit.value)?.label ?? ''
    const locationLabel = transversal ? '' : locations.value.find((item) => item.value === location.value)?.label ?? ''
    const workspaceContext = JSON.stringify({
      operationType: operationLabel,
      businessUnit: businessLabel,
      location: locationLabel,
      module: module.key,
      moduleName: module.name,
      transversal,
      menus: menus.map((item: AuthorizedMenu) => ({ menuId: item.menuId, name: item.name, description: item.description })),
    })
    // El contexto no contiene una credencial. Se duplica para que una vista
    // abierta en otra pestaña pueda restaurar el módulo actual; la sesión sigue
    // autenticada exclusivamente mediante la cookie HttpOnly.
    sessionStorage.setItem(WORKSPACE_CONTEXT_KEY, workspaceContext)
    localStorage.setItem(WORKSPACE_CONTEXT_KEY, workspaceContext)
    // La vista de trabajo bloquea el retorno con el historial y muestra una
    // alerta; el cambio permitido se realiza desde el menú del usuario.
    await router.push({ name: 'workspace' })
  } catch (error) {
    menusError.value = error instanceof Error ? error.message : 'No fue posible cargar los menús autorizados.'
  } finally {
    openingModuleId.value = null
  }
}
async function logout() { authService.clearAuthSession(); sessionStorage.removeItem(WORKSPACE_CONTEXT_KEY); localStorage.removeItem(WORKSPACE_CONTEXT_KEY); await router.replace({ name: 'login' }) }
</script>

<template>
  <div class="module-page">
    <AppHeader :user-name="userName" :notifications="notifications" @logout="logout" />
    <main class="module-main">
      <section class="context-panel" aria-label="Contexto de trabajo">
        <div class="context-grid">
          <div class="form-field"><label for="operation">Tipo de operación</label><Select id="operation" v-model="operationType" :options="operationTypes" option-label="label" option-value="value" :loading="operationTypesLoading" :disabled="operationTypesLoading || Boolean(operationTypesError)" placeholder="Selecciona una operación" fluid /><Message v-if="operationTypesError" severity="error" size="small" variant="simple">{{ operationTypesError }}</Message></div>
          <div class="form-field"><label for="business">Unidad de negocio</label><Select id="business" v-model="businessUnit" :options="businessUnits" option-label="label" option-value="value" :loading="businessUnitsLoading" :disabled="businessUnitsLoading || Boolean(businessUnitsError)" placeholder="Selecciona una unidad" fluid /><Message v-if="businessUnitsError" severity="error" size="small" variant="simple">{{ businessUnitsError }}</Message></div>
          <div class="form-field"><label for="location">Sede</label><Select id="location" v-model="location" :options="locations" option-label="label" option-value="value" :loading="sitesLoading" :disabled="sitesLoading || Boolean(sitesError)" placeholder="Selecciona una sede" fluid /><Message v-if="sitesError" severity="error" size="small" variant="simple">{{ sitesError }}</Message></div>
        </div>
        <Message v-if="securityAvailable" severity="info" :closable="false">El módulo Seguridad es transversal y puede abrirse sin tipo de operación, unidad de negocio ni sede.</Message>
        <Message v-if="selectionError" severity="warn" :closable="false">Selecciona un tipo de operación, unidad de negocio y sede antes de abrir un módulo.</Message>
        <Message v-if="menusError" severity="error" :closable="false">{{ menusError }}</Message>
      </section>
      <section class="modules-section" aria-label="Módulos disponibles">
        <div class="modules-title"><span>Módulos asignados</span><p>Selecciona el módulo en el que deseas trabajar</p></div>
        <Message v-if="modulesError" severity="error" :closable="false">{{ modulesError }}</Message>
        <div v-else-if="modulesLoading" class="module-grid module-grid--loading" aria-live="polite">
          <div v-for="index in 3" :key="index" class="module-card module-card--placeholder" />
        </div>
        <Message v-else-if="!modules.length" severity="info" :closable="false">No tienes módulos asignados para esta aplicación.</Message>
        <div v-else class="module-grid">
          <button v-for="item in modules" :key="item.key" type="button" class="module-card" :disabled="openingModuleId !== null" @click="openModule(item)">
            <img :src="item.image" alt="" />
            <span class="module-card__overlay"><strong>{{ item.name }}</strong><span>{{ item.description }}</span><span class="module-card__action">{{ openingModuleId === item.key ? 'Cargando…' : 'Ingresar' }} <i :class="openingModuleId === item.key ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'" /></span></span>
          </button>
        </div>
      </section>
    </main>
    <footer class="module-footer">© {{ new Date().getFullYear() }} View Logistics Cargo S.A.C.</footer>
  </div>
</template>
