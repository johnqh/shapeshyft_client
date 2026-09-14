import { describe, it, expectTypeOf } from 'vitest';
import type {
  EndpointCreateRequest,
  EndpointUpdateRequest,
} from '@sudobility/shapeshyft_types';
import type {
  EndpointBindingFields,
  EndpointCreatePayload,
  EndpointUpdatePayload,
} from './endpoint-payloads';

// Vitest erases types, so these assertions only bite under tsc:
//   bunx tsc --noEmit --skipLibCheck --moduleResolution bundler --module esnext --target es2022 --strict src/endpoint-payloads.test.ts
describe('endpoint payload types', () => {
  it('accept ShapeShyft requests unchanged', () => {
    expectTypeOf<EndpointCreateRequest>().toMatchTypeOf<EndpointCreatePayload>();
    expectTypeOf<EndpointUpdateRequest>().toMatchTypeOf<EndpointUpdatePayload>();
  });

  it('accept a provider binding with no llm_key_id', () => {
    const create = {
      endpoint_name: 'classify',
      display_name: 'Classify',
      http_method: 'POST',
      model: null,
      input_schema: null,
      output_schema: null,
      instructions: null,
      context: null,
      provider: 'openai',
    } satisfies EndpointCreatePayload;
    expectTypeOf(create).toMatchTypeOf<EndpointCreatePayload>();
  });

  it('carry binding fields spread from a binding object', () => {
    const binding: EndpointBindingFields = { provider: 'anthropic' };
    const create: EndpointCreatePayload = {
      endpoint_name: 'extract',
      display_name: 'Extract',
      http_method: 'POST',
      model: null,
      input_schema: null,
      output_schema: null,
      instructions: null,
      context: null,
      ...binding,
    };
    expectTypeOf(create).toMatchTypeOf<EndpointCreatePayload>();
  });
});
