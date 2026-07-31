import {
  bigint,
  index,
  jsonb,
  pgTable,
  primaryKey,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';

export const subscribers = pgTable(
  'subscribers',
  {
    email: varchar({ length: 256 }).notNull(),
    address: varchar({ length: 256 }).notNull(),
    subscriptions: jsonb().$type<string[]>(),
    created: bigint({ mode: 'number' }).notNull(),
    verified: bigint({ mode: 'number' }).notNull().default(0)
  },
  table => [
    primaryKey({ columns: [table.email, table.address] }),
    uniqueIndex('subscribers_address_email_idx').on(table.address, table.email),
    index('subscribers_created_idx').on(table.created),
    index('subscribers_verified_idx').on(table.verified),
    index('subscribers_subscriptions_idx').using('gin', table.subscriptions)
  ]
);

export const sentEmails = pgTable('sent_emails', {
  id: varchar({ length: 512 }).primaryKey(),
  created: bigint({ mode: 'number' }).notNull()
});

export type NewSubscriber = typeof subscribers.$inferInsert;
