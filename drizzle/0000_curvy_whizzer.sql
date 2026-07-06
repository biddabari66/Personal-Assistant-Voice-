CREATE TABLE "command_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" varchar(50) NOT NULL,
	"command" text NOT NULL,
	"action_taken" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" varchar(50) NOT NULL,
	"updated_at" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"datetime" varchar(50) NOT NULL,
	"duration" varchar(50) NOT NULL,
	"location" text NOT NULL,
	"notes" text NOT NULL,
	"attendees" jsonb DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fact" text NOT NULL,
	"timestamp" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"timestamp" varchar(50) NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company_name" text NOT NULL,
	"salutation" text NOT NULL,
	"gemini_api_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"priority" varchar(50) DEFAULT 'UNASSIGNED' NOT NULL,
	"deadline" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL
);
