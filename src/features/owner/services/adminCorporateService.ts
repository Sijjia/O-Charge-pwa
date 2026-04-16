import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";

// --- Zod Schemas ---

export const CorporateEmployeeSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  role: z.string(),
  position: z.string().nullable().optional(),
  monthly_limit: z.number().nullable().optional(),
  daily_limit: z.number().nullable().optional(),
  current_month_spent: z.number().optional().default(0),
  current_day_spent: z.number().optional().default(0),
  remaining: z.number().nullable().optional(),
  is_active: z.boolean(),
  phone: z.string().optional().default(""),
  name: z.string().optional().default(""),
});

export const CorporateGroupSchema = z.object({
  id: z.string(),
  company_name: z.string(),
  inn: z.string().nullable().optional(),
  legal_address: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  balance: z.number().optional().default(0),
  credit_limit: z.number().optional().default(0),
  monthly_limit: z.number().nullable().optional(),
  billing_type: z.string().optional().default("prepaid"),
  current_month_spent: z.number().optional().default(0),
  contract_number: z.string().nullable().optional(),
  contract_date: z.string().nullable().optional(),
  contract_expires: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
  blocked_reason: z.string().nullable().optional(),
  created_at: z.string().optional().default(""),
  updated_at: z.string().optional().default(""),
  employees_count: z.number().optional().default(0),
});

export const CorporateGroupDetailSchema = CorporateGroupSchema.extend({
  employees: z.array(CorporateEmployeeSchema).optional().default([]),
});

const GroupsListResponseSchema = z.object({
  success: z.boolean(),
  groups: z.array(CorporateGroupSchema),
  total: z.number().optional(),
}).passthrough();

const GroupDetailResponseSchema = z.object({
  success: z.boolean(),
  data: CorporateGroupDetailSchema,
}).passthrough();

const CreateGroupResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    company_name: z.string(),
  }),
}).passthrough();

const SuccessResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

const TopupResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    balance_before: z.number(),
    balance_after: z.number(),
  }),
}).passthrough();

const EmployeesListResponseSchema = z.object({
  success: z.boolean(),
  employees: z.array(CorporateEmployeeSchema),
}).passthrough();

const AddEmployeeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
  }),
}).passthrough();

const ReportResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    company_name: z.string(),
    period: z.object({
      start: z.string(),
      end: z.string(),
    }),
    summary: z.object({
      total_amount: z.number(),
      sessions_count: z.number(),
      employees_charged: z.number(),
    }),
    by_employee: z.array(z.object({
      employee_id: z.string(),
      name: z.string(),
      position: z.string().nullable().optional(),
      sessions_count: z.number(),
      amount: z.number(),
    })),
  }),
}).passthrough();

// --- Types ---

export type CorporateGroup = z.infer<typeof CorporateGroupSchema>;
export type CorporateGroupDetail = z.infer<typeof CorporateGroupDetailSchema>;
export type CorporateEmployee = z.infer<typeof CorporateEmployeeSchema>;

export interface CreateGroupBody {
  company_name: string;
  inn?: string;
  legal_address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  billing_type?: string;
  monthly_limit?: number | null;
  credit_limit?: number;
  contract_number?: string;
  contract_date?: string;
  contract_expires?: string;
}

export interface UpdateGroupBody {
  company_name?: string;
  inn?: string | null;
  legal_address?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  monthly_limit?: number | null;
  credit_limit?: number | null;
  billing_type?: string;
}

export interface AddEmployeeBody {
  user_id: string;
  role?: string;
  position?: string;
  monthly_limit?: number | null;
  daily_limit?: number | null;
}

export interface UpdateEmployeeBody {
  role?: string;
  position?: string | null;
  monthly_limit?: number | null;
  daily_limit?: number | null;
  is_active?: boolean;
}

// --- API Methods ---

const BASE = "/api/v1/admin/corporate";

export async function listGroups(includeInactive = false) {
  const url = includeInactive ? `${BASE}/groups?include_inactive=true` : `${BASE}/groups`;
  return fetchJson(url, { method: "GET" }, GroupsListResponseSchema);
}

export async function getGroup(id: string) {
  return fetchJson(`${BASE}/groups/${id}`, { method: "GET" }, GroupDetailResponseSchema);
}

export async function createGroup(body: CreateGroupBody) {
  return fetchJson(`${BASE}/groups`, {
    method: "POST",
    body,
  }, CreateGroupResponseSchema);
}

export async function updateGroup(id: string, body: UpdateGroupBody) {
  return fetchJson(`${BASE}/groups/${id}`, {
    method: "PUT",
    body,
  }, SuccessResponseSchema);
}

export async function topupBalance(id: string, amount: number, description?: string) {
  return fetchJson(`${BASE}/groups/${id}/topup`, {
    method: "POST",
    body: { amount, description },
  }, TopupResponseSchema);
}

export async function blockGroup(id: string, reason: string) {
  return fetchJson(`${BASE}/groups/${id}/block`, {
    method: "POST",
    body: { reason },
  }, SuccessResponseSchema);
}

export async function unblockGroup(id: string) {
  return fetchJson(`${BASE}/groups/${id}/unblock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, SuccessResponseSchema);
}

export async function getReport(id: string, periodStart: string, periodEnd: string, employeeId?: string) {
  const params = new URLSearchParams({ period_start: periodStart, period_end: periodEnd });
  if (employeeId) params.set("employee_id", employeeId);
  return fetchJson(`${BASE}/groups/${id}/report?${params}`, { method: "GET" }, ReportResponseSchema);
}

export async function listEmployees(groupId: string, includeInactive = false) {
  const url = includeInactive
    ? `${BASE}/groups/${groupId}/employees?include_inactive=true`
    : `${BASE}/groups/${groupId}/employees`;
  return fetchJson(url, { method: "GET" }, EmployeesListResponseSchema);
}

export async function addEmployee(groupId: string, body: AddEmployeeBody) {
  return fetchJson(`${BASE}/groups/${groupId}/employees`, {
    method: "POST",
    body,
  }, AddEmployeeResponseSchema);
}

export async function updateEmployee(groupId: string, employeeId: string, body: UpdateEmployeeBody) {
  return fetchJson(`${BASE}/groups/${groupId}/employees/${employeeId}`, {
    method: "PUT",
    body,
  }, SuccessResponseSchema);
}

export async function removeEmployee(groupId: string, employeeId: string) {
  return fetchJson(`${BASE}/groups/${groupId}/employees/${employeeId}`, {
    method: "DELETE",
  }, SuccessResponseSchema);
}
