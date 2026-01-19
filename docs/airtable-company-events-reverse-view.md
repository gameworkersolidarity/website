# Setting Up Reverse View of Events on Companies in Airtable

## Overview

This document explains how to configure the Airtable base to display a reverse view of Solidarity Actions (events) on the Companies table. This allows administrators to see all events associated with each company directly from the Companies table.

## Prerequisites

- Access to the Game Worker Solidarity Airtable base
- Editor or Creator permissions in Airtable

## Understanding the Relationship

The application uses a **many-to-many** relationship between:
- **Companies** table
- **Solidarity Actions** table (events)

This means:
- One company can be associated with many solidarity actions
- One solidarity action can be associated with multiple companies

## Configuration Steps

### 1. Verify the Companies Table Has the Linked Field

1. Open your Airtable base
2. Navigate to the **Companies** table
3. Look for a field called **"Solidarity Actions"**

If this field doesn't exist, create it:
1. Click the **+** button to add a new field
2. Select **"Link to another record"** as the field type
3. Name the field **"Solidarity Actions"**
4. Choose **"Solidarity Actions"** as the table to link to
5. Click **"Create field"**

### 2. Configure the Reverse Field (Automatic)

When you create the linked field in step 1, Airtable automatically creates a reverse field in the Solidarity Actions table. This reverse field is typically called **"Company"** or **"Companies"**.

To verify or configure this reverse field:
1. Navigate to the **Solidarity Actions** table
2. Look for a field called **"Company"**
3. If it doesn't exist or needs to be renamed:
   - Go back to the Companies table
   - Click on the **"Solidarity Actions"** field header
   - Click **"Customize field type"**
   - Under "Link to Solidarity Actions", you'll see an option to customize the reverse field name
   - Ensure it's named **"Company"**

### 3. Add the Field to Your Views

To make the reverse relationship visible in your Airtable views:

#### In the Companies table:
1. Open the view you want to modify (e.g., "Grid view")
2. Click **"Hide fields"** (eye icon)
3. Ensure **"Solidarity Actions"** is checked/visible
4. Optionally, drag the field to reorder columns for better visibility

#### In the Solidarity Actions table:
1. Open the view you want to modify (e.g., "Live view")
2. Click **"Hide fields"**
3. Ensure **"Company"** is checked/visible
4. Optionally, drag the field to reorder columns

### 4. Configure Field Display Options

For better readability, you can configure how the linked records are displayed:

1. Click on the **"Solidarity Actions"** field header in the Companies table
2. Click **"Customize field type"**
3. Under "Linked record display", choose which field to show:
   - **"Name"** (recommended) - Shows the action name
   - **"Date"** - Shows when the action occurred
   - Or select multiple fields to display

## Expected Behavior

Once configured, you should see:

### In the Companies Table:
- A column called **"Solidarity Actions"** 
- Each company row shows linked solidarity actions as clickable records
- Clicking on a linked record opens the full solidarity action details

### In the Solidarity Actions Table:
- A column called **"Company"**
- Each action row shows which company/companies it's associated with
- Clicking on a linked record opens the company details

## Code References

The application expects these field names in the TypeScript types:

**Company interface** (`data/types.ts`):
```typescript
export interface Company extends BaseRecord {
  fields: {
    Name: string;
    Summary?: string;
    'Solidarity Actions'?: string[]  // Array of linked record IDs
  }
  solidarityActions?: SolidarityAction[],  // Populated at runtime
  summary: CopyType
}
```

**SolidarityActionAirtableRecord interface** (`data/types.ts`):
```typescript
export interface SolidarityActionAirtableRecord extends BaseRecordWithSyncedCDNMap {
  fields: {
    // ... other fields ...
    'Company'?: string[],  // Array of linked company IDs
    companyName?: string[]  // Rollup/lookup field for display
    // ... other fields ...
  }
}
```

## Troubleshooting

### The linked field doesn't show any records

**Cause**: The records might not be linked yet.

**Solution**: 
1. Open a Company record
2. Click on the "Solidarity Actions" field
3. Search for and select the solidarity actions that relate to this company
4. The reverse link will be created automatically

### I see "Company" but no company names appear

**Cause**: The records aren't linked, or the link is broken.

**Solution**:
1. Check the Solidarity Actions table
2. Click on the "Company" field in a solidarity action record
3. Link it to the appropriate company
4. The link should appear in both tables

### The field exists but isn't visible in my view

**Cause**: The field is hidden in the current view.

**Solution**:
1. Click the "Hide fields" icon (eye icon) in your view
2. Check the box next to "Solidarity Actions" or "Company"
3. The field should now be visible

## API Impact

The application code uses these relationships to fetch related data:

```typescript
// Fetch companies with their solidarity actions
export const getCompanyDataByCode = async (name: string): Promise<CompanyData> => {
  const company = await getCompanyByName(name)
  const solidarityActions = await getLiveSolidarityActionsByCompanyId(company.id)
  
  return {
    company: {
      ...company,
      solidarityActions
    }
  }
}
```

The application filters solidarity actions by company using:
```typescript
const filterByFormula = `FIND("${id}", ARRAYJOIN({Company})) > 0`
```

This requires the "Company" field to exist and be populated in the Solidarity Actions table.

## Additional Resources

- [Airtable Linked Records Documentation](https://support.airtable.com/hc/en-us/articles/218734758-A-beginner-s-guide-to-linked-records)
- [Airtable Rollup Fields](https://support.airtable.com/hc/en-us/articles/360042312694-Rollup-field) (for aggregating data from linked records)
- Project README: [README.md](../README.md)

## Support

If you encounter issues with this configuration:
1. Check that you have editor permissions in Airtable
2. Verify that both tables exist in your base
3. Contact the development team via the project's communication channels
