# TRUST LOOP

## Team Members
- Faisal Adams
- Alfred Emmanuel
- Emeka Samuel
- Ndujekwu Peter

---

## 🚀 Live Demo

* **Live Application:** <a href="https://zenith-trust-loop.vercel.app/kyc" target="_blank">https://zenith-trust-loop.vercel.app/kyc</a>

* **Backend API:** <a href="https://zenith-trust-loop.vercel.app/api" target="_blank">https://zenith-trust-loop.vercel.app/api</a>

* **PYTHON AI MODEL API:** <a href="https://tbd-model-api-171401893406.us-central1.run.app/docs" target="_blank">https://tbd-model-api-171401893406.us-central1.run.app/docs</a>


---

## 🎯 The Problem

**Challenge Eight — Seamless Digital KYC and Liveness Verification**

**The Core Problem**  
Remote customer onboarding remains cumbersome and time-consuming, with many users abandoning the process due to friction in verification. Financial institutions struggle to balance convenience, security, and compliance — all while ensuring that digital identity verification remains accurate, privacy-preserving, and user-friendly.

**The Big Question**  
>How might we reimagine KYC with seamless, privacy-preserving onboarding that integrates Optical Character Recognition (OCR), facial liveness detection, and national ID verification to reduce drop-offs and accelerate trust?

**Scope**  
- Enable instant, remote KYC verification that doesn’t rely solely on manual review or physical presence.  
- Integrate OCR, liveness detection, and national ID systems (BVN/NIN) for end-to-end verification.  
- Design a unified, privacy-conscious identity layer that can be reused across financial institutions.
- Simplify onboarding for users while maintaining full regulatory compliance and high verification accuracy.

---

## ✨ Our Solution

Summarily,
**Trust Loop** is an AI-powered KYC platform that verifies users’ identities and addresses instantly using both official records and digital signals.

It begins by validating BVN/NIN, performing liveness detection through a live selfie, and confirming addresses using a combination of OCR, AI-based location intelligence, and device history to generate a confidence score.

When digital signals are insufficient, Trust Loop employs a hybrid model that leverages on-demand dispatch networks (like Jumia or Bolt) for rapid, physical address validation.

This dual approach ensures a seamless, privacy-conscious, and near-instant KYC verification process—reducing onboarding time from days to seconds.


---

## 🛠️ Tech Stack

* **Framework:** Next.js (handles both frontend and backend through API routes)  
* **Styling:** Tailwind CSS  
* **Database:** MongoDB (MongoDB Atlas)  
* **Storage / Media:** AWS S3 Bucket (for image/document uploads and processing)  
* **Deployment:** Vercel (serverless deployment for both UI and APIs)  
* **AI / ML integrations:** FastAPI, Azure Vision (OCR, image and video analysis for liveness and location check)

---

## ⚙️ How to Set Up and Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/Alfred-Emmanuel/Trust-loop.git
   ```
2. Navigate to the project directory:

   ```bash
   cd <project-directory>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```
   
4. Create a `.env` file and add the necessary environment variables:

   ```
    CLOUDINARY_API_SECRET=your_cloudinary_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    NEXT_PUBLIC_PYTHON_BACKEND_URL=your_backend_url

    NEXT_PUBLIC_S3_REGION=eu-north-1
    NEXT_PUBLIC_S3_BUCKET_NAME=tbd-files
    NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_aws_access_key
    NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    NEXT_PUBLIC_DISTANCE_THRESHOLD=15000000

    EMAIL_USER=your_email
    EMAIL_PASS=your_email_app_password
    ```
   
5. Run the development server:

   ```bash
   npm run dev
   ```

6. Run python server:
   ```bash
   ./ai_model/run.sh
   ```

7. Visit http://localhost:3000 or whatever url is logged to view the app locally.
