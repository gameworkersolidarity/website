import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'
import { Command } from 'commander'

const program = new Command()

program
  .name('set-password')
  .description('Set a new password for an existing Payload user')
  .version('1.0.0')
  .requiredOption('-e, --email <email>', 'Email address of the user')
  .requiredOption('-p, --password <password>', 'New password for the user')
  .parse()

async function setPassword(email: string, password: string) {
  console.log('🚀 Initializing Payload...')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('✓ Payload initialized successfully')

  // Find the user
  console.log(`\n🔍 Looking up user with email "${email}"...`)
  const existingUser = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: email,
      },
    },
    limit: 1,
  })

  if (existingUser.docs.length === 0) {
    console.error(`❌ User with email "${email}" not found`)
    process.exit(1)
  }

  const user = existingUser.docs[0]
  console.log(`✓ Found user: ${user.email} (ID: ${user.id})`)

  // Update the password
  console.log(`\n📝 Setting new password...`)
  try {
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
      },
    })

    console.log(`✅ Password updated successfully!`)
    console.log(`   ID: ${updatedUser.id}`)
    console.log(`   Email: ${updatedUser.email}`)
    process.exit(0)
  } catch (error: any) {
    console.error(`❌ Error updating password:`, error.message)
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.message}`)
      })
    }
    process.exit(1)
  }
}

// Main execution
async function main() {
  const options = program.opts()
  await setPassword(options.email, options.password)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

