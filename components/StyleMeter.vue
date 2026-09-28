<script setup lang="ts">
/* Minimal stylometric bar chart. rows: [{label, values:[fitz, gilman, chopin]}] */
defineProps<{ rows: { label: string; unit?: string; values: number[] }[] }>()
const names = ['Fitzgerald', 'Gilman', 'Chopin']
const cls = ['fitz', 'gilman', 'chopin']
</script>
<template>
  <div class="meter">
    <div class="legend">
      <span v-for="(n, i) in names" :key="n" class="key" :class="cls[i]"><i />{{ n }}</span>
    </div>
    <div v-for="r in rows" :key="r.label" class="row">
      <div class="lab">{{ r.label }}<small v-if="r.unit"> {{ r.unit }}</small></div>
      <div class="bars">
        <div v-for="(v, i) in r.values" :key="i" class="bar" :class="cls[i]">
          <span class="fill" :style="{ width: (v / Math.max(...r.values) * 100) + '%' }" />
          <span class="val">{{ v }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.meter { font-family: var(--f-sans); display: flex; flex-direction: column; gap: .7rem; }
.legend { display: flex; gap: 1rem; font-size: .7rem; color: var(--c-muted); }
.key { display: inline-flex; gap: .35rem; align-items: center; } .key i { width: .7rem; height: .7rem; border-radius: 3px; display: inline-block; background: var(--k); }
.row { display: grid; grid-template-columns: 11.5rem 1fr; gap: .8rem; align-items: center; }
.lab { font-size: .78rem; color: var(--c-ink); line-height: 1.2; } .lab small { display: block; color: var(--c-muted); font-size: .64rem; }
.bars { display: flex; flex-direction: column; gap: 3px; }
.bar { position: relative; height: 13px; display: flex; align-items: center; }
.fill { height: 100%; border-radius: 0 4px 4px 0; background: var(--k); display: block; min-width: 3px; }
.val { margin-left: .45rem; font-size: .64rem; color: var(--c-muted); font-variant-numeric: tabular-nums; }
.fitz { --k: var(--c-fitz); } .gilman { --k: var(--c-gilman); } .chopin { --k: var(--c-chopin); }
</style>
