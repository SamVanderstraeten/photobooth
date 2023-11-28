<template>

  <nav>
    <AssetItem v-for="(asset, index) of assets" v-bind="asset" :key="index" @click="assetSelected(asset)" />
  </nav>

  <section>
    <PhotoBooth v-bind="selectedAsset"/>
  </section>
</template>

<script setup>
import PhotoBooth from './PhotoBooth.vue'
import AssetItem from './AssetItem.vue';
import {ref} from 'vue';

const assets = [
    {
      name: "IMG01248729.JPG",
      url: "/pictures/test.jpg"
    },
    {
      name: "IMG01248731.JPG",
      url: "/pictures/test2.jpg"
    },
    {
      name: "IMG01248733.JPG",
      url: "/pictures/test3.jpg"
    },
    {
      name: "IMG01248733.JPG",
      url: "/pictures/test4.jpg"
    }    
  ];

let selectedAsset = ref({});

const assetSelected = (asset) => {
  selectedAsset.value = asset; 
};

</script>

<style scoped>
  nav {
    border: 2px solid #aaa;
    flex-grow: 2;
  }

  section {
    border: 2px solid white;
    flex-grow: 5;
  }
</style>
