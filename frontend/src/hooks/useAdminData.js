// hooks/useAdminData.js
import { useState, useEffect, useCallback } from 'react';

//const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


/**
 * Hook genérico para cualquier endpoint del panel admin.
 *
 * @param {string} endpoint  – p.ej. '/admin/resumen'
 * @param {object} params    – query params opcionales { estado, limite, pagina }
 *
 * @returns { data, loading, error, refetch }
 */
export const useAdminData = (endpoint, params = {}) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams(params).toString();
      const url   = `${API_BASE}${endpoint}${query ? `?${query}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Función auxiliar para llamadas de mutación (PATCH / POST / DELETE).
 * No es un hook, se llama directamente desde handlers.
 *
 * @param {string} endpoint
 * @param {object} body
 * @param {'PATCH'|'POST'|'DELETE'} method
 */
export const adminAction = async (endpoint, body = {}, method = 'PATCH') => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
};