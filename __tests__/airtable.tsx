/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { validateAirtableAction } from '../data/airtableValidation';

const dummyAirtableRecord = (fields) => ({ fields, id: 'test', createdTime: 'test' });

describe('Airtable validation', () => {
  it('passes good URL slugs', () => {
    const testActions = [
      dummyAirtableRecord({ slug: "home" }),
      dummyAirtableRecord({ slug: "2020-01-person-eats-pie" }),
      dummyAirtableRecord({ slug: "2004-11-ea_spouse-open-letter" }),
    ]
    for (const testAction of testActions) {
      const result = validateAirtableAction(testAction);
      expect(result).toBeTruthy()
    }
  })

  it('fails bad URL slugs', () => {
    const testActions = [
      dummyAirtableRecord({ slug: "  home   " }),
      dummyAirtableRecord({ slug: "2020/01/01-person-eats-pie" }),
      dummyAirtableRecord({ slug: "-2020-01-01-person-eats-pie" }),
      dummyAirtableRecord({ slug: "_2020-01-01-person-eats-pie" }),
      dummyAirtableRecord({ slug: "2020-01-01-person-eats-pie-" }),
      dummyAirtableRecord({ slug: "2020-01-01-person-eats-pie_" }),
    ]
    for (const testAction of testActions) {
      const result = validateAirtableAction(testAction);
      expect(result).toBeFalsy()
    }
  })
})