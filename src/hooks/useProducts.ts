import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/inventoryService";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);

    const { data, error } = await getProducts();

    if (error) {
      alert(error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };

    loadProducts();
  }, []);

  return { products, loading, fetchProducts };
};