import { computed, ref } from 'vue'

export type ObjectAction = 'read' | 'create' | 'update' | 'delete' | 'filter' | 'assign'

interface StoredObjectPermissions {
  /** Permite mantener la aplicación operativa hasta que el API entregue permisos por acción. */
  configured: boolean
  codes: string[]
}

const OBJECT_PERMISSIONS_KEY = 'cxview.object-permissions'

function readPermissions(): StoredObjectPermissions {
  try {
    const value = JSON.parse(sessionStorage.getItem(OBJECT_PERMISSIONS_KEY) ?? 'null') as StoredObjectPermissions | null
    return value && Array.isArray(value.codes) ? value : { configured: true, codes: [] }
  } catch { return { configured: true, codes: [] } }
}

const permissionState = ref<StoredObjectPermissions>(readPermissions())

/**
 * Convención de códigos: {módulo}.{objeto}.{acción}; por ejemplo security.companies.create.
 * Cuando el backend entregue la matriz de permisos, use setObjectPermissionCodes al iniciar sesión.
 */
export function useObjectPermissions(objectKey: string) {
  const can = (action: ObjectAction) => computed(() => permissionState.value.codes.includes('*') || permissionState.value.codes.includes(`${objectKey}.${action}`))
  return { can }
}

export function setObjectPermissionCodes(codes: string[]) {
  permissionState.value = { configured: true, codes }
  sessionStorage.setItem(OBJECT_PERMISSIONS_KEY, JSON.stringify(permissionState.value))
}

export function clearObjectPermissionCodes() {
  permissionState.value = { configured: true, codes: [] }
  sessionStorage.removeItem(OBJECT_PERMISSIONS_KEY)
}
