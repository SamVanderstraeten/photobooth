<template>
    <nav>
      <div class="assets">
        <AssetItem v-for="(asset, index) of imageSrc" :asset="asset" :key="index" :selected="selectedAsset.url === asset.url" @click="assetSelected(asset)" />
      </div>
  
      <input type="file" id="media" class="fileinput" accept="image/*" multiple @change="(event) => handelFileUpload(event)" />

      <!-- Kind of picture being made, and for player/coach pictures: keep the original or cut out a square around the face -->
      <div class="photo-type">
        <div class="type-buttons">
          <button v-for="type in photoTypes" :key="type.value" :class="{'active': teamStore.photoType === type.value}" @click="teamStore.photoType = type.value">{{ type.label }}</button>
        </div>
        <label v-if="teamStore.photoType !== 'team'" class="mode-toggle">
          <span :class="{'active': !teamStore.keepOriginal}">Vierkant uitknippen</span>
          <input type="checkbox" v-model="teamStore.keepOriginal" />
          <span class="switch"></span>
          <span :class="{'active': teamStore.keepOriginal}">Origineel formaat</span>
        </label>
      </div>
  
      <RouterLink to="/"><img class="logo" src="/src/assets/logo-gems.png" /></RouterLink>
    </nav>
  
    <section v-if="teamStore.selectedTeam">
      <TeamBooth v-if="teamStore.photoType === 'team'" v-bind="selectedAsset" />
      <PhotoBooth v-else v-bind="selectedAsset" @next-picture="selectNextPicture()" />
    </section>
  </template>
  
  <script setup>
  import PhotoBooth from '../components/PhotoBooth.vue';
  import TeamBooth from '../components/TeamBooth.vue';
  import AssetItem from '../components/AssetItem.vue';
  import {ref} from 'vue';
  import { useTeamStore } from '../stores/team';
  import router from '../router';

  const photoTypes = [
    {value: 'team', label: 'Teamfoto'},
    {value: 'player', label: 'Spelersfoto'},
    {value: 'coach', label: 'Coachfoto'}
  ];

  const teamStore = useTeamStore();
  if(teamStore.selectedTeam == null) {
    router.push('/');
  } else {
    teamStore.fetchTeam();
  }
  
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
      display: flex;
      align-items: center;
      gap: 12px;
      box-sizing: border-box;
    }

    .assets {
      flex: 1 1 auto;
      min-width: 0;
      height: 100%;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      overflow-y: hidden;
    }

    nav a {
      flex: 0 0 auto;
      height: 100%;
    }

    nav .logo {
      height: 100%;
    }
  
    section {
      height: 80%;
    }
  
    .fileinput {
      display: inline-block;
      cursor: pointer;
      border-radius: 3px 0 0 3px;
      border: 1px solid #CED4DA;
      padding: 24px;
      color: #ED1B25;
      background-color: #30353c;
      /*width: 113px;*/
      box-sizing: border-box;
  
      flex: 0 0 auto;
      margin: 0 12px;
      height: 70%;
    }

    .photo-type {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .type-buttons {
      display: flex;
    }

    .type-buttons button {
      padding: 12px 16px;
      font-size: 1em;
      border: 1px solid #30353c;
      background-color: #30353c;
      color: #fff;
      cursor: pointer;
    }

    .type-buttons button.active {
      background-color: #f9f9f9;
      color: #ED1B25;
      font-weight: 700;
    }

    .mode-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8em;
      color: #f5c2c4;
      cursor: pointer;
      user-select: none;
    }

    .mode-toggle .active {
      color: #fff;
      font-weight: 700;
    }

    .mode-toggle input {
      display: none;
    }

    .mode-toggle .switch {
      position: relative;
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background-color: #30353c;
    }

    .mode-toggle .switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background-color: #f9f9f9;
      transition: left 0.15s;
    }

    .mode-toggle input:checked + .switch::after {
      left: 23px;
    }
  </style>
