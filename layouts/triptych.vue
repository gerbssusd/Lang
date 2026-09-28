<script setup lang="ts">
/* Cover: three panels, one per story, beneath the lecture title. */
</script>
<template>
  <div class="slidev-layout triptych">
    <div class="panels" aria-hidden="true">
      <div class="p" style="background-image:url('/art/diamond.png')" />
      <div class="p" style="background-image:url('/art/wallpaper.png')" />
      <div class="p" style="background-image:url('/art/night.png')" />
    </div>
    <div class="veil" />
    <div class="content"><slot /></div>
  </div>
</template>
<style scoped>
.triptych { position: relative; height: 100%; padding: 0; color: #f7f4ee; background: #121117; overflow: hidden; }
.panels { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.p { background-size: cover; background-position: center; filter: saturate(.9); }
.veil { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,13,20,.25) 0%, rgba(14,13,20,.78) 52%, rgba(14,13,20,.94) 100%); }
.content { position: absolute; left: 3.2rem; right: 3.2rem; bottom: 2.6rem; }
</style>
