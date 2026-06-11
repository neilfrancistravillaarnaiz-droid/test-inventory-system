import type { Product } from "../types/Product";

const API_URL = "http://localhost:8000";

export type ProductInput = Omit<Product, "id" | "created_at">;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Backend request failed.");
  }

  return response.json();
};

export const getBackendProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products`);
  return handleResponse<Product[]>(response);
};

export const getBackendProductById = async (
  id: string
): Promise<Product> => {
  const response = await fetch(`${API_URL}/products/${id}`);
  return handleResponse<Product>(response);
};

export const addBackendProduct = async (
  product: ProductInput
): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  return handleResponse<Product[]>(response);
};

export const updateBackendProduct = async (
  id: string,
  product: Partial<ProductInput>
): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  return handleResponse<Product[]>(response);
};

export const deleteBackendProduct = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });

  return handleResponse<{ success: boolean; message: string }>(response);
};