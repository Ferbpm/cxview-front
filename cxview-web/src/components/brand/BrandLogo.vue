<script setup lang="ts">
defineProps<{ inverse?: boolean; headerVariant?: boolean }>()
</script>

<template>
  <div class="brand-logo" :class="{ 'brand-logo--inverse': inverse, 'brand-logo--header': headerVariant }">
    <img :src="headerVariant ? '/images/vlc-plus-header.png' : '/images/vlc-plus-logo.svg'" alt="VLC Plus" />
  </div>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  width: fit-content;
  align-items: center;
}

.brand-logo img {
  display: block;
  width: clamp(8.5rem, 12vw, 10.5rem);
  height: auto;
}

.brand-logo--inverse {
  padding: .55rem 1rem;
  border: 1px solid rgba(255, 255, 255, .34);
  border-radius: 14px;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 12px 28px rgba(0, 20, 45, .16);
  backdrop-filter: blur(8px);
}
</style>
