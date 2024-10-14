<template>
    <main>
        <h3>Selecteer een team</h3>
        <!-- Dropdown with all possible teams -->
        <select v-model="selectedTeam" class="team-select" @change="teamSelected">
            <option v-for="team in teamStore.teams" :key="team.id" :value="team.id">
                <span v-if="team.type.toLowerCase() != 'jeugd'">{{ team.type }} {{ team.naam }}</span>
                <span v-else>{{ team.naam }}</span>
            </option>
        </select>

        <nav class="nav-buttons">
            <RouterLink to="/photobooth"><button>Spelersfoto's</button></RouterLink>
            <RouterLink to="/teambooth"><button>Teamfoto</button></RouterLink>
        </nav>
    </main>
</template>

<script setup>
    import { ref } from 'vue';
    import { useTeamStore } from '../stores/team';
    
    let selectedTeam = ref(null);
    let teamStore = useTeamStore();
    teamStore.fetchTeams();

    const teamSelected = () => {
        teamStore.selectTeam(selectedTeam.value);
    }
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
        background-color: #30353c;
    }

    h3 {
        text-align: center;
        color: #ddd;
        padding-top: 5%;
    }

    .team-select {
        text-align: center;
        padding: 10px;
        display: inline-block;
        width: 40%;
        font-size: 1.1em;
        margin-top: 5%;
        margin-left: 30%;
    }

    .nav-buttons {
        width: 40%;
        margin-left: 30%;
        margin-top: 10%;
    }

    .nav-buttons button {
        width: 50%;
        padding: 30px;
        font-size: 1.1em;
        cursor: pointer;
    }
</style>