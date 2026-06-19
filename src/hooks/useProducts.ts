import { useCallback, useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/inventoryService";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    const { data, error } = await getProducts();

    if (error) {
      alert(error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };

    loadProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleRefreshProducts = () => {
      void fetchProducts();
    };

    window.addEventListener("stockflow:refresh-products", handleRefreshProducts);

    return () => {
      window.removeEventListener(
        "stockflow:refresh-products",
        handleRefreshProducts
      );
    };
  }, [fetchProducts]);

  return { products, loading, fetchProducts };
};
