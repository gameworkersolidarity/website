import { AccessArgs } from 'payload'

export function draftModeAccessControl({ req }: AccessArgs) {
  // If there is a user logged in,
  // let them retrieve all documents
  if (req.user) return true

  // If there is no user,
  // restrict the documents that are returned
  // to only those where `_status` is equal to `published`
  return {
    _status: {
      equals: 'published',
    },
  }
}

/**
 * Field-level access: allow read only when a user is logged in.
 * Use as `access: { read: loggedInUserOnly }` on fields that must be hidden from anonymous users.
 */
export function loggedInUserOnly({ req }: { req: { user?: unknown } }) {
  return !!req.user
}

/**
 * Collection afterRead hook that strips given fields from the document when no user is logged in.
 * Use when field-level access alone may not be applied (e.g. in some API responses).
 */
export function loggedInUserOnlyFieldsHook(fieldNames: string[]) {
  return ({ doc, req }: { doc: Record<string, unknown>; req: { user?: unknown } }) => {
    if (req.user) return doc
    for (const name of fieldNames) {
      delete doc[name]
    }
    return doc
  }
}
