#!/bin/sh
# Check if Payload-related files have changed and regenerate types if needed

# Exit early if not in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check if any Payload config, collection, or global files changed
PAYLOAD_FILES_CHANGED=false

for file in $STAGED_FILES; do
  case "$file" in
    src/payload.config.ts)
      PAYLOAD_FILES_CHANGED=true
      break
      ;;
    src/collections/*.ts)
      PAYLOAD_FILES_CHANGED=true
      break
      ;;
    src/globals/*.ts)
      PAYLOAD_FILES_CHANGED=true
      break
      ;;
  esac
done

if [ "$PAYLOAD_FILES_CHANGED" = true ]; then
  echo "🔄 Payload files changed, regenerating types and Zod schemas..."
  
  if pnpm generate:types && pnpm generate:zod; then
    # Stage the generated files
    git add src/payload-types.ts src/payload-zod-schemas.ts 2>/dev/null || true
    echo "✅ Types and Zod schemas regenerated and staged"
  else
    echo "❌ Failed to generate types or Zod schemas"
    exit 1
  fi
fi
