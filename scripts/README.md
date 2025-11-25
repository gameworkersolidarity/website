# Scripts

This directory contains utility scripts for managing the Payload CMS instance.

## Create User Script

Creates a new Payload user with email and password authentication.

### Usage

```bash
# Using the npm script (recommended)
pnpm run create:user --email <email> --password <password>

# Or directly with tsx
tsx scripts/create-user.ts --email <email> --password <password>
```

### Options

- `-e, --email <email>` - Email address for the new user (required)
- `-p, --password <password>` - Password for the new user (required)

### Examples

```bash
# Using long form options
pnpm run create:user --email admin@example.com --password mySecurePassword123

# Using short form options
pnpm run create:user -e admin@example.com -p mySecurePassword123

# Get help
pnpm run create:user --help
```

### Notes

- The command checks if a user with the given email already exists before creating a new one

---

## Airtable to Payload CMS Migration Script

This script migrates data from Airtable to Payload CMS collections.

## Prerequisites

1. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

2. Required environment variables in `.env`:
   - `PAYLOAD_SECRET` - Your Payload secret key (used to sign tokens)
   - `POSTGRES_URL` - Your PostgreSQL connection string
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (for media uploads)
   - `AIRTABLE_API_KEY` - Your Airtable API key (for migration)
   - `AIRTABLE_BASE_ID` - Your Airtable base ID (default: "appeAmlnDhmq6QSDi")

3. Optional environment variables for custom Airtable table names:
   - `AIRTABLE_COUNTRIES_TABLE` (default: "Countries")
   - `AIRTABLE_COMPANIES_TABLE` (default: "Companies")
   - `AIRTABLE_CATEGORIES_TABLE` (default: "Categories")
   - `AIRTABLE_ORGANISING_GROUPS_TABLE` (default: "Organising Groups")
   - `AIRTABLE_SOLIDARITY_ACTIONS_TABLE` (default: "Solidarity Actions")
   - `AIRTABLE_BLOG_POSTS_TABLE` (default: "Blog Posts")

## Running the Migration

```bash
# Using the npm script (recommended)
pnpm run migrate:airtable

# Or directly with tsx
tsx scripts/migrate-from-airtable.ts
```

## What Gets Migrated

The script migrates data in the following order:

1. **Countries** - Independent entities
2. **Companies** - Independent entities  
3. **Categories** - Independent entities
4. **Organising Groups** - Has relationships to Countries
5. **Solidarity Actions** - Has relationships to Countries, Companies, Categories, and Organising Groups
6. **Blog Posts** - Independent content

## Features

- **Idempotent**: Running the script multiple times is safe - it won't create duplicates
- **Relationship Resolution**: Automatically resolves relationships between entities using Airtable IDs
- **Rich Text Conversion**: Converts HTML content to Lexical rich text format
- **File Upload**: Downloads attachments from Airtable and uploads them to Payload CMS Media collection
- **Error Handling**: Skips problematic records and continues migration
- **Progress Reporting**: Shows real-time progress and summary statistics
- **Deduplication**: Avoids re-uploading the same files by tracking URLs

## Field Mappings

### Countries
- `Name` → Name
- `countryCode` → countryCode
- `Slug` → Slug
- `Summary` → Summary (converted to rich text)

### Companies
- `Name` → Name
- `Summary` → Summary (converted to rich text)

### Categories
- `Name` → Name
- `Emoji` → Emoji
- `Summary` → Summary (converted to rich text)

### Organising Groups
- `Name` → Name
- `slug` → slug
- `Full Name` → FullName
- `Country` (array of slugs) → Country (resolved to IDs)
- `IsUnion` → IsUnion
- `Website` → Website
- `Bluesky` → Bluesky
- `Twitter` → Twitter
- `LastModified` → LastModified

### Solidarity Actions
- `Name` → Name
- `slug` → slug
- `Location` → Location
- `Summary` → Summary (converted to rich text)
- `Date` → Date
- `LastModified` → LastModified
- `Link` → Link
- `LocationData` → LocationData
- `Country` (array of slugs) → Country (resolved to IDs)
- `Company` (array of names) → Company (resolved to IDs)
- `Organising Groups` (array of slugs) → OrganisingGroups (resolved to IDs)
- `Category` (array of names) → Category (resolved to IDs)
- `DisplayStyle` → DisplayStyle
- `hasPassedValidation` → hasPassedValidation
- `Public` → Public

### Blog Posts
- `Slug` → Slug
- `Title` → Title
- `ByLine` → ByLine
- `Image` (attachments) → Image (uploads to Media collection, uses first image)
- `Summary` → Summary (converted to rich text)
- `Body` → Body (converted to rich text)
- `Date` → Date
- `Public` → Public

### Solidarity Actions - Files
- `Document` (attachments array) → Document (uploads all attachments to Media collection)

## Notes

- The script uses Payload's Lexical rich text format for rich text fields
- Relationships are resolved using Airtable IDs for accurate mapping
- Files are downloaded from Airtable and uploaded to Payload's Media collection
- File uploads are cached by URL to avoid duplicates
- Large files (>10MB) are skipped with a warning
- HTML tags are stripped from content when converting to rich text
- Date fields are parsed and converted to ISO format
- The script checks for existing records using `airtableId` to avoid duplicates

