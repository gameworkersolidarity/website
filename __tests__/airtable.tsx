/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { validateAirtableAction } from '../data/airtableValidation';

describe('Airtable validation', () => {
  it('passes good URL slugs', () => {
    const testActions = [
      { slug: "home" },
      { slug: "2020-01-person-eats-pie" },
    ]
    for (const testAction of testActions) {
      const result = validateAirtableAction(testAction);
      expect(result).toBeTruthy()
    }
  })

  it('fails bad URL slugs', () => {
    const testActions = [
      { slug: "  home   " },
      { slug: "2020/01/01-person-eats-pie" },
    ]
    for (const testAction of testActions) {
      const result = validateAirtableAction(testAction);
      expect(result).toBeFalsy()
    }
  })
})