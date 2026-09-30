/** GitHub Pages has no server. The local reader in nlp.ts answers the question. */
export async function interpretWithGrok(_input: { data: { text: string } }): Promise<{ ok: false; error: string }> {
  return { ok: false, error: "Using the on-page reader. Cloud wording help is not available on this host." }
}
