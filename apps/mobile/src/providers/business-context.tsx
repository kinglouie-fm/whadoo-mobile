import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiGet } from "../lib/api";

interface Business {
  id: string;
  name: string;
  description?: string;
  category?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  logoAsset?: {
    storageKey?: string | null;
    downloadToken?: string | null;
  } | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BusinessContextValue {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<{ business: Business | null }>(
        "/businesses/my",
      );
      setBusiness(data.business);
    } catch (err: any) {
      setError(err.message || "Failed to fetch business");
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return (
    <BusinessContext.Provider
      value={{ business, loading, error, refetch: fetchBusiness }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within BusinessProvider");
  }
  return context;
}
