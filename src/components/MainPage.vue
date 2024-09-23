<template>
  <nav>
    <AssetItem v-for="(asset, index) of assets" :asset="asset" :key="index" @click="assetSelected(asset)" />
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
      name: "Wemby",
      url: "/pictures/wemby.jpg"
    },
    {
      name: "James",
      url: "/pictures/james.jpg"
    },
    {
      name: "Luka Doncic",
      url: "/pictures/luka.jpg"
    },
    {
      name: "Jokic",
      url: "/pictures/jokic.jpg"
    },
     
  ];

let selectedAsset = ref({});

const assetSelected = (asset) => {
  selectedAsset.value = asset; 
};

</script>

<style scoped>
  nav {
    border: 2px solid #ccc;
    height: 15%;
  }

  section {
    height: 85%;
  }
</style>
