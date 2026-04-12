export interface Device {
  id: number;
  name: string;
  manufacturer: string;
  type: string;
  os: string;
  osVersion: string;
  processor: string;
  ram: number;
  description: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
}

export interface CreateDevice {
  name: string;
  manufacturer: string;
  type: string;
  os: string;
  osVersion: string;
  processor: string;
  ram: number;
  description: string | null;
}
// Strongly-typed form models for device-form — no more "as { ... }" casts

export interface DeviceFormValue {
  name:        string;
  manufacturer: string;
  type:        string;
  os:          string;
  osVersion:   string;
  processor:   string;
  ram:         number | null;
  description: string | null;
}