import { useCallback, useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/inventoryService";

type ProductsSnapshot = {
  products: Product[];
  loading: boolean;
};

let snapshot: ProductsSnapshot = {
  products: [],
  loading: true,
};
let hasLoaded = false;
let activeRequest: Promise<void> | null = null;
const subscribers = new Set<() => void>();

const publish = (next: ProductsSnapshot) => {
  snapshot = next;
  subscribers.forEach((subscriber) => subscriber());
};

const loadProducts = async () => {
  if (activeRequest) return activeRequest;

  publish({ ...snapshot, loading: true });

  activeRequest = (async () => {
    const { data, error } = await getProducts();

    if (error) {
      console.error("Unable to load products:", error.message);
      publish({ products: snapshot.products, loading: false });
    } else {
      hasLoaded = true;
      publish({ products: data || [], loading: false });
    }
  })().finally(() => {
    activeRequest = null;
  });

  return activeRequest;
};

export const useProducts = () => {
  const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);

  const fetchProducts = useCallback(async () => {
    await loadProducts();
  }, []);

  useEffect(() => {
    const updateSnapshot = () => setCurrentSnapshot(snapshot);
    subscribers.add(updateSnapshot);
    updateSnapshot();

    if (!hasLoaded) {
      void loadProducts();
    }

    return () => {
      subscribers.delete(updateSnapshot);
    };
  }, []);

  useEffect(() => {
    const handleRefreshProducts = () => {
      void loadProducts();
    };

    window.addEventListener("stockflow:refresh-products", handleRefreshProducts);

    return () => {
      window.removeEventListener(
        "stockflow:refresh-products",
        handleRefreshProducts
      );
    };
  }, []);

  return {
    products: currentSnapshot.products,
    loading: currentSnapshot.loading,
    fetchProducts,
  };
};
