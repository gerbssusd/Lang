<script setup lang="ts">
/* Recurring motif: which of Ribó's chapters (lenses) a slide brings to bear. */
import { computed } from 'vue'
const props = defineProps<{ active?: string | number }>()
const lenses = [
  { n: 1, label: 'Narrative', icon: 'i-ph-book-open-text' },
  { n: 2, label: 'Plot', icon: 'i-ph-path' },
  { n: 3, label: 'Setting', icon: 'i-ph-house-line' },
  { n: 4, label: 'Character', icon: 'i-ph-users-three' },
  { n: 5, label: 'Narration', icon: 'i-ph-microphone-stage' },
  { n: 6, label: 'Language', icon: 'i-ph-quotes' },
]
const on = computed(() => String(props.active ?? '').split(',').map(s => Number(s.trim())).filter(Boolean))
</script>
<template>
  <nav class="rail" aria-label="Ribó chapters in play">
    <span v-for="l in lenses" :key="l.n" class="lens" :class="{ on: on.includes(l.n), lang: l.n === 6 }">
      <span :class="l.icon" class="ic" />
      <span class="lb">Ch. {{ l.n }} · {{ l.label }}</span>
    </span>
  </nav>
</template>
<style scoped>
.rail { display: flex; gap: .4rem; flex-wrap: wrap; }
.lens { display: inline-flex; align-items: center; gap: .3rem; padding: .16rem .55rem; border-radius: 999px; font-family: var(--f-sans); font-size: .58rem; letter-spacing: .04em; color: var(--c-faint); border: 1px solid var(--c-rule); }
.lens .ic { font-size: .8rem; }
.lens.on { color: var(--c-ink); border-color: transparent; background: var(--accent-soft); }
.lens.on.lang { background: var(--accent); color: #fff; }
</style>
