import { watch } from 'chokidar'
import { spawn } from 'child_process'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const payloadTypesPath = path.resolve(__dirname, '../src/payload-types.ts')

console.log(`👀 Watching ${payloadTypesPath} for changes...`)

let isGenerating = false
let debounceTimer: NodeJS.Timeout | null = null

const watcher = watch(payloadTypesPath, {
  persistent: true,
  ignoreInitial: true,
})

watcher.on('change', (filePath) => {
  if (isGenerating) {
    console.log('⏳ Zod schema generation already in progress, queuing...')
    return
  }

  // Debounce rapid changes
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    console.log(`\n🔄 ${filePath} changed, regenerating Zod schemas...`)
    isGenerating = true

    const generateProcess = spawn('pnpm', ['generate:zod'], {
      stdio: 'inherit',
      shell: true,
    })

    generateProcess.on('close', (code) => {
      isGenerating = false
      if (code === 0) {
        console.log('✅ Zod schemas regenerated successfully\n')
      } else {
        console.error(`❌ Failed to regenerate Zod schemas (exit code: ${code})\n`)
      }
    })
  }, 500) // 500ms debounce
})

watcher.on('error', (error) => {
  console.error('❌ Watcher error:', error)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Zod schema watcher...')
  watcher.close()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  watcher.close()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  process.exit(0)
})
