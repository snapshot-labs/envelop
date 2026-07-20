CREATE TABLE "subscribers" (
	"email" varchar(256) NOT NULL,
	"address" varchar(256) NOT NULL,
	"subscriptions" jsonb,
	"created" bigint NOT NULL,
	"verified" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "subscribers_email_address_pk" PRIMARY KEY("email","address")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_address_email_idx" ON "subscribers" USING btree ("address","email");--> statement-breakpoint
CREATE INDEX "subscribers_created_idx" ON "subscribers" USING btree ("created");--> statement-breakpoint
CREATE INDEX "subscribers_verified_idx" ON "subscribers" USING btree ("verified");