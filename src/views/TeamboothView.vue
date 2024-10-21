<template>
    <nav class="nav-top"> 
      <input type="file" id="media" class="fileinput" accept="image/*" @change="(event) => handleFileUpload(event)" />
  
      <RouterLink to="/"><img class="logo" src="/src/assets/logo-gems.png" /></RouterLink>
    </nav>

    <section>
        <TeamBooth v-bind="imageSrc" />
    </section>
</template>

<script setup>
import TeamBooth from '../components/TeamBooth.vue';
import { ref } from 'vue';

const imageSrc = ref();
const selectedFile = ref();

const handleFileUpload = (e) => {
    var files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;

    selectedFile.value = files[0];
    const src = URL.createObjectURL(files[0]);
    imageSrc.value = {'url': src, 'name': files[0].name};
};
</script>

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
        color: white;
    }

    nav.nav-top {
      border-bottom: 10px solid #30353c;
      height: 20%;
      background-color: #ED1B25;
      padding: 0 12px;
    }
  
    nav .logo {
      height: 100%;
      float: right;
    }
  
    section {
      height: 80%;
    }
  
    .fileinput {
      display: inline-block;
      cursor: pointer;
      border-radius: 3px 0 0 3px;
      border: 1px solid #CED4DA;
      padding: 32px;
      color: #ED1B25;
      background-color: #30353c;
      /*width: 113px;*/
      box-sizing: border-box;
  
      margin: 24px;
      height: 70%;
    }
</style>