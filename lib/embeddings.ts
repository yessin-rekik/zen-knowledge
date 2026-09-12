import "server-only";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export async function embedText(text: string): Promise<number[]> {
  const result = await client.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  // Le résultat peut être un tableau simple ou un tableau de tableaux selon le modèle — on normalise
  return Array.isArray(result[0]) ? (result as unknown as number[][])[0] : (result as number[]);
}