import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!  // ⚠️ UTILISE LA CLÉ ANON
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  const { firstname, lastname, email, time_in_seconds } = await req.json();

  if (!firstname || !lastname || !email || !time_in_seconds) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const { error } = await supabase.from("leaderboard").insert([
    { firstname, lastname, email, time_in_seconds },
  ]);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Score enregistré avec succès !" },
    { status: 200, headers: corsHeaders }
  );
}

export async function GET() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("time_in_seconds", { ascending: true })
    .limit(50);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200, headers: corsHeaders });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
