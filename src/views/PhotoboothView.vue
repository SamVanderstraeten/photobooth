<template>
    <nav>
      <AssetItem v-for="(asset, index) of imageSrc" :asset="asset" :key="index" :selected="selectedAsset.url === asset.url" @click="assetSelected(asset)" />
  
      <input type="file" id="media" class="fileinput" accept="image/*" multiple @change="(event) => handelFileUpload(event)" />
  
      <img class="logo" src="/src/assets/logo-gems.png" />
    </nav>
  
    <section>
      <PhotoBooth v-bind="selectedAsset" @next-picture="selectNextPicture()" />
    </section>
  </template>
  
  <script setup>
  import PhotoBooth from '../components/PhotoBooth.vue';
  import AssetItem from '../components/AssetItem.vue';
  import {ref} from 'vue';
  
  let selectedAsset = ref({});
  
  const assetSelected = (asset) => {
    selectedAsset.value = asset; 
  };
  
  
  const imageSrc = ref([]);
  const selectedFiles = ref([]);
  const handelFileUpload = (e) => {
    var files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;
  
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
      const src = URL.createObjectURL(files[i]);
      imageSrc.value.push({'url': src, 'name': files[i].name});
    }
  
    if(imageSrc.value.length > 0 && !selectedAsset.value.url) {
      selectedAsset.value = imageSrc.value[0];
    }
  };
  
  const selectNextPicture = () => {
    const index = imageSrc.value.findIndex((asset) => asset.url === selectedAsset.value.url);
    if(index < imageSrc.value.length - 1) {
      selectedAsset.value = imageSrc.value[index + 1];
    } else {
      selectedAsset.value = imageSrc.value[0];
    }
  };
  
  </script>
  
  <style scoped>
    nav {
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
      border-right: none;
      padding: 6px;
      color: #ED1B25;
      background-color: #30353c;
      /*width: 113px;*/
      box-sizing: border-box;
  
      margin: 24px;
    }
  </style>
  