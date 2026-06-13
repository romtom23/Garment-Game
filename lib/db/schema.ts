import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
} from 'drizzle-orm/pg-core'
import type { DesignLayer } from '@/lib/types'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const designs = pgTable('designs', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  layers: jsonb('layers').$type<DesignLayer[]>().notNull(),
  published: boolean('published').notNull().default(false),
  slug: text('slug').unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  designId: text('designId').notNull(),
  designTitle: text('designTitle').notNull(),
  garment: text('garment').notNull(),
  variant: text('variant').notNull(),
  unitPrice: integer('unitPrice').notNull(), // cents
  qty: integer('qty').notNull().default(1),
  layer: jsonb('layer').$type<DesignLayer>().notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  status: text('status').notNull().default('pending'),
  customerName: text('customerName'),
  customerEmail: text('customerEmail'),
  amountTotal: integer('amountTotal').notNull().default(0), // cents
  currency: text('currency').notNull().default('usd'),
  shippingName: text('shippingName'),
  shippingLine1: text('shippingLine1'),
  shippingLine2: text('shippingLine2'),
  shippingCity: text('shippingCity'),
  shippingState: text('shippingState'),
  shippingPostalCode: text('shippingPostalCode'),
  shippingCountry: text('shippingCountry'),
  stripeSessionId: text('stripeSessionId'),
  stripePaymentIntentId: text('stripePaymentIntentId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('orderId').notNull(),
  designId: text('designId'),
  designTitle: text('designTitle').notNull(),
  garment: text('garment').notNull(),
  variant: text('variant').notNull(),
  unitPrice: integer('unitPrice').notNull(), // cents
  qty: integer('qty').notNull().default(1),
  layer: jsonb('layer').$type<DesignLayer>().notNull(),
})
