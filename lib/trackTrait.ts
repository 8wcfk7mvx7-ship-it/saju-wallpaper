export function trackTraits(traits: (string | null | undefined)[], page: string) {
  for (const trait of traits) {
    if (!trait) continue;
    fetch("/api/track-trait", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trait, page }),
    }).catch(() => {});
  }
}
