USE DeviceManagement;
GO

IF NOT EXISTS (SELECT 1 FROM Users)
BEGIN
    INSERT INTO Users (Name, Email, PasswordHash, Role, Location) VALUES
    ('Alice Johnson',  'alice@darwin.com',  'PLACEHOLDER_HASH', 'Admin',    'London'),
    ('Bob Smith',      'bob@darwin.com',    'PLACEHOLDER_HASH', 'Employee', 'Manchester'),
    ('Carol White',    'carol@darwin.com',  'PLACEHOLDER_HASH', 'Employee', 'Birmingham'),
    ('David Brown',    'david@darwin.com',  'PLACEHOLDER_HASH', 'Manager',  'London');
END
GO

IF NOT EXISTS (SELECT 1 FROM Devices)
BEGIN
    INSERT INTO Devices (Name, Manufacturer, Type, OS, OSVersion, Processor, RAM, Description, AssignedUserId) VALUES
    ('iPhone 15 Pro',     'Apple',   'Phone',  'iOS',     '17.4', 'A17 Pro',        8,  NULL, 1),
    ('Galaxy S24 Ultra',  'Samsung', 'Phone',  'Android', '14',   'Snapdragon 8 Gen 3', 12, NULL, 2),
    ('iPad Pro 13"',      'Apple',   'Tablet', 'iPadOS',  '17.4', 'M4',             16, NULL, NULL),
    ('Pixel 8 Pro',       'Google',  'Phone',  'Android', '14',   'Google Tensor G3', 12, NULL, 3),
    ('Galaxy Tab S9',     'Samsung', 'Tablet', 'Android', '14',   'Snapdragon 8 Gen 2', 12, NULL, NULL),
    ('iPhone 14',         'Apple',   'Phone',  'iOS',     '17.4', 'A15 Bionic',     6,  NULL, NULL);
END
GO