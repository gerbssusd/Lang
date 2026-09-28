<script setup lang="ts">
const props = defineProps<{ heading?: string }>()
</script>
<template>
  <div class="slidev-layout wc">
    <h1 class="h">{{ heading ?? 'Works Cited' }}</h1>
    <div class="entries"><slot /></div>
    <span class="pg">{{ $nav.currentPage }}</span>
  </div>
</template>
<style scoped>
.wc { height: 100%; padding: 1.8rem 3.4rem 2rem; background: #fff; color: var(--c-ink); position: relative; }
.h { text-align: center; font-family: var(--f-serif) !important; font-size: 1.7rem !important; font-weight: 500; margin: 0 0 .9rem !important; }
.entries :deep(p) { font-family: var(--f-serif); font-size: .92rem; line-height: 1.6; margin: 0 0 .5rem; padding-left: 2.2rem; text-indent: -2.2rem; }
.entries :deep(a) { color: inherit; border: 0; text-decoration: none; word-break: break-all; }
.pg { position: absolute; right: 3rem; bottom: 1rem; font-family: var(--f-sans); font-size: .62rem; color: var(--c-faint); }
</style>
