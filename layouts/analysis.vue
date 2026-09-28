<script setup lang="ts">
/* Core content layout: eyebrow, title (from markdown), body, lens rail footer. */
const props = defineProps<{ accent?: string; eyebrow?: string; lenses?: string | number; art?: string }>()
</script>
<template>
  <div class="slidev-layout analysis" :data-accent="accent">
    <div v-if="art" class="edge" :style="{ backgroundImage: `url(${art})` }" aria-hidden="true" />
    <div class="eyebrow" v-if="eyebrow">{{ eyebrow }}</div>
    <div class="main"><slot /></div>
    <footer class="foot">
      <LensRail :active="lenses" />
      <span class="pg">{{ $nav.currentPage }}</span>
    </footer>
  </div>
</template>
<style scoped>
.analysis { position: relative; height: 100%; padding: 2rem 3rem 3.1rem; background: var(--c-paper); color: var(--c-ink); overflow: hidden; }
.edge { position: absolute; right: 0; top: 0; bottom: 0; width: 4.5rem; background-size: cover; background-position: center; opacity: .9; }
.edge + .eyebrow, .edge ~ .main, .edge ~ .foot { margin-right: 4.2rem; }
.eyebrow { font-family: var(--f-sans); font-size: .64rem; letter-spacing: .24em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: .2rem; }
.foot { position: absolute; left: 3rem; right: 3rem; bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
.edge ~ .foot { right: 7.2rem; }
.pg { font-family: var(--f-sans); font-size: .62rem; color: var(--c-faint); font-variant-numeric: tabular-nums; }
</style>
