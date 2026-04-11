-- =============================================================
-- seed_data.sql
-- Populates DeviceManagement with dummy data.
-- Idempotent: deletes existing seed rows and re-inserts them,
-- identified by a known email / device name so real data is
-- never touched.
-- =============================================================

USE DeviceManagement;
GO

-- ── Users ─────────────────────────────────────────────────────
-- Passwords are BCrypt hashes of the value shown in the comment.
-- Use these credentials to log in after seeding.

-- Remove seed users if they already exist (idempotent re-run)
DELETE FROM Users WHERE Email IN (
    'admin@company.com',
    'manager@company.com',
    'alice@company.com',
    'bob@company.com',
    'priya@company.com'
);

INSERT INTO Users (Name, Email, PasswordHash, Role, Location) VALUES
-- Password: Admin1234!
('System Admin',   'admin@company.com',   '$2a$11$358FU8mwEfK85Lg4yIXDSe/Dbtj.egQuGOnQQmnDJ4qgCXIVTIWlS', 'Admin',    'London'),
-- Password: Manager123!
('Sarah Manager',  'manager@company.com', '$2a$11$L5d4V21CKDZjpgPbwcUc/OwrgueELGuMABpEXyiUf287M9oYF4ppi', 'Manager',  'New York'),
-- Password: Alice123!
('Alice Johnson',  'alice@company.com',   '$2a$11$BAQF4OVWL.GjqsoiVb8S2eWVsob257rTkkDVdpLuHQ29gOlvClaoW', 'Employee', 'London'),
-- Password: Bob123!
('Bob Smith',      'bob@company.com',     '$2a$11$iVRmSqd7KtrY2P4BmcW0n.L70m7yS58qxjPSrArvwhxBr3nGxBsOC', 'Employee', 'Manchester'),
-- Password: Priya123!
('Priya Patel',    'priya@company.com',   '$2a$11$pOK1PdHpHxvVuwZULnuXKO7Q9EzCSzL/8GAUn0xT/zhSqGiay9it2', 'Employee', 'Birmingham');
GO

-- ── Devices ───────────────────────────────────────────────────
DELETE FROM Devices WHERE Name IN (
    'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra', 'iPad Pro 13"',
    'Google Pixel 8', 'Samsung Galaxy Tab S9', 'iPhone 14',
    'OnePlus 12', 'iPad Air 11"'
);

-- Grab user IDs for assignment
DECLARE @AliceId INT = (SELECT Id FROM Users WHERE Email = 'alice@company.com');
DECLARE @BobId   INT = (SELECT Id FROM Users WHERE Email = 'bob@company.com');
DECLARE @PriyaId INT = (SELECT Id FROM Users WHERE Email = 'priya@company.com');

INSERT INTO Devices (Name, Manufacturer, Type, OS, OSVersion, Processor, RAM, Description, AssignedUserId) VALUES
('iPhone 15 Pro',           'Apple',    'Phone',  'iOS',     '17.4', 'A17 Pro',           8,  'A high-performance Apple smartphone running iOS 17, ideal for daily business use.',             @AliceId),
('Samsung Galaxy S24 Ultra','Samsung',  'Phone',  'Android', '14',   'Snapdragon 8 Gen 3',12, 'Flagship Android device with advanced camera capabilities and enterprise-grade security.',      @BobId),
('iPad Pro 13"',            'Apple',    'Tablet', 'iPadOS',  '17.4', 'M4',                16, 'Professional tablet featuring the M4 chip, suited for creative and productivity workflows.',    NULL),
('Google Pixel 8',          'Google',   'Phone',  'Android', '14',   'Tensor G3',         8,  'Pure Android experience with advanced AI features and guaranteed OS updates.',                  @PriyaId),
('Samsung Galaxy Tab S9',   'Samsung',  'Tablet', 'Android', '13',   'Snapdragon 8 Gen 2',12, 'Premium Android tablet built for productivity and multimedia.',                                NULL),
('iPhone 14',               'Apple',    'Phone',  'iOS',     '17.2', 'A15 Bionic',        6,  'Reliable mid-range iPhone offering excellent performance for everyday tasks.',                  NULL),
('OnePlus 12',              'OnePlus',  'Phone',  'Android', '14',   'Snapdragon 8 Gen 3',16, 'High-performance Android phone with ultra-fast charging and smooth display.',                   NULL),
('iPad Air 11"',            'Apple',    'Tablet', 'iPadOS',  '17.3', 'M2',                8,  'Versatile and lightweight Apple tablet for mobile professionals.',                              NULL);
GO

PRINT 'Seed data applied successfully.';
GO