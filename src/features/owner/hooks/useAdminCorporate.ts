import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as corpApi from "../services/adminCorporateService";
import type {
  CreateGroupBody,
  UpdateGroupBody,
  AddEmployeeBody,
  UpdateEmployeeBody,
  CorporateGroup,
} from "../services/adminCorporateService";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";

const GROUPS_KEY = ["admin", "corporate", "groups"] as const;
const groupKey = (id: string) => ["admin", "corporate", "group", id] as const;
const employeesKey = (groupId: string) => ["admin", "corporate", "employees", groupId] as const;

const DEMO_CORPORATE_GROUPS: CorporateGroup[] = [
  { id: "cg-001", company_name: "ОАО Бишкек Транс", billing_type: "prepaid", balance: 45000, credit_limit: 0, current_month_spent: 8400, employees_count: 12, is_active: true, created_at: "2025-06-01T00:00:00Z", updated_at: new Date().toISOString(), contact_phone: "+996 312 555 001", contact_email: "fleet@btrans.kg" },
  { id: "cg-002", company_name: "ООО Азия Карго", billing_type: "postpaid", balance: 0, credit_limit: 30000, current_month_spent: 12100, employees_count: 7, is_active: true, created_at: "2025-07-01T00:00:00Z", updated_at: new Date().toISOString(), contact_phone: "+996 312 555 002", contact_email: "ev@asiacargo.kg" },
  { id: "cg-003", company_name: "ГП Авиация Кыргызстана", billing_type: "prepaid", balance: 120000, credit_limit: 0, current_month_spent: 31200, employees_count: 25, is_active: true, created_at: "2025-08-01T00:00:00Z", updated_at: new Date().toISOString(), contact_phone: "+996 312 555 003", contact_email: "transport@ka.kg" },
];

export function useCorporateGroups(includeInactive = false) {
  return useQuery({
    queryKey: [...GROUPS_KEY, { includeInactive }],
    queryFn: () => {
      if (isDemoModeActive()) return Promise.resolve({ success: true, groups: DEMO_CORPORATE_GROUPS, total: DEMO_CORPORATE_GROUPS.length });
      return corpApi.listGroups(includeInactive);
    },
    staleTime: 30_000,
  });
}

export function useCorporateGroup(id: string | undefined) {
  return useQuery({
    queryKey: groupKey(id || ""),
    queryFn: () => corpApi.getGroup(id!),
    enabled: !!id,
  });
}

export function useCreateCorporateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => corpApi.createGroup(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useUpdateCorporateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateGroupBody }) =>
      corpApi.updateGroup(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(vars.id) });
    },
  });
}

export function useTopupCorporateBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, description }: { id: string; amount: number; description?: string }) =>
      corpApi.topupBalance(id, amount, description),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(vars.id) });
    },
  });
}

export function useBlockCorporateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      corpApi.blockGroup(id, reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(vars.id) });
    },
  });
}

export function useUnblockCorporateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => corpApi.unblockGroup(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(id) });
    },
  });
}

export function useCorporateReport(id: string, periodStart: string, periodEnd: string, employeeId?: string) {
  return useQuery({
    queryKey: ["admin", "corporate", "report", id, periodStart, periodEnd, employeeId],
    queryFn: () => corpApi.getReport(id, periodStart, periodEnd, employeeId),
    enabled: !!id && !!periodStart && !!periodEnd,
    staleTime: 60_000,
  });
}

export function useCorporateEmployees(groupId: string | undefined, includeInactive = false) {
  return useQuery({
    queryKey: [...employeesKey(groupId || ""), { includeInactive }],
    queryFn: () => corpApi.listEmployees(groupId!, includeInactive),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useAddCorporateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: string; body: AddEmployeeBody }) =>
      corpApi.addEmployee(groupId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
      qc.invalidateQueries({ queryKey: employeesKey(vars.groupId) });
    },
  });
}

export function useUpdateCorporateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, employeeId, body }: { groupId: string; employeeId: string; body: UpdateEmployeeBody }) =>
      corpApi.updateEmployee(groupId, employeeId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
      qc.invalidateQueries({ queryKey: employeesKey(vars.groupId) });
    },
  });
}

export function useRemoveCorporateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, employeeId }: { groupId: string; employeeId: string }) =>
      corpApi.removeEmployee(groupId, employeeId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
      qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
      qc.invalidateQueries({ queryKey: employeesKey(vars.groupId) });
    },
  });
}
