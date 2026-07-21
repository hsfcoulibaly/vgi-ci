import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return NextResponse.json({ error: "Twilio non configuré" }, { status: 503 });
  }

  try {
    const { telephone, message } = await req.json();
    if (!telephone || !message) return NextResponse.json({ error: "telephone et message requis" }, { status: 400 });

    const to = normalizePhone(telephone);
    const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({ To: to, From: from, Body: message });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.message ?? "Erreur Twilio" }, { status: 400 });
    return NextResponse.json({ success: true, sid: data.sid });
  } catch (err) {
    return NextResponse.json({ error: "Erreur réseau : " + String(err) }, { status: 500 });
  }
}
