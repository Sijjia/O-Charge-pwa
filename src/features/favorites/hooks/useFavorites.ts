import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { favoriteService } from "../services/favoriteService";
import { useAuthStatus } from "../../auth/hooks/useAuth";
import { STALE_TIME } from "@/lib/queryClient";
import type { Station } from "@/api/types";

export const useFavorites = () => {
  const { user } = useAuthStatus();
  const queryClient = useQueryClient();

  // Получаем список избранных станций (обновляются через Supabase Realtime)
  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return favoriteService.getFavorites(user.id);
    },
    enabled: !!user?.id,
    staleTime: STALE_TIME.FAVORITES, // 5 минут - оптимизировано для Supabase Realtime
  });

  // Мутация для добавления в избранное
  const addToFavorites = useMutation({
    mutationFn: async (stationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return favoriteService.addToFavorites(user.id, stationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  // Мутация для удаления из избранного
  const removeFromFavorites = useMutation({
    mutationFn: async (stationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return favoriteService.removeFromFavorites(user.id, stationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  // Мутация для переключения статуса избранного (с optimistic update)
  const toggleFavorite = useMutation({
    mutationFn: async (stationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return favoriteService.toggleFavorite(user.id, stationId);
    },
    onMutate: async (stationId: string) => {
      // Отменяем текущие refetch чтобы избежать race condition
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });

      // Сохраняем предыдущее значение для rollback
      const previousFavorites = queryClient.getQueryData<string[]>([
        "favorites",
        user?.id,
      ]);

      // Optimistic update: сразу обновляем UI
      queryClient.setQueryData<string[]>(
        ["favorites", user?.id],
        (old = []) => {
          if (old.includes(stationId)) {
            return old.filter((id) => id !== stationId);
          }
          return [...old, stationId];
        },
      );

      return { previousFavorites };
    },
    onError: (_err, _stationId, context) => {
      // Rollback при ошибке
      if (context?.previousFavorites !== undefined) {
        queryClient.setQueryData(
          ["favorites", user?.id],
          context.previousFavorites,
        );
      }
    },
    onSettled: () => {
      // Синхронизируем с сервером после завершения
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });

  // Проверка, является ли станция избранной
  const isFavorite = (stationId: string): boolean => {
    return favorites.includes(stationId);
  };

  return {
    favorites,
    isLoading,
    error,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    toggleFavorite: toggleFavorite.mutate,
    isFavorite,
    isToggling: toggleFavorite.isPending,
  };
};

// Хук для получения только избранных станций
export const useFavoriteStations = () => {
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const queryClient = useQueryClient();

  const {
    data: favoriteStations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorite-stations", favorites],
    queryFn: async () => {
      if (!favorites || favorites.length === 0) return [];

      // Получаем все станции из кеша или загружаем
      const allStations = queryClient.getQueryData(["stations", true]) as
        | Station[]
        | undefined;

      // Фильтруем только избранные
      return (allStations || []).filter((station: Station) =>
        favorites.includes(station.id),
      );
    },
    enabled: !!favorites && favorites.length > 0,
  });

  return {
    favoriteStations,
    isLoading: isLoading || favoritesLoading,
    error,
    hasFavorites: favorites.length > 0,
  };
};
