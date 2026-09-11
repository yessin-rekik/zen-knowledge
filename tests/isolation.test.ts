import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vecteur factice de dimension 384 (même valeur partout = similarité parfaite entre tous les chunks)
const FAKE_EMBEDDING = new Array(384).fill(0.1);

describe("Isolation par société (RLS + RPC match_chunks)", () => {
  let companyAId: string;
  let companyBId: string;
  let docAId: string;
  let docBId: string;

  beforeAll(async () => {
    // Crée deux sociétés de test
    const { data: companyA } = await supabaseAdmin
      .from("companies")
      .insert({ name: "Test Company A" })
      .select("id")
      .single();
    companyAId = companyA!.id;

    const { data: companyB } = await supabaseAdmin
      .from("companies")
      .insert({ name: "Test Company B" })
      .select("id")
      .single();
    companyBId = companyB!.id;

    // Un document publié par société, visible pour "admin"
    const { data: docA } = await supabaseAdmin
      .from("documents")
      .insert({
        company_id: companyAId,
        title: "Doc Société A",
        visibility_roles: ["admin"],
        status: "published",
        version: 1,
      })
      .select("id")
      .single();
    docAId = docA!.id;

    const { data: docB } = await supabaseAdmin
      .from("documents")
      .insert({
        company_id: companyBId,
        title: "Doc Société B",
        visibility_roles: ["admin"],
        status: "published",
        version: 1,
      })
      .select("id")
      .single();
    docBId = docB!.id;

    // Un chunk identique (même embedding) par document
    await supabaseAdmin.from("document_chunks").insert([
      {
        document_id: docAId,
        version: 1,
        content: "Contenu confidentiel de la société A",
        embedding: FAKE_EMBEDDING,
        is_active: true,
      },
      {
        document_id: docBId,
        version: 1,
        content: "Contenu confidentiel de la société B",
        embedding: FAKE_EMBEDDING,
        is_active: true,
      },
    ]);
  });

  afterAll(async () => {
    // Nettoyage
    await supabaseAdmin.from("document_chunks").delete().in("document_id", [docAId, docBId]);
    await supabaseAdmin.from("documents").delete().in("id", [docAId, docBId]);
    await supabaseAdmin.from("companies").delete().in("id", [companyAId, companyBId]);
  });

  it("ne retourne jamais un chunk de la société B pour un utilisateur de la société A, même avec un score de similarité identique", async () => {
    const { data, error } = await supabaseAdmin.rpc("match_chunks", {
      query_embedding: FAKE_EMBEDDING,
      p_company_id: companyAId,
      p_role: "admin",
      match_threshold: 0.0, // seuil à zéro pour forcer la recherche à considérer tous les chunks
      match_count: 10,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const documentIds = data!.map((row: any) => row.document_id);

    expect(documentIds).toContain(docAId);
    expect(documentIds).not.toContain(docBId);
  });

  it("ne retourne aucun chunk si le rôle ne correspond pas à visibility_roles", async () => {
    const { data, error } = await supabaseAdmin.rpc("match_chunks", {
      query_embedding: FAKE_EMBEDDING,
      p_company_id: companyAId,
      p_role: "employee", // le document est visible seulement pour "admin"
      match_threshold: 0.0,
      match_count: 10,
    });

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});