<template>
  <nav>
    <AssetItem v-for="(asset, index) of imageSrc" :asset="asset" :key="index" @click="assetSelected(asset)" />

    <input type="file" id="media" accept="image/*" multiple @change="(event) => handelFileUpload(event)" />
  </nav>

  <section>
    <PhotoBooth v-bind="selectedAsset"/>
  </section>
</template>

<script setup>
import PhotoBooth from './PhotoBooth.vue'
import AssetItem from './AssetItem.vue';
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
};

</script>

<style scoped>
  nav {
    border-bottom: 10px solid #30353c;
    height: 20%;
    background-color: #ED1B25;
    padding: 0 12px;
  }

  section {
    height: 80%;
  }
</style>
