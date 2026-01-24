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
