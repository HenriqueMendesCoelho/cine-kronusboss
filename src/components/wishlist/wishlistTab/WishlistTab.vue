<template>
  <div class="row full-width justify-center">
    <div class="col-12 scroll">
      <SearchToolbar
        v-model:input-search="searchText"
        @search="firstSearch()"
        @refresh="resetSearch()"
        @input-search-focus="
          ($event) => {
            if (!$event) selectedIndexMenu = undefined;
            menuIsFocused = $event;
          }
        "
        @keydown-enter:input-search="searchFromIndexMenu"
        @keydown-up:input-search="moveSelection(-1)"
        @keydown-down:input-search="moveSelection(1)"
        @keydown-esc:input-search="selectedIndexMenu = undefined"
        :show-select="false"
        :separeted-input-event="true"
      >
        <template #prepend>
          <div>
            <q-btn icon="arrow_back_ios" flat round @click="emit('back')" />
            <CustomTooltip :delay="500">Voltar para minhas listas</CustomTooltip>
          </div>
        </template>
        <template #append v-if="_wishlist?.user.id === userId">
          <BtnMoviesAlreadyRated :wishlist="_wishlist" @update:wishlist="_wishlist = $event" />
          <div>
            <q-toggle
              :model-value="shareable"
              @update:model-value="changeShareable"
              size="xl"
              color="kb-primary"
              checked-icon="public"
              unchecked-icon="public_off"
            />
            <CustomTooltip :delay="500">{{ shareable ? 'Lista Pública' : 'Lista Privada' }}</CustomTooltip>
          </div>
          <div class="mobile-hide">
            <div>
              <q-btn @click="allowDrag = true" icon="reorder" :disable="allowDrag" flat round />
              <CustomTooltip v-if="!allowDrag" :delay="500">Reordernar lista</CustomTooltip>
            </div>
          </div>
        </template>
        <template #input-search>
          <q-menu class="bg-grey-mid text-white" fit no-focus no-refocus no-parent-event v-model="showMenu">
            <q-list dense dark>
              <q-item
                ref="itensMenuRef"
                active-class="text-kb-primary bg-grey-mid2"
                v-for="(movie, index) in moviesWhenTyping"
                :key="movie.tmdb_id"
                :active="selectedIndexMenu === index"
                bordered
                clickable
              >
                <q-item-section @click="searchFromMenu(movie.title)" v-close-popup class="q-pl-sm">{{
                  movie.title || movie.title_english || 'Erro ao carregar título'
                }}</q-item-section>
              </q-item>
              <q-separator dark v-if="moviesWhenTyping?.length ? moviesWhenTyping?.length > 1 : false" />
            </q-list>
          </q-menu>
        </template>
      </SearchToolbar>
    </div>
    <div class="row justify-center q-mt-lg">
      <div class="row justify-center" :class="isDesktop ? 'q-col-gutter-xl' : 'q-col-gutter-xs'" v-if="moviesFiltered?.length">
        <div
          class="col-auto"
          v-for="(movie, index) in moviesFiltered"
          :key="movie.tmdb_id"
          :draggable="allowDrag"
          @dragstart="dragStart(index)"
          @dragover.prevent
          @drop="drop(index)"
          :style="{ opacity: draggedItemIndex === index ? '0.5' : '1' }"
        >
          <WishlistCardImage
            :movie="movie"
            :wishlists="otherWishlists"
            :show-remove-item="wishlist?.user.id === userId"
            :animate="!allowDrag"
            @click-on-image="openDialogSummary(movie.tmdb_id)"
            @remove-movie="openConfirmDialogRemoveMovie(movie)"
            @copy-url="copyMovieUrl(movie.tmdb_id)"
            :style="allowDrag && 'cursor: all-scroll'"
          />
        </div>
        <FloatingActionBtnTop class="desktop-only" />
      </div>
      <div class="row justify-center" v-else>
        <div class="text-h3 text-white">Ainda não há filmes nessa lista...</div>
      </div>
    </div>
    <ConfirmDialog ref="confirmDialogRef" @ok="deleteMovieFromWishlist()" />
    <DialogFormMovieSummary v-model="showDialogMovieSummary" :movie-id="movieIdDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { QItem, useQuasar } from 'quasar';
import { copyToClipboard } from 'quasar';
import { useRouter } from 'vue-router';

import type { WishlistType } from 'src/types/wishlist/WishlistType';

