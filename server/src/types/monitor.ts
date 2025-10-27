// Monitor Types
export type MonitorType = 'http' | 'tcp';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Assertion Types
export type AssertionType = 'status' | 'header' | 'body';
export type AssertionCondition = 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';

export interface Assertion {
  type: AssertionType;
  condition: AssertionCondition;
  value: string | number;
  property?: string; // For header assertions
}

// Monitor Input Type
export interface MonitorInput {
  url: string;
  monitorType: MonitorType;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  assertions?: Assertion[];
  emails: string[];
  frequency: number;
  regions: string[];
}

// Monitor Check Result Types
export interface MonitorCheckResult {
  statusCode: number;
  responseTime: number;
  isUp: boolean;
  timestamp: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
  assertions?: {
    passed: boolean;
    message: string;
    assertion: Assertion;
  }[];
  region: string;
}

// Assertion Result Types
export interface AssertionResult {
  passed: boolean;
  message: string;
  assertion: Assertion;
}

// Monitor Check Result Types
export interface MonitorCheckResult {
  statusCode: number;
  responseTime: number;
  isUp: boolean;
  timestamp: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
  assertions?: AssertionResult[];
  region: string;
}