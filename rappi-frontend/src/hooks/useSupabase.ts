import { useContext } from "react";
import { SupabaseContext } from "../context/SupabaseContext"; // Nuevo path

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) throw new Error("useSupabase debe usarse dentro de un SupabaseProvider");
  return context;
};