import SearchToolbar from 'src/components/shared/searchToolbar/SearchToolbar.vue';
import WishlistCardImage from './wishlistCardImage/WishlistCardImage.vue';
import CustomTooltip from 'src/components/shared/customTooltip/CustomTooltip.vue';
import DialogFormMovieSummary from 'src/components/shared/formMovieSummary/dialogFormMovieSummary/DialogFormMovieSummary.vue';
import FloatingActionBtnTop from 'src/components/shared/floatingActionBtnTop/FloatingActionBtnTop.vue';
import ConfirmDialog from 'src/components/shared/confirmDialog/ConfirmDialog.vue';
import BtnMoviesAlreadyRated from './btnMoviesAlreadyRated/BtnMoviesAlreadyRated.vue';

import { useUserStore } from 'src/stores/UserStore';
import WishlistService from 'src/services/WishlistService';
import { showError, showSuccess } from 'src/utils/NotificationUtils';
import { hideLoading, showLoading } from 'src/utils/LoadingUtils';

const $q = useQuasar();
const isDesktop = $q.platform.is.desktop;
const router = useRouter();

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
const props = defineProps<{
  wishlist?: WishlistType;
  wishlists: WishlistType[];
  idParam?: string;
}>();

const emit = defineEmits<{
  (e: 'back', value: void): void;
  (e: 'update:wishlist', value: WishlistType | undefined): void;
  (e: 'search-wishlist', value: void): void;
}>();

const userStore = useUserStore();
const userId = userStore.user.id;
const searchText = ref('');
const menuIsFocused = ref(false);
const _wishlist = ref<WishlistType>();
const moviesFiltered = ref<WishlistType['movies_wishlists']>();
const moviesWhenTyping = ref<WishlistType['movies_wishlists']>();
const shareable = ref(false);
const showDialogMovieSummary = ref(false);
const movieIdDialog = ref<number>();
const movieIdToDelete = ref<number>();
const otherWishlists = ref<WishlistType[]>([]);
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog>>();
const showMenu = computed<boolean>(() => {
  return !!searchText.value && menuIsFocused.value && !!moviesWhenTyping.value?.length;
});
const allowDrag = ref(false);
const draggedItemIndex = ref<number | null>(null);
const selectedIndexMenu = ref<number | undefined>(undefined);
const itensMenuRef = ref<InstanceType<typeof QItem>[]>();

onMounted(async () => {
  if (props?.idParam) {
    await searchWishlistById();
  }
  initializeVars();
});

watch(
  () => searchText.value,
  () => {
    moviesWhenTyping.value = filterMovies();
  }
);
watch(
  () => props.wishlist,
  () => {
    if (!props?.wishlist) {
      return;
    }

    _wishlist.value = props?.wishlist;
    moviesFiltered.value = props?.wishlist?.movies_wishlists;
    shareable.value = props?.wishlist?.shareable || false;
  }
);
watch(
  () => _wishlist.value,
  (val) => {
    emit('update:wishlist', val);
  },
  { deep: true }
);
watch(
  () => allowDrag.value,
  (val) => {
    if (!val) {
      return;
    }

    $q.notify({
      icon: 'announcement',
      color: 'grey-mid',
      message: 'Reordene sua lista! Arraste e solte as imagens para organizá-las como desejar',
      position: 'top',
      progress: true,
      timeout: 3000,
      actions: [
        {
          icon: 'close',
          color: 'white',
        },
      ],
    });

    $q.notify({
      color: 'grey-mid',
      message: 'Deseja salvar a ordenação?',
      position: 'bottom',
      timeout: 0,
      multiLine: false,
      actions: [
        {
          icon: 'done',
          color: 'white',
          handler() {
            reorderWishlistAndUpdate();
          },
        },
        {
          icon: 'close',
          color: 'white',
          handler() {
            allowDrag.value = false;
            searchWishlistById();
          },
        },
      ],
    });
  }
);

