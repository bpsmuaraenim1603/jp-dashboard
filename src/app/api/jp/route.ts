import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/jp
export async function POST(req: Request) {
  const body = await req.json(); // { employee_name: "..." }

  const { error } = await supabase.from("jp_entries").insert(body);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
