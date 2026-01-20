'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from '@/components/MultiSelect'
import type { Category, Country, Company, OrganisingGroup, Event } from '@/payload-types'
import { EventInitiator } from '@/collections/enums'
import { RenderedCategoryLabel } from '@/components/CategoryLabel'
import { RenderedCompanyLabel } from '@/components/CompanyLabel'
import { RenderedCountryLabel } from '@/components/CountryLabel'
import { RenderedOrganisingGroupLabel } from '@/components/OrganisingGroupLabel'

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedOrganisingGroups, setSelectedOrganisingGroups] = useState<string[]>([])
  const [consent, setConsent] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    // Validate consent
    if (!consent) {
      setSubmitStatus('error')
      setErrorMessage('You must consent to Game Worker Solidarity Project publishing this information')
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'slug'> = {
      name: formData.get('name') as string,
      description: formData.get('description')
        ? {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: formData.get('description') as string,
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          }
        : undefined,
      date: formData.get('date') as string,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      headcount: formData.get('headcount')
        ? parseInt(formData.get('headcount') as string, 10)
        : undefined,
      initiator: (formData.get('initiator') as EventInitiator) || EventInitiator.WORKER_LED,
      location: (formData.get('location') as string) || undefined,
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      link: (formData.get('link') as string) || undefined,
      companies: selectedCompanies.length > 0 ? selectedCompanies : undefined,
      organisingGroups: selectedOrganisingGroups.length > 0 ? selectedOrganisingGroups : undefined,
      submissionContactDetails: formData.get('submissionContactDetails') as string,
      consent: consent,
      _status: 'draft' as const,
    }

    try {
      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit event')
      }

      setSubmitStatus('success')
      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setSelectedCategories([])
      setSelectedCountries([])
      setSelectedCompanies([])
      setSelectedOrganisingGroups([])
      setConsent(false)
    } catch (error: any) {
      setSubmitStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting the event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-800 mb-2">Thank you!</h2>
        <p className="text-green-700">
          Your event submission has been received and saved as a draft. We&apos;ll review it and get
          back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Basic Information</h2>

        <div>
          <Label htmlFor="name">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input id="name" name="name" required className="mt-1" />
        </div>

        <div>
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>
      </section>

      {/* Metadata */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Metadata</h2>

        <div>
          <Label htmlFor="date">
            Date <span className="text-red-500">*</span>
          </Label>
          <Input id="date" name="date" type="date" required className="mt-1" />
        </div>

        <div>
          <Label htmlFor="categories">Categories</Label>
          <div className="mt-1">
            <MultiSelect
              name="categories"
              options={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
              valueKey="id"
              renderLabel={(category) => <RenderedCategoryLabel category={category} />}
              placeholder="Select categories..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="headcount">Headcount</Label>
          <Input
            id="headcount"
            name="headcount"
            type="number"
            min="0"
            className="mt-1"
            placeholder="How many workers were involved?"
          />
        </div>

        <div>
          <Label htmlFor="initiator">Initiator</Label>
          <select
            id="initiator"
            name="initiator"
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            defaultValue={EventInitiator.WORKER_LED}
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
      </section>

      {/* Geography */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Geography</h2>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            className="mt-1"
            placeholder="e.g., San Francisco, CA"
          />
        </div>

        <div>
          <Label htmlFor="countries">Countries</Label>
          <div className="mt-1">
            <MultiSelect
              name="countries"
              options={countries}
              value={selectedCountries}
              onChange={setSelectedCountries}
              valueKey="id"
              renderLabel={(country) => <RenderedCountryLabel country={country} />}
              placeholder="Select countries..."
            />
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Media</h2>

        <div>
          <Label htmlFor="link">Evidence Link</Label>
          <Input
            id="link"
            name="link"
            type="url"
            className="mt-1"
            placeholder="https://example.com/article"
          />
          <p className="text-sm text-gray-500 mt-1">Third party URL that evidences this event</p>
        </div>
      </section>

      {/* Connections */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Connections</h2>

        <div>
          <Label htmlFor="companies">Companies</Label>
          <div className="mt-1">
            <MultiSelect
              name="companies"
              options={companies}
              value={selectedCompanies}
              onChange={setSelectedCompanies}
              valueKey="id"
              renderLabel={(company) => <RenderedCompanyLabel company={company} />}
              placeholder="Select companies..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="organisingGroups">Organising Groups</Label>
          <div className="mt-1">
            <MultiSelect
              name="organisingGroups"
              options={organisingGroups}
              value={selectedOrganisingGroups}
              onChange={setSelectedOrganisingGroups}
              valueKey="id"
              renderLabel={(group) => <RenderedOrganisingGroupLabel organisingGroup={group} />}
              placeholder="Select organising groups..."
            />
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Your Contact Details</h2>

        <div>
          <Label htmlFor="submissionContactDetails">
            Contact Information <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="submissionContactDetails"
            name="submissionContactDetails"
            rows={3}
            required
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            placeholder="Please provide your email address or other contact information"
          />
          <p className="text-sm text-gray-500 mt-1">
            We&apos;ll use this to contact you about your submission
          </p>
        </div>
      </section>

      {/* Consent */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          Consent <span className="text-red-500">*</span>
        </h2>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-1"
          />
          <Label htmlFor="consent" className="cursor-pointer leading-relaxed">
            I consent to Game Worker Solidarity Project publishing this information online and
            offline
          </Label>
        </div>
      </section>

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? 'Submitting...' : 'Submit Event'}
        </Button>
      </div>
    </form>
  )
}
