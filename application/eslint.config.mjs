import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helps migrate from old-style config to new Flat Config
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Include Next.js recommended configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Your custom rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",

      // 👇 Add this line to silence the "@ts-ignore" warnings
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];
