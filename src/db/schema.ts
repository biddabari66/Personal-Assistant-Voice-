import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  priority: varchar('priority', { length: 50 }).notNull().default('UNASSIGNED'),
  deadline: varchar('deadline', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  tags: jsonb('tags').notNull().default('[]'),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  datetime: varchar('datetime', { length: 50 }).notNull(),
  duration: varchar('duration', { length: 50 }).notNull(),
  location: text('location').notNull(),
  notes: text('notes').notNull(),
  attendees: jsonb('attendees').notNull().default('[]'),
  status: varchar('status', { length: 50 }).notNull().default('CONFIRMED'),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  timestamp: varchar('timestamp', { length: 50 }).notNull(),
  tags: jsonb('tags').notNull().default('[]'),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: varchar('created_at', { length: 50 }).notNull(),
  updatedAt: varchar('updated_at', { length: 50 }).notNull(),
});

export const knowledge = pgTable('knowledge', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  fact: text('fact').notNull(),
  timestamp: varchar('timestamp', { length: 50 }).notNull(),
});

export const commandLog = pgTable('command_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  timestamp: varchar('timestamp', { length: 50 }).notNull(),
  command: text('command').notNull(),
  actionTaken: text('action_taken').notNull(),
});

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  salutation: text('salutation').notNull(),
  geminiApiKey: text('gemini_api_key').notNull(),
});
