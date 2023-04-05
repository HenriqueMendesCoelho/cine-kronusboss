import { defineStore } from 'pinia';

export const useStyleStore = defineStore('StyleStore', {
  state: () => {
    return {
      backgroundColor: '#0b0e14',
      sideBarWidth: '7rem',
      is_expanded: false,
      layoutSettings: { darkMode: true },
    };
  },
  getters: {
    getMarginSideBar(state) {
      const is_expanded = localStorage.getItem('is_expanded') == 'true' ? true : false;

      state.is_expanded = is_expanded;

      if (is_expanded) {
        state.sideBarWidth = '320px';
      }

      return state.sideBarWidth;
    },
  },
  actions: {
    ToggleMenuStore() {
      this.is_expanded ? this.collapseMenu() : this.expandMenu();
    },
    collapseMenu() {
      this.is_expanded = false;
      this.sideBarWidth = '7rem';
    },
    expandMenu() {
      this.is_expanded = true;
      this.sideBarWidth = '320px';
    },
    setIsExpanded(newValue: boolean) {
      this.is_expanded = newValue;
    },
    darkThemeToggle() {
      if (localStorage.getItem('theme') == 'dark') {
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        this.layoutSettings.darkMode = false;
      } else {
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        this.layoutSettings.darkMode = true;
      }
    },
  },
});
