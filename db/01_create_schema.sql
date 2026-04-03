IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DeviceManagement')
    CREATE DATABASE DeviceManagement;
GO

USE DeviceManagement;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(100)  NOT NULL,
    Email         NVARCHAR(200)  NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(500)  NOT NULL,
    Role          NVARCHAR(50)   NOT NULL DEFAULT 'Employee',
    Location      NVARCHAR(100)  NOT NULL,
    CreatedAt     DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Devices' AND xtype='U')
CREATE TABLE Devices (
    Id             INT IDENTITY(1,1) PRIMARY KEY,
    Name           NVARCHAR(100)  NOT NULL,
    Manufacturer   NVARCHAR(100)  NOT NULL,
    Type           NVARCHAR(20)   NOT NULL CHECK (Type IN ('Phone', 'Tablet')),
    OS             NVARCHAR(50)   NOT NULL,
    OSVersion      NVARCHAR(50)   NOT NULL,
    Processor      NVARCHAR(100)  NOT NULL,
    RAM            INT            NOT NULL,
    Description    NVARCHAR(MAX)  NULL,
    AssignedUserId INT            NULL REFERENCES Users(Id) ON DELETE SET NULL,
    CreatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt      DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO