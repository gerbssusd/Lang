<script setup lang="ts">
/* Section divider for each story: full-bleed original art + title block. */
const props = defineProps<{ art?: string; accent?: string; story?: string; author?: string; year?: string | number; kicker?: string }>()
</script>
<template>
  <div class="slidev-layout story" :data-accent="accent" :style="{ backgroundImage: art ? `url(${art})` : undefined }">
    <div class="shade" />
    <div class="block">
      <div class="kicker">{{ kicker }}</div>
      <h1 class="t">{{ story }}</h1>
      <div class="by">{{ author }} <span class="yr">· {{ year }}</span></div>
      <div class="body"><slot /></div>
    </div>
  </div>
</template>
<style scoped>
.story { position: relative; height: 100%; padding: 0; background-size: cover; background-position: center; color: #f7f4ee; }
.shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(12,12,18,.9) 0%, rgba(12,12,18,.72) 42%, rgba(12,12,18,.05) 80%); }
.block { position: absolute; left: 3.2rem; top: 50%; transform: translateY(-50%); max-width: 30rem; }
.kicker { font-family: var(--f-sans); font-size: .7rem; letter-spacing: .28em; text-transform: uppercase; color: var(--accent-light); }
.t { font-family: var(--f-serif); font-size: 3.1rem !important; line-height: 1.02 !important; margin: .5rem 0 .6rem !important; color: #fff; font-weight: 500; }
.by { font-family: var(--f-serif); font-style: italic; font-size: 1.25rem; color: #e9e3d6; }
.yr { font-style: normal; font-family: var(--f-sans); font-size: .85rem; color: #bdb6a8; }
.body { margin-top: 1.3rem; font-family: var(--f-sans); font-size: .86rem; line-height: 1.55; color: #ddd7cb; }
.body :deep(strong) { color: #fff; }
</style>
