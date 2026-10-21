import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { obtenerToken } from './token';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface Order {
  id?: number;
  customerEmail: string;
  totalAmount: number;
  status: 'CREADO' | 'ACEPTADO' | 'EN_PREPARACIÓN' | 'DESPACHADO' | 'ENTREGADO' | 'CANCELADO';
  createdAt?: string;
}

export interface DashboardData {
  products: Product[];
  orders: Order[];
}

// Auxiliar para peticiones autenticadas
async function fetchConAuth(
  instance: IPublicClientApplication,
  account: AccountInfo,
  endpoint: string,
  options: RequestInit = {}
) {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('Complete VITE_API_BASE_URL y reinicie Vite');
  }

  const result = await obtenerToken(instance, account);
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${result.accessToken}`,
      ...options.headers,
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return body ? JSON.parse(body) : null;
}

export async function consultarDashboard(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<DashboardData> {
  return fetchConAuth(instance, account, '/api/dashboard');
}

export async function crearProductoApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  product: Product
): Promise<Product> {
  return fetchConAuth(instance, account, '/api/catalog/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function crearPedidoApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  order: Order
): Promise<Order> {
  return fetchConAuth(instance, account, '/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function actualizarEstadoPedidoApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  id: number,
  status: Order['status']
): Promise<Order> {
  return fetchConAuth(instance, account, `/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}