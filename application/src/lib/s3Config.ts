import { S3Client } from "@aws-sdk/client-s3";

// Environment variables
export const REGION = process.env.NEXT_PUBLIC_S3_REGION!;
export const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;
export const ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!;
export const SECRET_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!;
export const PYTHON_BACKEND = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL!;

// Disable checksum validation
process.env.AWS_S3_DISABLE_CHECKSUM_VALIDATION = "true";

// S3 Client instance
export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
