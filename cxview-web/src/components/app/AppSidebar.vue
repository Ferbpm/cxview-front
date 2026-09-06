<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'

interface SubmenuItem { label: string; children?: string[] }
interface MenuItem { label: string; icon: string; children: SubmenuItem[] }
const emit = defineEmits<{ home: []; select: [path: string[]] }>()

const activeMenu = ref<MenuItem | null>(null)
const activeSubmenu = ref<SubmenuItem | null>(null)
const remainingSeconds = ref(90 * 60)
const items: MenuItem[] = [
  { label: 'Operaciones', icon: 'pi pi-briefcase', children: [{ label: 'Mis operaciones' }, { label: 'Seguimiento de carga', children: ['En tránsito', 'Entregadas'] }, { label: 'Órdenes pendientes' }] },
  { label: 'Documentos', icon: 'pi pi-file', children: [{ label: 'Documentos recientes' }, { label: 'Embarques', children: ['Conocimiento de embarque', 'Manifiestos'] }, { label: 'Plantillas' }] },
  { label: 'Reportes', icon: 'pi pi-chart-bar', children: [{ label: 'Indicadores operativos' }, { label: 'Trazabilidad', children: ['Por operación', 'Por cliente'] }, { label: 'Exportar reportes' }] },
]
const timeLeft = computed(() => `${String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')}:${String(remainingSeconds.value % 60).padStart(2, '0')}`)
const timer = window.setInterval(() => { if (remainingSeconds.value > 0) remainingSeconds.value -= 1 }, 1000)
onUnmounted(() => window.clearInterval(timer))

function openMenu(item: MenuItem) { activeMenu.value = activeMenu.value?.label === item.label ? null : item; activeSubmenu.value = null }
function selectItem(item: SubmenuItem) { if (item.children?.length) { activeSubmenu.value = item; return }; if (activeMenu.value) { const path = [activeMenu.value.label, item.label]; activeMenu.value = null; emit('select', path) } }
function selectLeaf(label: string) { if (!activeMenu.value || !activeSubmenu.value) return; const path = [activeMenu.value.label, activeSubmenu.value.label, label]; activeMenu.value = null; activeSubmenu.value = null; emit('select', path) }
</script>

<template>
  <aside class="app-sidebar" aria-label="Menú principal">
    <Button v-tooltip.right="'Inicio'" icon="pi pi-home" rounded text aria-label="Inicio" :class="{ 'sidebar-button--active': true }" class="sidebar-button" @click="emit('home')" />
    <span class="sidebar-rule" />
    <div class="sidebar-menu-list">
      <Button v-for="item in items" :key="item.label" v-tooltip.right="item.label" :icon="item.icon" rounded text class="sidebar-button" :aria-label="item.label" @click="openMenu(item)" />
    </div>
    <Button v-tooltip.right="`Sesión: ${timeLeft}`" rounded text class="sidebar-button sidebar-session" :aria-label="`Tiempo de sesión restante ${timeLeft}`"><i class="pi pi-clock" aria-hidden="true" /><span>{{ timeLeft }}</span></Button>
    <div v-if="activeMenu" class="sidebar-flyout">
      <div class="sidebar-submenu"><span class="panel-kicker">{{ activeMenu.label }}</span><strong>Opciones disponibles</strong><button v-for="item in activeMenu.children" :key="item.label" type="button" :class="{ 'sidebar-submenu__selected': activeSubmenu?.label === item.label }" @click="selectItem(item)"><i class="pi" :class="item.children?.length ? 'pi-angle-right' : 'pi-circle-fill'" />{{ item.label }}</button></div>
      <div v-if="activeSubmenu" class="sidebar-submenu sidebar-submenu--level-two"><span class="panel-kicker">{{ activeSubmenu.label }}</span><strong>Submenú</strong><button v-for="child in activeSubmenu.children" :key="child" type="button" @click="selectLeaf(child)"><i class="pi pi-angle-right" />{{ child }}</button></div>
    </div>
  </aside>
</template>
