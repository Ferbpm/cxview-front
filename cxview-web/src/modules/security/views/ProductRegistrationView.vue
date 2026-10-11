<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

// Definición de datos del producto
const product = ref({
    id: null,
    nompro: '',
    despro: '',
    estpro: 'A',
    sacrg: false,
    cuscrt: '',
    fchhracrt: null,
    culusa: '',
    fchhraact: null
})

// Estados del formulario
const loading = ref(false)
const submitted = ref(false)

// Función para crear producto
const createProduct = async () => {
    if (!product.value.nompro.trim()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre del producto es obligatorio', life: 3000 })
        return
    }

    try {
        loading.value = true
        submitted.value = true
        
        const response = await fetch('/api/v1/security/master/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: product.value.id,
                name: product.value.nompro,
                description: product.value.despro,
                status: product.value.estpro,
                isLoaded: product.value.sacrg,
                createdBy: product.value.cuscrt,
                createdDate: product.value.fchhracrt,
                updatedBy: product.value.culusa,
                updatedDate: product.value.fchhraact
            })
        })

        if (response.ok) {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado correctamente', life: 3000 })
            router.push('/security/products')
        } else {
            const error = await response.json()
            toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Error al crear el producto', life: 3000 })
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error de conexión al crear el producto', life: 3000 })
        console.error('Error creating product:', error)
    } finally {
        loading.value = false
    }
}

// Función para cancelar y volver
const cancel = () => {
    router.push('/security/products')
}
</script>

<template>
    <div class="p-4">
        <div class="card">
            <h1 class="text-2xl font-bold mb-4">Registro de Producto</h1>
            
            <form @submit.prevent="createProduct" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nombre del producto -->
                <div class="field">
                    <label for="nompro" class="font-bold block mb-2">Nombre del Producto *</label>
                    <InputText 
                        id="nompro"
                        v-model="product.nompro"
                        class="w-full"
                        required
                    />
                </div>
                
                <!-- Descripción -->
                <div class="field">
                    <label for="despro" class="font-bold block mb-2">Descripción</label>
                    <InputText 
                        id="despro"
                        v-model="product.despro"
                        class="w-full"
                    />
                </div>

                <!-- Estado -->
                <div class="field">
                    <label for="estpro" class="font-bold block mb-2">Estado</label>
                    <Dropdown
                        id="estpro"
                        v-model="product.estpro"
                        :options="[{ label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    />
                </div>

                <!-- ¿Se carga? -->
                <div class="field">
                    <label for="sacrg" class="font-bold block mb-2">¿Se carga?</label>
                    <Checkbox 
                        id="sacrg"
                        v-model="product.sacrg"
                        binary
                    />
                    <label for="sacrg" class="ml-2">Cargar</label>
                </div>

                <!-- Botones -->
                <div class="field col-span-2 flex justify-end gap-2">
                    <Button 
                        type="button" 
                        label="Cancelar" 
                        @click="cancel"
                        severity="secondary"
                    />
                    <Button 
                        type="submit" 
                        label="Guardar" 
                        :loading="loading"
                        @click="createProduct"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.field {
    display: flex;
    flex-direction: column;
}
</style>
