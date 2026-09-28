<script setup lang="ts">
/* A quoted passage from a primary text, with its MLA parenthetical. */
defineProps<{ cite?: string; size?: 'sm' | 'md' | 'lg' }>()
</script>
<template>
  <figure class="passage" :class="size ?? 'md'">
    <span class="mark" aria-hidden="true">“</span>
    <blockquote><slot /></blockquote>
    <figcaption v-if="cite">({{ cite }})</figcaption>
  </figure>
</template>
<style scoped>
.passage { position: relative; margin: 0; padding: 1.1rem 1.4rem 1rem 2.6rem; background: var(--c-card); border-radius: 14px; box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 10px 28px -18px rgba(20,18,30,.45); }
.mark { position: absolute; left: .7rem; top: -.35rem; font-family: var(--f-serif); font-size: 4.2rem; line-height: 1; color: var(--accent); opacity: .55; }
blockquote { margin: 0; padding: 0; border: 0; font-family: var(--f-serif); font-style: italic; color: var(--c-ink); line-height: 1.42; background: none; }
.sm blockquote { font-size: 1.02rem; } .md blockquote { font-size: 1.22rem; } .lg blockquote { font-size: 1.5rem; }
figcaption { margin-top: .45rem; text-align: right; font-family: var(--f-sans); font-size: .72rem; letter-spacing: .03em; color: var(--c-muted); }
:deep(mark) { background: linear-gradient(transparent 58%, var(--accent-soft) 58%); color: inherit; padding: 0 .08em; font-style: normal; font-weight: 600; }
</style>
