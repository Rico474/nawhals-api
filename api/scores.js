import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // On autorise uniquement les requêtes GET pour récupérer les scores
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Initialisation du client Supabase avec tes variables d'environnement
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Récupérer les 50 meilleurs scores triés par temps
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("time_in_seconds", { ascending: true })
    .limit(50);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  // Autoriser toutes les origines (CORS) pour que Shopify puisse appeler l'API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return res.status(200).json(data);
}
