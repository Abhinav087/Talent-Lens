/**
 * Extracts text content from a PDF ArrayBuffer using PDF.js
 * and caps the output at 6000 words.
 * 
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<string>}
 */
export async function parsePdf(arrayBuffer) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF.js library failed to load from CDN. Please check your internet connection and refresh.");
  }
  
  // Set the worker source path
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }
    
    // Capping at 6000 words
    const words = fullText.trim().split(/\s+/);
    if (words.length > 6000) {
      return words.slice(0, 6000).join(" ");
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file. Ensure it is a valid PDF and not password-protected.");
  }
}
