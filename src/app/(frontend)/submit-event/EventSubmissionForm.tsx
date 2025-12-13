'use client'

import { useState } from 'react'
import { payloadClient } from '@/utils/payload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EventInitiator } from '@/collections/enums'
import type { Category, Country, Company, OrganisingGroup } from '@/payload-types'

interface EventSubmissionFormProps {
  categories: Category[]
  countries: Country[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
}

export function EventSubmissionForm({
  categories,
  countries,
  companies,
  organisingGroups,
}: EventSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metadata: {
      date: '',
      categories: [] as string[],
      headcount: '',
      initiator: EventInitiator.WORKER_LED,
    },
    media: {
      link: '',
    },
    geography: {
      location: '',
      countries: [] as string[],
    },
    connections: {
      companies: [] as string[],
      organisingGroups: [] as string[],
    },
    submissionContactDetails: {
      name: '',
      email: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Prepare the data for submission
      const submissionData: any = {
        name: formData.name,
        metadata: {
          date: formData.metadata.date,
          initiator: formData.metadata.initiator,
        },
        submissionContactDetails: {
          name: formData.submissionContactDetails.name,
          email: formData.submissionContactDetails.email,
        },
        _status: 'draft', // Save as draft
      }

      // Add optional fields if they have values
      if (formData.description) {
        // For rich text, we'll need to convert plain text to Lexical format
        // For now, we'll skip this or use a simple text field
      }

      if (formData.metadata.categories.length > 0) {
        submissionData.metadata.categories = formData.metadata.categories
      }

      if (formData.metadata.headcount) {
        submissionData.metadata.headcount = parseInt(formData.metadata.headcount, 10)
      }

      if (formData.media.link) {
        submissionData.media = {
          link: formData.media.link,
        }
      }

      if (formData.geography.location || formData.geography.countries.length > 0) {
        submissionData.geography = {}
        if (formData.geography.location) {
          submissionData.geography.location = formData.geography.location
        }
        if (formData.geography.countries.length > 0) {
          submissionData.geography.countries = formData.geography.countries
        }
      }

      if (formData.connections.companies.length > 0) {
        submissionData.companies = formData.connections.companies
      }

      if (formData.connections.organisingGroups.length > 0) {
        submissionData.organisingGroups = formData.connections.organisingGroups
      }

      // Submit to PayloadCMS as a draft
      // The SDK should handle the draft status via the _status field
      await payloadClient.create({
        collection: 'events',
        data: submissionData as any,
      })

      setSubmitStatus('success')
      // Reset form
      setFormData({
        name: '',
        description: '',
        metadata: {
          date: '',
          categories: [],
          headcount: '',
          initiator: EventInitiator.WORKER_LED,
        },
        media: {
          link: '',
        },
        geography: {
          location: '',
          countries: [],
        },
        connections: {
          companies: [],
          organisingGroups: [],
        },
        submissionContactDetails: {
          name: '',
          email: '',
        },
      })
    } catch (error: any) {
      console.error('Error submitting event:', error)
      setSubmitStatus('error')
      setErrorMessage(
        error?.message ||
          error?.errors?.[0]?.message ||
          'Failed to submit event. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-800 mb-2">Thank you!</h2>
        <p className="text-green-700">
          Your event submission has been received and saved as a draft. We'll review it and get back
          to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Details Section */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-bold">Your Contact Details</h2>
        <div className="space-y-2">
          <Label htmlFor="contact-name">
            Your Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            type="text"
            required
            value={formData.submissionContactDetails.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                submissionContactDetails: {
                  ...formData.submissionContactDetails,
                  name: e.target.value,
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">
            Your Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            required
            value={formData.submissionContactDetails.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                submissionContactDetails: {
                  ...formData.submissionContactDetails,
                  email: e.target.value,
                },
              })
            }
          />
        </div>
      </div>

      {/* Event Details Section */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-bold">Event Details</h2>
        <div className="space-y-2">
          <Label htmlFor="name">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">
            Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            required
            value={formData.metadata.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, date: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initiator">Who led this event?</Label>
          <select
            id="initiator"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.metadata.initiator}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, initiator: e.target.value as EventInitiator },
              })
            }
          >
            <option value={EventInitiator.WORKER_LED}>
              Worker-led (e.g. an action or worker news)
            </option>
            <option value={EventInitiator.BOSS_LED}>
              Boss-led (e.g. a redundancy or a policy change)
            </option>
            <option value={EventInitiator.OTHER}>Other (neither worker-led nor boss-led)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categories">Categories</Label>
          <select
            id="categories"
            multiple
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.metadata.categories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value)
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, categories: selected },
              })
            }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="headcount">Headcount (number of workers involved)</Label>
          <Input
            id="headcount"
            type="number"
            min="0"
            value={formData.metadata.headcount}
            onChange={(e) =>
              setFormData({
                ...formData,
                metadata: { ...formData.metadata, headcount: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Geography Section */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-bold">Location</h2>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            value={formData.geography.location}
            onChange={(e) =>
              setFormData({
                ...formData,
                geography: { ...formData.geography, location: e.target.value },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="countries">Countries</Label>
          <select
            id="countries"
            multiple
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.geography.countries}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value)
              setFormData({
                ...formData,
                geography: { ...formData.geography, countries: selected },
              })
            }}
          >
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>
      </div>

      {/* Connections Section */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-bold">Connections</h2>
        <div className="space-y-2">
          <Label htmlFor="companies">Companies</Label>
          <select
            id="companies"
            multiple
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.connections.companies}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value)
              setFormData({
                ...formData,
                connections: { ...formData.connections, companies: selected },
              })
            }}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organising-groups">Organising Groups</Label>
          <select
            id="organising-groups"
            multiple
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.connections.organisingGroups}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value)
              setFormData({
                ...formData,
                connections: { ...formData.connections, organisingGroups: selected },
              })
            }}
          >
            {organisingGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
        </div>
      </div>

      {/* Media Section */}
      <div className="space-y-4 border-b pb-6">
        <h2 className="text-2xl font-bold">Media & Evidence</h2>
        <div className="space-y-2">
          <Label htmlFor="link">Link to evidence (URL)</Label>
          <Input
            id="link"
            type="url"
            value={formData.media.link}
            onChange={(e) =>
              setFormData({
                ...formData,
                media: { ...formData.media, link: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Event'}
      </Button>
    </form>
  )
}
