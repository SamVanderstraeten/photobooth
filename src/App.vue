<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>

<style>

body, html {
  margin: 0;
  padding: 0;
  background-color: #e9e9e9;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

main {
  width: 100%;
  height: 100%;
}

</style>
