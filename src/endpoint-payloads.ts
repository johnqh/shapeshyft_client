/**
 * @fileoverview Endpoint request payloads that do not assume a provider binding
 * @description Products bind endpoints to an LLM provider differently: ShapeShyft
 * sends `llm_key_id`, ShapeRouter will send `provider`. The shared fields come
 * from the engine's base request types; the binding is one of the named optional
 * fields below.
 *
 * Named fields rather than `Record<string, unknown>`: an `interface` such as
 * ShapeShyft's `EndpointCreateRequest` cannot satisfy an index-signature type, so
 * a Record intersection would break every existing caller.
 */

import type {
  EndpointCreateRequestBase,
  EndpointUpdateRequestBase,
  LlmProvider,
} from '@sudobility/shapeshyft_types';

/** How a request binds an endpoint to an LLM provider. Set exactly one. */
export interface EndpointBindingFields {
  /** ShapeShyft: the entity's LLM API key */
  llm_key_id?: string | null;
  /** ShapeRouter: a site-owned provider */
  provider?: LlmProvider | null;
}

export type EndpointCreatePayload = EndpointCreateRequestBase &
  EndpointBindingFields;

export type EndpointUpdatePayload = EndpointUpdateRequestBase &
  EndpointBindingFields;
