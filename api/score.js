import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log("Corps reçu :", req.body); // 👈 Ajouté pour debug

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { firstname, lastname, email, time_in_seconds } = req.body;

  if (!firstname || !lastname || !email || !time_in_seconds) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("leaderboard")
    .insert([{ firstname, lastname, email, time_in_seconds }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Score enregistré avec succès !" });
}
