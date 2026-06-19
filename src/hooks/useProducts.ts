import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/inventoryService";
import { supabase } from "../lib/supabaseClient";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshQueuedRef = useRef(false);

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

  useEffect(() => {
    const channel = supabase
      .channel("stockflow-products-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          if (refreshQueuedRef.current) return;

          refreshQueuedRef.current = true;
          window.setTimeout(() => {
            refreshQueuedRef.current = false;
            void fetchProducts();
          }, 160);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return { products, loading, fetchProducts };
};