function firstSearch() {
  searchMoviesAction();
}
function resetSearch() {
  searchText.value = '';
  searchMoviesAction();
}
function searchMoviesAction() {
  moviesFiltered.value = filterMovies();
}
function filterMovies() {
  if (!searchText.value) {
    return _wishlist.value?.movies_wishlists;
  }

  return _wishlist.value?.movies_wishlists?.filter(
    (m) => m.title?.includes(searchText.value) || m.title_english.includes(searchText.value)
  );
}
function searchFromMenu(title?: string) {
  searchText.value = title || '';
  searchMoviesAction();
}
function initializeVars() {
  _wishlist.value = !_wishlist.value?.id ? props?.wishlist : _wishlist.value;
  otherWishlists.value = props.wishlists.filter((w) => w.id !== _wishlist.value?.id);
  moviesFiltered.value = props?.wishlist?.movies_wishlists;
  shareable.value = props?.wishlist?.shareable || false;
}
async function searchWishlistById() {
  if (!props?.idParam) {
    return;
  }

  try {
    showLoading();
    const res = await WishlistService.searchWishlistById(props.idParam);

    if (!res) {
      showError('Lista não existe ou não é pública');
      router.push('/home');
    }

    _wishlist.value = res;
    moviesFiltered.value = res?.movies_wishlists;
  } catch {
    showError('Erro ao carregar lista de filmes');
    router.push('/home');
  } finally {
    hideLoading();
  }
}
async function changeShareable(val: boolean) {
  if (!_wishlist.value) {
    return;
  }

  shareable.value = val;
  _wishlist.value.shareable = val;
  await updateWishlist(_wishlist.value);
}
function openConfirmDialogRemoveMovie(movie: ArrayElement<WishlistType['movies_wishlists']>) {
  movieIdToDelete.value = movie.tmdb_id;
  confirmDialogRef.value?.show({
    message: `Tem certeza que deseja remover '${movie.title || movie.title_english}' dessa lista? Caso remova não há como desfazer a ação.`,
    focus: 'cancel',
    title: 'Quer mesmo remover?',
    ok: 'Sim',
  });
}
async function deleteMovieFromWishlist() {
  if (!_wishlist.value) {
    return;
  }

  _wishlist.value.movies_wishlists = _wishlist.value?.movies_wishlists.filter((m) => m.tmdb_id !== movieIdToDelete.value);
  const res = await updateWishlist(_wishlist.value);
  if (!res) {
    return;
  }
  _wishlist.value = res;
  moviesFiltered.value = res.movies_wishlists;
  showSuccess('Filme deletado da lista');
}
async function updateWishlist(wishlist: WishlistType) {
  try {
    showLoading();
    return await WishlistService.updateWishlist(wishlist);
  } catch (error) {
    showError('Erro ao salvar lista de filmes');
  } finally {
    hideLoading();
  }
}
function openDialogSummary(tmdbId: number) {
  if (!tmdbId) {
    return;
  }
  movieIdDialog.value = tmdbId;
  showDialogMovieSummary.value = true;
}
function copyMovieUrl(id: number) {
  if (!id) {
    return;
  }

  copyToClipboard(`${window.location.origin}/movie/discover?movie=${id}`)
    .then(() => showSuccess('URL copiada'))
    .catch(() => showError('Erro ao copiar URL'));
}
function dragStart(index: number) {
  draggedItemIndex.value = index;
}
function drop(index: number) {
  if (!moviesFiltered.value || !draggedItemIndex.value) {
    return;
  }

  const draggedItem = moviesFiltered.value[draggedItemIndex.value];
  moviesFiltered.value?.splice(draggedItemIndex.value, 1);
  moviesFiltered.value?.splice(index, 0, draggedItem);
  draggedItemIndex.value = null;
}
async function reorderWishlistAndUpdate() {
  allowDrag.value = false;
  if (!_wishlist.value) {
    return;
  }
  const res = await updateWishlist(_wishlist.value);
  if (!res) {
    return;
  }
  _wishlist.value = res;
  moviesFiltered.value = res.movies_wishlists;
  showSuccess('Lista reordenada');
}
function moveSelection(step: number) {
  const newIndex = (selectedIndexMenu.value ?? -1) + step;
  const lenght = moviesWhenTyping.value?.length || 0;
  if (newIndex >= 0 && newIndex < lenght) {
    selectedIndexMenu.value = newIndex;
  }
  if (itensMenuRef.value?.length && selectedIndexMenu.value) {
    itensMenuRef.value[selectedIndexMenu.value]?.$el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function searchFromIndexMenu() {
  if (selectedIndexMenu.value === undefined || !moviesWhenTyping.value?.length) {
    firstSearch();
    return;
  }
  searchFromMenu(moviesWhenTyping.value[selectedIndexMenu.value].title);
}
</script>
