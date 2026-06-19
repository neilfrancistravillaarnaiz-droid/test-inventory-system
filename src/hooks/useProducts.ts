import { useCallback, useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/inventoryService";
import { supabase } from "../lib/supabaseClient";

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
let refreshQueued = false;
let realtimeStarted = false;
const subscribers = new Set<() => void>();

const publish = (next: ProductsSnapshot) => {
  snapshot = next;
  subscribers.forEach((subscriber) => subscriber());
};

const loadProducts = async (force = false) => {
  if (activeRequest) {
    if (force) refreshQueued = true;
    return activeRequest;
  }

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

    if (refreshQueued) {
      refreshQueued = false;
      void loadProducts();
    }
  });

  return activeRequest;
};

const startRealtimeProducts = () => {
  if (realtimeStarted) return;

  realtimeStarted = true;
  supabase
    .channel(`stockflow-products-live-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => {
        void loadProducts(true);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`Products realtime subscription status: ${status}`);
      }
    });
};

export const useProducts = () => {
  const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);

  const fetchProducts = useCallback(async () => {
    await loadProducts(true);
  }, []);

  useEffect(() => {
    const updateSnapshot = () => setCurrentSnapshot(snapshot);
    subscribers.add(updateSnapshot);
    updateSnapshot();
    startRealtimeProducts();

    if (!hasLoaded) {
      void loadProducts();
    }

    return () => {
      subscribers.delete(updateSnapshot);
    };
  }, []);

  useEffect(() => {
    const handleRefreshProducts = () => {
      void loadProducts(true);
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
