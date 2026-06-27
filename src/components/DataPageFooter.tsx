import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { projectStrings } from '@/project-strings'

interface DataPageFooterProps {
  collection:
    | 'actions'
    | 'companies'
    | 'organisingGroups'
    | 'countries'
    | 'categories'
    | 'campaigns'
  id: string
}

function getApiDocTag(collection: DataPageFooterProps['collection']): string {
  // Map collection names to their API doc tag names
  const tagMap: Record<DataPageFooterProps['collection'], string> = {
    actions: 'actions',
    companies: 'companies',
    organisingGroups: 'organisingGroups',
    countries: 'countries',
    categories: 'categories',
    campaigns: 'campaigns',
  }
  return tagMap[collection]
}

export function DataPageFooter({ collection, id }: DataPageFooterProps) {
  const apiUrl = `/api/${collection}/${id}`
  const apiDocsUrl = `${projectStrings.baseUrl}/api/docs#tag/${getApiDocTag(collection)}`

  return (
    <div className="bg-white px-4 md:px-6 py-4 border-t border-gray-200">
      <div className="flex flex-wrap gap-3 items-center justify-between text-xs font-mono">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-gray-600">Public API:</span>
          <a
            href={apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {apiUrl}
          </a>
          <span className="text-gray-400">•</span>
          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            API Documentation →
          </a>
        </div>
        <Link href="/data">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Get the data
          </Button>
        </Link>
      </div>
    </div>
  )
}
