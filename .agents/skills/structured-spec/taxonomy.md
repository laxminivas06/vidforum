# Controlled Vocabularies

**Standard version:** 2.0.0

This file is the **single source of truth for every open/large enumerated value** in the Structured Spec standard:

| Vocabulary | Used in | Count |
|---|---|---|
| [Contract types](#1-contract-types) | `<!-- contract -->` `type:`, frontmatter `contract_types_used` | 8 |
| [Test types](#2-test-types) | `<!-- test -->` `type:` | 2 |
| [Architecture types](#3-architecture-types) | `<!-- architecture -->` `type:` | 8 |
| [Stack categories](#4-stack-categories) | `<!-- contract -->` `stack_category:` | 31 |

Small closed vocabularies bound to a single field — `priority`, `category`, `status` — are defined in `specification.md` §4 and are **not** repeated here. No value appears in two files.

> **Contract types and test types are disjoint sets.** A Gherkin scenario is a
> `test`, never a `contract`. See §2.

---

## 1. Contract Types

A contract type describes the **role a code block plays in the system**. It is technology-agnostic: a `data-schema` contract may be SQL DDL in one project and a Prisma schema in another.

Every `<!-- contract -->` annotation MUST set `type` to exactly one of these 8 values.

| Type | Defines | Typical technologies |
|---|---|---|
| `api-contract` | A synchronous service boundary: what goes in, what comes out | OpenAPI, GraphQL SDL, gRPC `.proto`, tRPC router, WSDL |
| `data-schema` | Persistent structure of data at rest | SQL DDL, Prisma, Drizzle, SQLAlchemy, Avro, JSON Schema, Mongo validators |
| `domain-model` | Application-level types used in business logic | TypeScript interface, Python dataclass/Pydantic, Go struct, Rust struct, Zod |
| `infrastructure` | How the system is provisioned, deployed, configured at runtime | Terraform, Pulumi, CloudFormation, Bicep, Compose, K8s YAML, Helm, Ansible |
| `messaging` | Asynchronous message/event/stream payloads and semantics | Avro, Protobuf, AsyncAPI, Kafka schema registry, SNS/SQS, Pub/Sub |
| `security-policy` | Authentication, authorization, access control, compliance rules | OPA/Rego, IAM policy JSON, CASL, XACML, K8s NetworkPolicy, WAF rules |
| `operational` | Monitoring, alerting, observability, runbooks | Prometheus rules, Grafana JSON, PagerDuty/Datadog config, OTel config |
| `config` | Application configuration, feature flags, environment settings | YAML/TOML config, `.env` template, LaunchDarkly/Unleash, ConfigMap |

### 1.1 Disambiguation

When two types look plausible, use this table. It is exhaustive for the common cases.

| The block defines… | Type | Not |
|---|---|---|
| A REST/GraphQL/gRPC endpoint | `api-contract` | `domain-model` |
| A request or response body type | `api-contract` | `domain-model` |
| A database table, index, or migration | `data-schema` | `domain-model` |
| An internal type that never crosses a boundary | `domain-model` | `data-schema` |
| An event published to a broker | `messaging` | `api-contract` |
| A cloud resource or deployment manifest | `infrastructure` | `config` |
| An environment variable or feature flag | `config` | `infrastructure` |
| A security group attached to a deployed resource | `infrastructure` | `security-policy` |
| An RBAC/ABAC rule evaluated at request time | `security-policy` | `infrastructure` |
| An alert threshold or dashboard | `operational` | `config` |
| A Gherkin scenario or test case | **not a contract** — use `<!-- test -->` | any contract type |

### 1.2 Custom types

If no standard type applies, a project MAY use an `x-` prefixed type (e.g. `x-ml-pipeline`). Custom types MUST NOT be used where a standard type fits, and MUST be declared in frontmatter `contract_types_used`.

---

## 2. Test Types

Test types are a **separate, disjoint vocabulary** from contract types. They are used only by the `<!-- test -->` annotation.

| Type | Verifies | Typical technologies |
|---|---|---|
| `acceptance-test` | Observable behavior from the user's perspective — WHAT the system does | Gherkin/Cucumber, pytest, Jest `describe`, Robot Framework |
| `integration-test` | That multiple components or services work together correctly | Postman/Newman, k6, Pact, Testcontainers, Gatling |

Choosing between them:

| The scenario exercises… | Type |
|---|---|
| A single user-visible behavior or business rule | `acceptance-test` |
| A user journey through the UI | `acceptance-test` |
| Two or more services over a real transport | `integration-test` |
| A consumer-driven contract between services | `integration-test` |
| Load, stress, or throughput characteristics | `integration-test` |

Unit tests for internal functions are implementation detail and are **not** annotated in a spec.

---

## 3. Architecture Types

Used by `<!-- architecture -->` `type:`.

| Type | Depicts |
|---|---|
| `c4-context` | System boundary and external actors (C4 level 1) |
| `c4-container` | Deployable units and their connections (C4 level 2) |
| `c4-component` | Internal components of one container (C4 level 3) |
| `sequence` | Ordered interaction between participants over time |
| `flow` | Data or control flow through the system |
| `er` | Entity relationships between data models |
| `deployment` | Physical/cloud topology and environment layout |
| `custom` | Anything not covered above |

---

## 4. Stack Categories

`stack_category` is an **optional technology-domain hint** on a contract. It is orthogonal to contract type: a `data-schema` contract may carry any storage category. Agents use it to pick tooling, libraries, and patterns when implementing the contract.

### 4.1 Data and storage

| Category | Example technologies |
|---|---|
| `relational-database` | PostgreSQL, MySQL, SQLite, SQL Server, CockroachDB, BigQuery, Snowflake, Redshift |
| `document-database` | MongoDB, Firestore, CouchDB, DocumentDB |
| `key-value-store` | Redis, Memcached, DynamoDB, etcd, Consul KV |
| `column-database` | Cassandra, ScyllaDB, HBase, Bigtable |
| `search-engine` | Elasticsearch, OpenSearch, Algolia, Meilisearch, Typesense |
| `object-storage` | S3, GCS, Azure Blob, MinIO, R2 |
| `graph-database` | Neo4j, Neptune, DGraph, ArangoDB |
| `time-series-database` | InfluxDB, TimescaleDB, Prometheus, QuestDB |

### 4.2 Compute and runtime

| Category | Example technologies |
|---|---|
| `serverless` | Lambda, Cloud Functions, Azure Functions |
| `container-orchestration` | Kubernetes, ECS, Cloud Run, App Runner, Fly.io |
| `virtual-machine` | EC2, Compute Engine, Azure VMs, Proxmox |
| `edge-computing` | Cloudflare Workers, Deno Deploy, Fastly, Vercel Edge |
| `batch-processing` | AWS Batch, Cloud Run Jobs, Airflow, Dagster |

### 4.3 Networking and communication

| Category | Example technologies |
|---|---|
| `message-queue` | Kafka, RabbitMQ, SQS, Pub/Sub, NATS, Pulsar |
| `api-gateway` | Kong, API Gateway, Apigee, Traefik, Caddy |
| `cdn` | Cloudflare, Fastly, CloudFront, Akamai |
| `dns` | Route53, Cloud DNS, Cloudflare DNS |
| `load-balancer` | ALB/NLB, Cloud Load Balancing, HAProxy, Envoy |
| `service-mesh` | Istio, Linkerd, Consul Connect |

### 4.4 Security and identity

| Category | Example technologies |
|---|---|
| `identity-provider` | Auth0, Okta, Cognito, Firebase Auth, Keycloak |
| `secret-management` | Vault, AWS Secrets Manager, GCP Secret Manager |
| `certificate-management` | ACM, cert-manager, Let's Encrypt, Vault PKI |

### 4.5 Application layer

| Category | Example technologies |
|---|---|
| `application-code` | Any general-purpose source code |
| `frontend` | React, Vue, Svelte, Angular |
| `mobile` | React Native, Flutter, SwiftUI, Jetpack Compose |
| `desktop` | Electron, Tauri, Qt, WPF |

### 4.6 Observability and delivery

| Category | Example technologies |
|---|---|
| `monitoring` | Prometheus, Grafana, Datadog, Cloud Monitoring |
| `logging` | Loki, ELK, Cloud Logging, Splunk |
| `tracing` | Jaeger, Tempo, OpenTelemetry, X-Ray |
| `ci-cd` | GitHub Actions, GitLab CI, CircleCI, Argo CD |
