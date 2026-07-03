# EMS module boundaries

EMS is a modular monolith first, but every domain should stay microservice-ready.

## Frontend rules

- Feature UI lives under `apps/web/src/features/<feature>/ui`.
- Feature API wrappers live under `apps/web/src/features/<feature>/api`.
- UI/pages import API hooks and request/response types from the feature API wrapper only.
- Feature API wrappers re-export hooks and generated types from `@ems/api-client`.
- Do not write `fetch` or `axios` calls in features.
- Do not import from `@ems/api-client/src/*` or generated internals directly.
- Generic reusable components live in `packages/ui`.
- EMS-specific workflow components stay inside their owning feature.

## Contract and routing generation

- OpenAPI contract: `packages/api-contract/openapi.yaml`.
- Orval generated API client/types: `packages/api-client/src/generated`.
- TanStack Router route tree: `apps/web/src/routeTree.gen.ts`.
- These generated systems are separate:
  - Orval owns API data types and TanStack Query hooks.
  - TanStack Router owns route/path/params typing.

## Backend rules

- Each module owns its tables, repository, service, controller, and DTOs.
- A module must not import another domain module's repository directly.
- If a module needs data from another domain, depend on a small port/interface and an adapter.
- Service classes contain business rules and transactions.
- Repository classes contain database queries only.
- Shared packages contain enums, permissions, status metadata, and generic utilities only.
- Do not put booking/trip/fuel/finance workflow logic in `packages/shared`.

## Future microservice migration rule

A domain can become a microservice later only if other domains talk to its public API/port/event boundary, not its internal tables/repositories.
