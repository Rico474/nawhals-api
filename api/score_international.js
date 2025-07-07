import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { firstname, lastname, email, time_in_seconds, country } = req.body;

  if (!firstname || !lastname || !email || !time_in_seconds || !country) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  // Vérification email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Email invalide" });
  }

  // Vérification temps
  if (typeof time_in_seconds !== "number" || time_in_seconds <= 0) {
    return res.status(400).json({ error: "Temps invalide" });
  }

  // Vérification mots offensants
  const BANNED_WORDS = [
    "pute", "salope", "connard", "enculé", "raciste", "nazi", "facho", "nègre",
    "pédé", "gouine", "chienne", "batard", "con"
  ];

  function containsOffensiveWord(text) {
    const lower = text.toLowerCase();
    return BANNED_WORDS.some(word => lower.includes(word));
  }

  if (containsOffensiveWord(firstname) || containsOffensiveWord(lastname)) {
    return res.status(400).json({ error: "Nom ou prénom offensant détecté" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from("leaderboard_international")
    .insert([{ firstname, lastname, email, time_in_seconds, country }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Score enregistré avec succès (International) !" });
}
