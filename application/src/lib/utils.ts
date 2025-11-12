import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createWorker } from "tesseract.js"; // Import the necessary function

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Performs OCR on a File object to extract text.
 * @param file The image file (e.g., from an <input type="file"> event).
 * @returns A promise that resolves to the extracted text.
 */
export async function getAddressOnUtility(file: File): Promise<string> {
  // 1. Create a Tesseract worker. 'eng' specifies the language (English).
  const worker = await createWorker('eng');

  try {
    // 2. Recognize the text from the File object.
    // Tesseract.js is able to directly process a File object in the browser environment.
    const { data: { text } } = await worker.recognize(file);
    
    // 3. Return the extracted text.
    return text;

  } catch (error) {
    console.error("OCR failed:", error);
    return "Error during OCR processing.";
  } finally {
    // 4. Terminate the worker to clean up resources after the operation.
    await worker.terminate();
  }
}