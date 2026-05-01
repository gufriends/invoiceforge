import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { Client, ClientWithStats } from "./client";
import type {
  Invoice,
  InvoiceWithRelations,
  InvoiceListItem,
  InvoiceStats,
} from "./invoice";
import type { Payment } from "./payment";
import type { Company } from "./company";
import type { CreateClientRequest, UpdateClientRequest } from "./api-requests";
import type { CreateInvoiceRequest, UpdateInvoiceRequest } from "./api-requests";
import type { CreatePaymentRequest, UpdatePaymentRequest } from "./api-requests";
import type { UpdateCompanyRequest } from "./api-requests";
import type { PaginatedResponse } from "./api";
import type { OverviewStats, RevenueDataPoint } from "./analytics";

export type UseClientsResult = UseQueryResult<PaginatedResponse<ClientWithStats>, Error>;
export type UseClientResult = UseQueryResult<ClientWithStats, Error>;
export type UseCreateClientMutation = UseMutationResult<Client, Error, CreateClientRequest>;
export type UseUpdateClientMutation = UseMutationResult<Client, Error, { id: string; data: UpdateClientRequest }>;
export type UseDeleteClientMutation = UseMutationResult<void, Error, string>;

export type UseInvoicesResult = UseQueryResult<PaginatedResponse<InvoiceListItem>, Error>;
export type UseInvoiceResult = UseQueryResult<InvoiceWithRelations, Error>;
export type UseInvoiceStatsResult = UseQueryResult<InvoiceStats, Error>;
export type UseCreateInvoiceMutation = UseMutationResult<Invoice, Error, CreateInvoiceRequest>;
export type UseUpdateInvoiceMutation = UseMutationResult<Invoice, Error, { id: string; data: UpdateInvoiceRequest }>;
export type UseDeleteInvoiceMutation = UseMutationResult<void, Error, string>;
export type UseSendInvoiceMutation = UseMutationResult<Invoice, Error, string>;

export type UseCreatePaymentMutation = UseMutationResult<Payment, Error, CreatePaymentRequest>;
export type UseUpdatePaymentMutation = UseMutationResult<Payment, Error, { id: string; data: UpdatePaymentRequest }>;
export type UseDeletePaymentMutation = UseMutationResult<void, Error, string>;

export type UseCompanyResult = UseQueryResult<Company, Error>;
export type UseUpdateCompanyMutation = UseMutationResult<Company, Error, UpdateCompanyRequest>;

export type UseOverviewStatsResult = UseQueryResult<OverviewStats, Error>;
export type UseRevenueDataResult = UseQueryResult<RevenueDataPoint[], Error>;