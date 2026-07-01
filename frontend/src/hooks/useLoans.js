import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useLoans() {
  const { profile } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoans = useCallback(async () => {
    if (!profile?.id) {
      setLoans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("loans")
      .select("*")
      .eq("shop_id", profile.id)
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setLoans(data || []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  async function addLoan(loan) {
    const { data, error: err } = await supabase
      .from("loans")
      .insert({ ...loan, shop_id: profile.id })
      .select()
      .single();
    if (err) throw err;
    setLoans((prev) => [data, ...prev]);
    return data;
  }

  async function updateLoanStatus(id, status) {
    const { data, error: err } = await supabase
      .from("loans")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    setLoans((prev) => prev.map((l) => (l.id === id ? data : l)));
    return data;
  }

  async function deleteLoan(id) {
    const { error: err } = await supabase.from("loans").delete().eq("id", id);
    if (err) throw err;
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }

  return { loans, loading, error, addLoan, updateLoanStatus, deleteLoan, refetch: fetchLoans };
}