import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  categoryLabel: text("category_label").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.8"),
  reviewCount: integer("review_count").notNull().default(0),
  image: text("image").notNull(),
  badge: text("badge"),
  description: text("description").notNull(),
  stock: integer("stock").notNull().default(0),
  specs: jsonb("specs").$type<Array<{ label: string; value: string }>>().notNull().default([]),
  options: text("options").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("new"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  items: jsonb("items").$type<Array<{ productId: number; quantity: number; option?: string | null }>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  items: z.array(z.object({
    productId: z.number().int(),
    quantity: z.number().int().min(1),
    option: z.string().nullish(),
  })).min(1),
});

export type Product = typeof productsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;