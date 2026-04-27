import type { OpenAPIV3 } from 'openapi-types';

/** A single transform step in the spec post-processing pipeline */
export type SpecTransform = (spec: OpenAPIV3.Document) => OpenAPIV3.Document;

/** A targeted patch for a known spec defect */
export interface SpecPatch {
  description: string;
  /** JSON Pointer path to the value being patched (RFC 6901) */
  path: string[];
  operation: 'add' | 'replace' | 'remove' | 'merge';
  value?: unknown;
}

/** Full spec pipeline configuration */
export interface SpecPipeline {
  specId: string;
  sourceUrl: string;
  transforms: SpecTransform[];
  patches: SpecPatch[];
  outputPath: string;
}

/** Re-export for convenience */
export type { OpenAPIV3 } from 'openapi-types';
