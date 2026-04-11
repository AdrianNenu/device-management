USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DeviceManagement')
BEGIN
    CREATE DATABASE DeviceManagement;
END
GO

USE DeviceManagement;
GO

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id           INT            IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100)  NOT NULL,
        Email        NVARCHAR(256)  NOT NULL,
        PasswordHash NVARCHAR(512)  NOT NULL,
        Role         NVARCHAR(20)   NOT NULL DEFAULT 'Employee',
        Location     NVARCHAR(100)  NOT NULL DEFAULT '',
        CreatedAt    DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role  CHECK  (Role IN ('Employee', 'Manager', 'Admin'))
    );
END
GO

-- Devices table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Devices')
BEGIN
    CREATE TABLE Devices (
        Id             INT            IDENTITY(1,1) PRIMARY KEY,
        Name           NVARCHAR(100)  NOT NULL,
        Manufacturer   NVARCHAR(100)  NOT NULL,
        Type           NVARCHAR(20)   NOT NULL,
        OS             NVARCHAR(50)   NOT NULL,
        OSVersion      NVARCHAR(50)   NOT NULL,
        Processor      NVARCHAR(100)  NOT NULL,
        RAM            INT            NOT NULL,
        Description    NVARCHAR(1000) NULL,
        AssignedUserId INT            NULL,
        CreatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT CK_Devices_Type CHECK (Type IN ('Phone', 'Tablet')),
        CONSTRAINT CK_Devices_RAM  CHECK (RAM BETWEEN 1 AND 128),
        CONSTRAINT FK_Devices_Users FOREIGN KEY (AssignedUserId)
            REFERENCES Users(Id) ON DELETE SET NULL
    );
END
GO