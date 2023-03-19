import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { defineStore } from 'pinia';

import { tokenPayload } from '@/types/token/TokenType';

const BASE_URL = process.env.VUE_APP_KB_CINE_API;

export const useUserStore = defineStore('UserStore', {
  state: () => {
    return {
      user: {
        id: '',
        name: '',
        username: '',
        roles: [''],
        expirationToken: Date.now(),
        isLoged: false,
      },
      showDialogLogin: false,
    };
  },
  getters: {
    timeToExpire(): number {
      const until = this.user.expirationToken;
      const dateNow = Math.floor(Date.now() / 1000);

      const diff = until - dateNow;

      const result = diff > 0 ? Math.floor(diff / 60) : 0;

      return result;
    },
    sessionIsCloseToExpire(): boolean | null {
      if (!this.user.isLoged) {
        return null;
      }

      return this.timeToExpire <= 10;
    },
  },
  actions: {
    async login(payload: { email: string; password: string }): Promise<void> {
      try {
        const res = await axios.post(`${BASE_URL}/login`, payload);
        const responsePayload = res.data;
        const token = responsePayload.access_token;

        localStorage.setItem('auth-kb', token);
        this.user.isLoged = true;
        this.showDialogLogin = false;
        this.decodeToken(token);

        return Promise.resolve();
      } catch {
        return Promise.reject();
      }
    },
    async refreshToken(): Promise<void> {
      try {
        axios.post(`${BASE_URL}/refresh-token`);
        return Promise.resolve();
      } catch {
        return Promise.reject();
      }
    },
    decodeToken(token: string) {
      if (!token) {
        return;
      }

      const tokenPayload = jwtDecode(token) as tokenPayload;

      this.user.id = tokenPayload.id;
      this.user.name = tokenPayload.name;
      this.user.roles = tokenPayload.roles;
      this.user.username = tokenPayload.aud;
      this.user.expirationToken = tokenPayload.exp;

      if (this.timeToExpire > 0) {
        this.user.isLoged = true;
      }
    },
  },
});