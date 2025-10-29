import type { CollectionConfig } from 'payload'

export const MenuItems: CollectionConfig = {
  slug: 'menuItems',
  admin: {
    useAsTitle: 'label',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'placement',
      type: 'select',
      hasMany: true,
      options: ['Header', 'Footer'],
      required: true,
    },
  ],
}
