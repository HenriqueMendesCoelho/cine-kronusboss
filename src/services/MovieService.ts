import axios from 'axios';
import StringUtils from '@/utils/stringUtils';

import { MovieFoundByName, MovieNoteType, MoviePageableType, MovieRequestType, MovieSummaryTypeKit } from '@/types/movie/MovieType';
import Movie from '@/domain/movie/movie';

const BASE_URL = process.env.VUE_APP_KB_CINE_API;
const API_MOVIE = `${BASE_URL}/api/movie`;

export default {
  //Movie TMDB
  async getMovieSummary(movieIdTmdb: string): Promise<MovieSummaryTypeKit> {
    try {
      const res = await axios.get(`${API_MOVIE}/tmdb/${movieIdTmdb}/summary`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async getMoviesByName(payload: { query: string }): Promise<MovieFoundByName> {
    const params = StringUtils.getStringParams(payload);
    try {
      const res = await axios.get(`${API_MOVIE}/tmdb?${params}`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  //Movie Cine
  async getMovie(movieId: string): Promise<Movie> {
    try {
      const res = await axios.get(`${API_MOVIE}/${movieId}`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async listMoviesPageable(page: number, sort = 'portugueseTitle,cres', size = 50): Promise<MoviePageableType> {
    try {
      const res = await axios.get(`${API_MOVIE}/list?page=${page}&sort=${sort}&size=${size}`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async listMoviesByTitlePageable(page: number, title: string, size = 50): Promise<MoviePageableType> {
    try {
      const res = await axios.get(`${API_MOVIE}?page=${page}&query=${title}&size=${size}`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async createMovie(payload: MovieRequestType): Promise<Movie> {
    try {
      const res = await axios.post(`${API_MOVIE}`, payload);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async updateMovie(payload: MovieRequestType): Promise<Movie> {
    try {
      const res = await axios.put(`${API_MOVIE}/${payload.id}/update`, payload);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  //Genres
  async getMoviesGenres(): Promise<Array<{ id: number; name: string }>> {
    try {
      const res = await axios.get(`${API_MOVIE}/genre`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  //Movie Notes
  async createMovieNote(note: number, movieId?: string | Array<string>) {
    try {
      const res = await axios.post(`${API_MOVIE}/note`, { movie_id: movieId, note });
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async getMovieNotes(movieId?: string | Array<string>): Promise<Array<MovieNoteType>> {
    try {
      const res = await axios.get(`${API_MOVIE}/note/${movieId}`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async updateMovieNotes(note: number, movieId?: string | Array<string>): Promise<Array<MovieNoteType>> {
    try {
      const res = await axios.patch(`${API_MOVIE}/note/${movieId}/update`, { note });
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async deleteMovieNotes(movieId?: string | Array<string>): Promise<Array<MovieNoteType>> {
    try {
      const res = await axios.delete(`${API_MOVIE}/note/${movieId}/delete`);
      return res.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
};
