export type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  supplier: string | null;
  quantity: number;
  price: number;
  low_stock_limit: number;
  image_url?: string | null;
  warehouse?: string | null;
  shelf?: string | null;
  rack?: string | null;
  bin?: string | null;
  created_at: string;
};

export type ProductInput = {
  name: string;
  sku: string;
  category: string;
  supplier: string;
  quantity: number;
  price: number;
  low_stock_limit: number;
  image_url?: string;
  warehouse?: string;
  shelf?: string;
  rack?: string;
  bin?: string;
};