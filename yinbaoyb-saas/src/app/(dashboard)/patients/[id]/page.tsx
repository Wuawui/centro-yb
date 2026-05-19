import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PatientDetailClient from "./PatientDetailClient";

export const dynamic = "force-dynamic";

async function getPatient(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return null;
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  return <PatientDetailClient patient={JSON.parse(JSON.stringify(patient))} />;
}