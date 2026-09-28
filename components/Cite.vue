<script setup lang="ts">
defineProps<{ inline?: boolean }>()
</script>
<template>
  <span class="mla-cite">(<slot />)</span>
</template>
<style scoped>
.mla-cite { font-family: var(--f-sans); font-size: .72em; letter-spacing: .02em; color: var(--c-muted); white-space: nowrap; }
</style>
