CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "Services" (
    "Id" uuid NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(1000) NULL,
    "DurationMinutes" integer NOT NULL,
    "Price" numeric(18,2) NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Services" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Services_DurationMinutes" CHECK ("DurationMinutes" > 0),
    CONSTRAINT "CK_Services_Price" CHECK ("Price" >= 0)
);

CREATE TABLE "Staffs" (
    "Id" uuid NOT NULL,
    "FullName" character varying(150) NOT NULL,
    "Email" character varying(256) NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Staffs" PRIMARY KEY ("Id")
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "FullName" character varying(150) NOT NULL,
    "Email" character varying(256) NOT NULL,
    "PasswordHash" character varying(500) NOT NULL,
    "Role" character varying(50) NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "WorkSchedules" (
    "Id" uuid NOT NULL,
    "StaffId" uuid NOT NULL,
    "WorkDate" date NOT NULL,
    "StartTime" interval NOT NULL,
    "EndTime" interval NOT NULL,
    CONSTRAINT "PK_WorkSchedules" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_WorkSchedules_Time" CHECK ("StartTime" < "EndTime"),
    CONSTRAINT "FK_WorkSchedules_Staffs_StaffId" FOREIGN KEY ("StaffId") REFERENCES "Staffs" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Bookings" (
    "Id" uuid NOT NULL,
    "BookingCode" character varying(30) NOT NULL,
    "CustomerId" uuid NOT NULL,
    "ServiceId" uuid NOT NULL,
    "StaffId" uuid NOT NULL,
    "StartTime" timestamp with time zone NOT NULL,
    "EndTime" timestamp with time zone NOT NULL,
    "Status" character varying(30) NOT NULL,
    "CustomerNote" character varying(500) NULL,
    "CancellationReason" character varying(500) NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Bookings" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Bookings_Status" CHECK ("Status" IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    CONSTRAINT "FK_Bookings_Services_ServiceId" FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Bookings_Staffs_StaffId" FOREIGN KEY ("StaffId") REFERENCES "Staffs" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Bookings_Users_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "IX_Bookings_BookingCode" ON "Bookings" ("BookingCode");

CREATE INDEX "IX_Bookings_CustomerId_CreatedAt" ON "Bookings" ("CustomerId", "CreatedAt");

CREATE INDEX "IX_Bookings_ServiceId" ON "Bookings" ("ServiceId");

CREATE INDEX "IX_Bookings_StaffId_StartTime_EndTime_Status" ON "Bookings" ("StaffId", "StartTime", "EndTime", "Status");

CREATE INDEX "IX_Bookings_StartTime_Status" ON "Bookings" ("StartTime", "Status");

CREATE INDEX "IX_Services_IsActive" ON "Services" ("IsActive");

CREATE INDEX "IX_Services_Name" ON "Services" ("Name");

CREATE UNIQUE INDEX "IX_Staffs_Email" ON "Staffs" ("Email");

CREATE INDEX "IX_Staffs_IsActive" ON "Staffs" ("IsActive");

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

CREATE INDEX "IX_WorkSchedules_StaffId_WorkDate" ON "WorkSchedules" ("StaffId", "WorkDate");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260917040131_InitialCreate', '7.0.20');

COMMIT;

