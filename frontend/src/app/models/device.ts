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