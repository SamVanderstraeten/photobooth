<template>
    <main>
        <h3>Selecteer een team</h3>
        <!-- Buttons for all possible teams -->
        <div class="team-list">
            <span v-for="team in teamStore.teams" :key="team.id" @click="teamSelected(team)" class="team-name" :class="{'selected': isSelected(team)}">
                <template v-if="team.type.toLowerCase() != 'jeugd'">{{ team.type }} {{ team.naam }}</template>
                <template v-else>{{ team.naam }}</template>
            </span>
        </div>
    </main>
</template>

<script setup>
    import { useTeamStore } from '../stores/team';
    import router from '../router';

    let teamStore = useTeamStore();
    teamStore.fetchTeams();

    // the kind of picture (team, player, coach) is chosen in the photobooth itself
    const teamSelected = (team) => {
        teamStore.selectTeam(team);
        router.push('/photobooth');
    }

    const isSelected = (team) => {
        return teamStore.selectedTeam != null && teamStore.selectedTeam.id === team.id;
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

    .team-list {
        width: 60%;
        margin-left: 20%;
        margin-top: 3%;
        max-height: 75%;
        overflow-y: auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .team-list .team-name {
        display: inline-block;
        padding: 10px;
        margin: 5px;
        background-color: #ED1B25;
        color: #fff;
        cursor: pointer;
    }

    .team-list .team-name:hover,
    .team-list .team-name.selected {
        background-color: #f9f9f9;
        color: #ED1B25;
    }

    nav {
        background-color: none;
    }
</style>
