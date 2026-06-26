import { extractCoverPalette, generatedPalette, seedFor } from "./spineColors.js";

function loadAndExtract(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(extractCoverPalette(img));
    img.onerror = () => resolve(null);
    img.src = url;
    // Don't let a slow/broken cover host stall the add flow.
    setTimeout(() => resolve(null), 4000);
  });
}

// Builds the book.spine appearance object. Physical books try to sample
// their cover; everything else (and any failed extraction) falls back to a
// hash-derived palette so the same title/author always looks the same.
export async function buildSpine(book) {
  if (book.format === "physical" && book.coverUrl) {
    const palette = await loadAndExtract(book.coverUrl);
    if (palette) return { source: "cover", ...palette };
  }
  return { source: "generated", ...generatedPalette(seedFor(book), book.format) };
}
