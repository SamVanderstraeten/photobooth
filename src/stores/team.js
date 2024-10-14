import { defineStore } from 'pinia'

export const useTeamStore = defineStore('team', {
  state: () => {
    return {
      teams: [],
      selectedTeam: null,
      selectedTeamPlayers: []
    }
  },
  actions: {
    async fetchTeams() {
      if(this.teams.length > 0) return;

      const response = await fetch('https://www.gemsdiepenbeek.be/api/ploegen.php');
      const data = await response.json();
      this.teams = data;
    },

    selectTeam(team) {
      this.selectedTeam = team;
      console.log(this.selectedTeam);
    },

    async fetchTeam() {
      if(this.selectedTeam == null) return;

      const response = await fetch(`https://www.gemsdiepenbeek.be/api/ploeg.php?id=${this.selectedTeam}`);
      const data = await response.json();
      this.selectedTeamPlayers = data.spelers;
    }
  }
});