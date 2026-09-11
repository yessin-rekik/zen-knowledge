import "server-only";
import { PDFParse } from "pdf-parse";
import { supabaseAdmin } from "./db";

const MIN_TEXT_LENGTH = 50; // seuil arbitraire : en dessous, on considère le PDF "scanné vide"

export async function extractTextFromDocument(filePath: string): Promise<{
  text: string;
  status: "ok" | "extraction_failed";
}> {
  const { data, error } = await supabaseAdmin.storage
    .from("documents")
    .download(filePath);

  if (error || !data) {
    throw new Error(`Impossible de télécharger le fichier: ${error?.message}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text.trim();

  if (text.length < MIN_TEXT_LENGTH) {
    return { text: "", status: "extraction_failed" };
  }

  return { text, status: "ok" };
}