import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createWorker } from "tesseract.js";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Performs OCR on a File object to extract text.
 * @param file The image file (e.g., from an <input type="file"> event).
 * @returns A promise that resolves to the extracted text.
 */
export async function getAddressOnUtility(file: File): Promise<string> {
  const worker = await createWorker("eng");

  try {
    const {
      data: { text },
    } = await worker.recognize(file);

    return text;
  } catch (error) {
    console.error("OCR failed:", error);
    return "Error during OCR processing.";
  } finally {
    await worker.terminate();
  }
}
