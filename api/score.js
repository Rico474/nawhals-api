import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch"; // Assure-toi de l’installer : npm install node-fetch

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

async function trackGameEndEvent(email, firstname, lastname, timeInSeconds) {
  const response = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "event",
        attributes: {
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: email,
                first_name: firstname,
                last_name: lastname,
              },
            },
          },
          metric: { data: { type: "metric", attributes: { name: "MemoryGameCompleted" } } },
          properties: { time_in_seconds: timeInSeconds },
          timestamp: new Date().toISOString(),
        },
      },
    }),
  });

  if (!response.ok) {
    console.error("Erreur en envoyant l'événement à Klaviyo :", await response.text());
  } else {
    console.log("Événement envoyé à Klaviyo avec succès !");
  }
}

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

  const { firstname, lastname, email, time_in_seconds } = req.body;

  if (!firstname || !lastname || !email || !time_in_seconds) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  // Vérification email
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
    .from("leaderboard")
    .insert([{ firstname, lastname, email, time_in_seconds }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  // Envoie un événement à Klaviyo après avoir sauvegardé le score
  await trackGameEndEvent(email, firstname, lastname, time_in_seconds);

  return res.status(200).json({ message: "Score enregistré avec succès !" });
}
