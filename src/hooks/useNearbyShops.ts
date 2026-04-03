import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Shop {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  verified: boolean;
  distance_miles: number;
}

const FIVE_MILES_IN_METERS = 8047;

export function useNearbyShops(lat: number | null, lng: number | null) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) return;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase.rpc('nearby_shops', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: FIVE_MILES_IN_METERS,
      });

      if (err) {
        setError(err.message);
      } else {
        setShops(data ?? []);
      }
      setLoading(false);
    })();
  }, [lat, lng]);

  return { shops, loading, error, isEmpty: !loading && shops.length === 0 };
}
