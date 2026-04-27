/**
 * Intermediate Representation (IR) for the Option 4 custom AST generator.
 */

export interface IRSpec {
  title: string;
  version: string;
  operations: IROperation[];
  types: Map<string, IRNamedType>;
}

export interface IROperation {
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary?: string | undefined;
  description?: string | undefined;
  deprecated: boolean;
  pathParams: IRParameter[];
  queryParams: IRParameter[];
  requestBody?: IRTypeRef | undefined;
  successType: IRTypeRef;
  errorTypes: Record<string, IRTypeRef>;
  forgeScopes: { asApp: string[]; asUser: string[] };
  pagination: 'offset' | 'cursor' | 'none';
  contexts: Array<'forge-function' | 'forge-container' | 'forge-bridge'>;
}

export interface IRParameter {
  name: string;
  required: boolean;
  type: IRTypeRef;
  description?: string | undefined;
  deprecated: boolean;
}

export type IRTypeRef =
  | { kind: 'named'; name: string }
  | { kind: 'inline'; type: IRType };

export interface IRNamedType {
  name: string;
  type: IRType;
  description?: string | undefined;
}

export type IRType =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'unknown' }
  | { kind: 'void' }
  | { kind: 'literal'; value: string | number | boolean }
  | { kind: 'array'; items: IRType }
  | { kind: 'record'; values: IRType }
  | { kind: 'object'; properties: IRProperty[]; additionalProperties: boolean }
  | { kind: 'union'; types: IRType[] }
  | { kind: 'intersection'; types: IRType[] }
  | { kind: 'ref'; name: string };

export interface IRProperty {
  name: string;
  required: boolean;
  readonly: boolean;
  type: IRType;
  description?: string | undefined;
  deprecated: boolean;
}
