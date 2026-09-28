<script setup lang="ts">
/* A Ribó figure (or other credited image) beside the argument. */
const props = defineProps<{ image: string; caption?: string; accent?: string; eyebrow?: string; lenses?: string | number; side?: 'left' | 'right'; fit?: 'contain' | 'cover' }>()
</script>
<template>
  <div class="slidev-layout figure-l" :data-accent="accent" :class="side === 'right' ? 'rev' : ''">
    <figure class="fig">
      <div class="frame"><img :src="image" alt="" :style="{ objectFit: fit ?? 'contain' }"></div>
      <figcaption v-if="caption">{{ caption }}</figcaption>
    </figure>
    <div class="col">
      <div class="eyebrow" v-if="eyebrow">{{ eyebrow }}</div>
      <slot />
    </div>
    <footer class="foot"><LensRail :active="lenses" /><span class="pg">{{ $nav.currentPage }}</span></footer>
  </div>
</template>
<style scoped>
.figure-l { position: relative; height: 100%; padding: 2rem 3rem 3.1rem; display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 2.2rem; grid-template-rows: minmax(0, 1fr); background: var(--c-paper); color: var(--c-ink); }
.figure-l.rev { grid-template-columns: 1.1fr 0.9fr; } .figure-l.rev .fig { order: 2; }
.fig { margin: 0; display: flex; flex-direction: column; gap: .5rem; min-height: 0; }
.frame { flex: 1; min-height: 0; background: #fff; border-radius: 14px; padding: .8rem; box-shadow: 0 12px 30px -20px rgba(20,18,30,.6); display: flex; align-items: center; justify-content: center; }
.frame img { width: 100%; height: 100%; max-height: 100%; min-height: 0; }
figcaption { font-family: var(--f-sans); font-size: .56rem; line-height: 1.35; color: var(--c-muted); }
.col { min-width: 0; min-height: 0; overflow: hidden; }
.eyebrow { font-family: var(--f-sans); font-size: .64rem; letter-spacing: .24em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: .2rem; }
.foot { position: absolute; left: 3rem; right: 3rem; bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
.pg { font-family: var(--f-sans); font-size: .62rem; color: var(--c-faint); }
</style>
