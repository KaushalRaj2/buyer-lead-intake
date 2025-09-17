// src/lib/validations.ts - Fixed to Handle Optional Fields Properly
import { z } from 'zod'

export const cityOptions = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'] as const
export const propertyTypeOptions = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'] as const
export const bhkOptions = ['1', '2', '3', '4', 'Studio'] as const
export const purposeOptions = ['Buy', 'Rent'] as const
export const timelineOptions = ['0-3m', '3-6m', '>6m', 'Exploring'] as const
export const sourceOptions = ['Website', 'Referral', 'Walk-in', 'Call', 'Other'] as const
export const statusOptions = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'] as const

// Create schema with proper optional handling
export const createBuyerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be less than 80 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: z.enum(cityOptions),
  propertyType: z.enum(propertyTypeOptions),
  bhk: z.enum(bhkOptions).optional().or(z.literal('').transform(() => undefined)).or(z.undefined()),
  purpose: z.enum(purposeOptions),
  budgetMin: z.number().int().positive().optional().or(z.undefined()),
  budgetMax: z.number().int().positive().optional().or(z.undefined()),
  timeline: z.enum(timelineOptions),
  source: z.enum(sourceOptions),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().or(z.literal('').transform(() => undefined)).or(z.undefined()),
  tags: z.array(z.string()).default([]).optional(),
}).refine((data) => {
  // bhk required for Apartment/Villa
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false
  }
  return true
}, {
  message: 'BHK is required for Apartment and Villa',
  path: ['bhk']
}).refine((data) => {
  // budgetMax >= budgetMin
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false
  }
  return true
}, {
  message: 'Maximum budget must be greater than minimum budget',
  path: ['budgetMax']
})

// Update schema with status field
export const updateBuyerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be less than 80 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone must be 10-15 digits'),
  city: z.enum(cityOptions),
  propertyType: z.enum(propertyTypeOptions),
  bhk: z.enum(bhkOptions).optional().or(z.literal('').transform(() => undefined)).or(z.undefined()),
  purpose: z.enum(purposeOptions),
  budgetMin: z.number().int().positive().optional().or(z.undefined()),
  budgetMax: z.number().int().positive().optional().or(z.undefined()),
  timeline: z.enum(timelineOptions),
  source: z.enum(sourceOptions),
  status: z.enum(statusOptions),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().or(z.literal('').transform(() => undefined)).or(z.undefined()),
  tags: z.array(z.string()).default([]).optional(),
}).refine((data) => {
  // bhk required for Apartment/Villa
  if (['Apartment', 'Villa'].includes(data.propertyType) && !data.bhk) {
    return false
  }
  return true
}, {
  message: 'BHK is required for Apartment and Villa',
  path: ['bhk']
}).refine((data) => {
  // budgetMax >= budgetMin
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false
  }
  return true
}, {
  message: 'Maximum budget must be greater than minimum budget',
  path: ['budgetMax']
})

// CSV schema for import functionality
export const csvRowSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().optional().transform(val => val === '' ? undefined : val),
  phone: z.string().regex(/^\d{10,15}$/),
  city: z.enum(cityOptions),
  propertyType: z.enum(propertyTypeOptions),
  bhk: z.string().optional().transform(val => val === '' ? undefined : val).pipe(z.enum(bhkOptions).optional()),
  purpose: z.enum(purposeOptions),
  budgetMin: z.string().optional().transform((val) => val && val !== '' ? parseInt(val) : undefined),
  budgetMax: z.string().optional().transform((val) => val && val !== '' ? parseInt(val) : undefined),
  timeline: z.enum(timelineOptions),
  source: z.enum(sourceOptions),
  notes: z.string().optional().transform(val => val === '' ? undefined : val),
  tags: z.string().optional().transform((val) => val && val !== '' ? val.split(',').map(tag => tag.trim()) : []),
  status: z.string().optional().transform(val => val === '' ? 'New' : val).pipe(z.enum(statusOptions))
})

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>
export type CsvRowInput = z.infer<typeof csvRowSchema>
