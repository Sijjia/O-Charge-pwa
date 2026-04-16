import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminEquipmentService,
  type ManufacturerFilters,
  type ModelFilters,
  type Manufacturer,
  type EquipmentModel,
} from "../services/adminEquipmentService";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";

// ─── Queries ─────────────────────────────────────────────────────────

export function useEquipmentManufacturers(filters?: ManufacturerFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "equipment", "manufacturers", filters],
    queryFn: () => adminEquipmentService.listManufacturers(filters),
    enabled: isAuthenticated,
  });
}

export function useEquipmentManufacturer(id: string | undefined) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "equipment", "manufacturers", id],
    queryFn: () => adminEquipmentService.getManufacturer(id!),
    enabled: isAuthenticated && !!id,
  });
}

export function useEquipmentModels(filters?: ModelFilters) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "equipment", "models", filters],
    queryFn: () => adminEquipmentService.listModels(filters),
    enabled: isAuthenticated,
  });
}

export function useEquipmentModel(id: string | undefined) {
  const isAuthenticated = useUnifiedAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "equipment", "models", id],
    queryFn: () => adminEquipmentService.getModel(id!),
    enabled: isAuthenticated && !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useCreateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Manufacturer>) => adminEquipmentService.createManufacturer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment", "manufacturers"] }),
  });
}

export function useUpdateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Manufacturer> }) =>
      adminEquipmentService.updateManufacturer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment", "manufacturers"] }),
  });
}

export function useDeleteManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminEquipmentService.deleteManufacturer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment", "manufacturers"] }),
  });
}

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EquipmentModel>) => adminEquipmentService.createModel(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment"] }),
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentModel> }) =>
      adminEquipmentService.updateModel(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment"] }),
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminEquipmentService.deleteModel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "equipment"] }),
  });
}
