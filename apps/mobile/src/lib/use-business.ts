import { useEffect, useState } from "react";
import { apiGet } from "./api";

interface Business {
  id: string;
  name: string;
  description?: string;
  category?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<{ business: Business | null }>("/businesses/my");
      setBusiness(data.business);
    } catch (err: any) {
      setError(err.message || "Failed to fetch business");
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  return { business, loading, error, refetch: fetchBusiness };
}
