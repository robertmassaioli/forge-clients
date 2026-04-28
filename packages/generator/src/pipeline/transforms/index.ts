/**
 * Spec transform pipeline — each transform is a pure function that
 * takes an OpenAPI document and returns a (possibly mutated) copy.
 *
 * Transforms are applied in order after downloading and before patching.
 */

import type { OpenAPIV3 } from 'openapi-types';
import { fixErrorResponses } from './fixErrorResponses.js';
import { fixOneOfAnyOf } from './fixOneOfAnyOf.js';
import { fixNullableFields } from './fixNullableFields.js';
import { fixDeprecations } from './fixDeprecations.js';
import { fixContentTypes } from './fixContentTypes.js';
import { addForgeExtensions } from './addForgeExtensions.js';
import { sanitizeParameterNames } from './sanitizeParameterNames.js';

export type SpecTransform = (spec: OpenAPIV3.Document) => OpenAPIV3.Document;

export const TRANSFORMS: SpecTransform[] = [
  fixErrorResponses,
  fixOneOfAnyOf,
  fixNullableFields,
  fixDeprecations,
  fixContentTypes,
  addForgeExtensions,
  sanitizeParameterNames,
];

export function applyTransforms(spec: OpenAPIV3.Document): OpenAPIV3.Document {
  return TRANSFORMS.reduce((s, transform) => transform(s), spec);
}
