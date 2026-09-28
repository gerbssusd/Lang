<script setup lang="ts">
/* A figure of speech (Ribó, sec. 6.3) mapped as tenor -> vehicle. */
defineProps<{ name: string; tenor?: string; vehicle?: string; icon?: string }>()
</script>
<template>
  <div class="trope">
    <div class="name">{{ name }}</div>
    <div v-if="tenor" class="map">
      <span class="t">{{ tenor }}</span>
      <span class="arrow">→</span>
      <span class="v">{{ vehicle }}</span>
    </div>
    <div class="ex"><slot /></div>
  </div>
</template>
<style scoped>
.trope { background: var(--c-card); border-radius: 12px; padding: .7rem .9rem .75rem; box-shadow: 0 8px 22px -18px rgba(20,18,30,.55); display: flex; flex-direction: column; gap: .3rem; }
.name { font-family: var(--f-sans); font-size: .66rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
.map { font-family: var(--f-sans); font-size: .74rem; color: var(--c-muted); display: flex; gap: .35rem; align-items: baseline; flex-wrap: wrap; }
.map .t, .map .v { background: var(--accent-soft); color: var(--c-ink); border-radius: 999px; padding: .02rem .5rem; }
.arrow { color: var(--accent); }
.ex { font-family: var(--f-serif); font-style: italic; font-size: .98rem; line-height: 1.32; color: var(--c-ink); }
</style>
