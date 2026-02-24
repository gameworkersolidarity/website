import { defineConfig, globalIgnores } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import eslintNext from 'eslint-config-next'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = defineConfig([
  {
    extends: [
      ...eslintNext,
      // ...compat.extends('next/core-web-vitals', 'next/typescript'),
      ...compat.extends('prettier'),
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated files (do not lint – style is from codegen)
    '**/payload-types.ts',
    '**/payload-zod-schemas.ts',
    'src/app/(payload)/admin/importMap.js',
  ]),
])

export default eslintConfig
