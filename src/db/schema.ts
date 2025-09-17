// src/db/schema.ts - Add Users Table
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const cityEnum = pgEnum('city', ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
export const propertyTypeEnum = pgEnum('property_type', ['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
export const bhkEnum = pgEnum('bhk', ['1', '2', '3', '4', 'Studio']);
export const purposeEnum = pgEnum('purpose', ['Buy', 'Rent']);
export const timelineEnum = pgEnum('timeline', ['0-3m', '3-6m', '>6m', 'Exploring']);
export const sourceEnum = pgEnum('source', ['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
export const statusEnum = pgEnum('status', ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Users Table - NEW
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // In real app, this would be hashed
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Buyers Table - Updated to reference users
export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 80 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 15 }).notNull(),
  city: cityEnum('city').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  bhk: bhkEnum('bhk'),
  purpose: purposeEnum('purpose').notNull(),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  timeline: timelineEnum('timeline').notNull(),
  source: sourceEnum('source').notNull(),
  status: statusEnum('status').notNull().default('New'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // Updated to reference users
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const buyerHistory = pgTable('buyer_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull().references(() => users.id), // Updated to reference users
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  diff: jsonb('diff').notNull(),
});

// Schema validation
export const insertBuyerSchema = createInsertSchema(buyers);
export const selectBuyerSchema = createSelectSchema(buyers);
export const insertBuyerHistorySchema = createInsertSchema(buyerHistory);
export const selectBuyerHistorySchema = createSelectSchema(buyerHistory);
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Types
export type Buyer = z.infer<typeof selectBuyerSchema>;
export type NewBuyer = z.infer<typeof insertBuyerSchema>;
export type BuyerHistory = z.infer<typeof selectBuyerHistorySchema>;
export type NewBuyerHistory = z.infer<typeof insertBuyerHistorySchema>;
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
