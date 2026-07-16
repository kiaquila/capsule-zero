#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

const root = resolve(process.cwd());
const apiSpecPath = resolve(root, "docs_capsule_zero/adr/api-spec.md");
const openApiPath = resolve(root, "docs_capsule_zero/adr/openapi.yaml");
const apiSpec = readFileSync(apiSpecPath, "utf8");
const openApi = YAML.parse(readFileSync(openApiPath, "utf8"));
const errors = [];

const requiredErrorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "IDEMPOTENCY_CONFLICT",
  "SEMANTIC_VALIDATION_FAILED",
];

const standardErrorResponses = new Set([
  "400",
  "401",
  "403",
  "404",
  "409",
  "422",
  "default",
]);

function normalizePath(path) {
  return path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, "{$1}");
}

function collectRouteMethods(markdown) {
  const routes = [];

  for (const line of markdown.split("\n")) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*([A-Z]+)\s*\|/);

    if (!match) {
      continue;
    }

    routes.push({
      path: normalizePath(match[1]),
      method: match[2].toLowerCase(),
    });
  }

  return routes;
}

function hasErrorSchema(response) {
  if (!response) {
    return false;
  }

  if (response.$ref?.startsWith("#/components/responses/")) {
    return true;
  }

  const schema = response.content?.["application/json"]?.schema;
  return schema?.$ref === "#/components/schemas/ErrorResponse";
}

function hasSuccessResponse(responses = {}) {
  return Object.keys(responses).some((code) => /^2\d\d$|^3\d\d$/.test(code));
}

function hasStandardErrorResponse(responses = {}) {
  return Object.entries(responses).some(
    ([code, response]) =>
      standardErrorResponses.has(code) && hasErrorSchema(response),
  );
}

const expectedRoutes = collectRouteMethods(apiSpec);
const paths = openApi.paths || {};

for (const route of expectedRoutes) {
  const operation = paths[route.path]?.[route.method];

  if (!operation) {
    errors.push(
      `Missing OpenAPI operation for ${route.method.toUpperCase()} ${route.path}.`,
    );
    continue;
  }

  if (!operation.operationId) {
    errors.push(
      `${route.method.toUpperCase()} ${route.path} must define operationId.`,
    );
  }

  if (!operation["x-auth"]) {
    errors.push(
      `${route.method.toUpperCase()} ${route.path} must define x-auth.`,
    );
  }

  if (!hasSuccessResponse(operation.responses)) {
    errors.push(
      `${route.method.toUpperCase()} ${route.path} must define a success response.`,
    );
  }

  if (!hasStandardErrorResponse(operation.responses)) {
    errors.push(
      `${route.method.toUpperCase()} ${route.path} must define a standard ErrorResponse error.`,
    );
  }

  if (
    ["post", "patch", "put"].includes(route.method) &&
    route.path !== "/auth/callback"
  ) {
    if (!operation.requestBody) {
      errors.push(
        `${route.method.toUpperCase()} ${route.path} must define requestBody.`,
      );
    }
  }
}

const documentedKeys = new Set(
  expectedRoutes.map((route) => `${route.method} ${route.path}`),
);
for (const [path, methods] of Object.entries(paths)) {
  for (const method of Object.keys(methods)) {
    if (!["get", "post", "patch", "delete", "put"].includes(method)) {
      continue;
    }

    const key = `${method} ${path}`;
    if (!documentedKeys.has(key)) {
      errors.push(
        `OpenAPI operation ${method.toUpperCase()} ${path} is not in api-spec.md.`,
      );
    }
  }
}

const errorEnum = openApi.components?.schemas?.ErrorCode?.enum || [];
for (const code of requiredErrorCodes) {
  if (!errorEnum.includes(code)) {
    errors.push(`ErrorCode enum must include ${code}.`);
  }
}

const statusEnum = openApi.components?.schemas?.ItemStatus?.enum || [];
for (const status of ["active", "uncapsulated", "for_sale", "for_repair"]) {
  if (!statusEnum.includes(status)) {
    errors.push(`ItemStatus enum must include ${status}.`);
  }
}

const candidateProperties =
  openApi.components?.schemas?.MarketplaceParsedCandidate?.properties || {};
for (const property of [
  "sourceUrl",
  "title",
  "imageUrls",
  "price",
  "currency",
  "brand",
  "suggestedCategoryId",
  "suggestedColorIds",
]) {
  if (!candidateProperties[property]) {
    errors.push(`MarketplaceParsedCandidate must include ${property}.`);
  }
}

const catalogSearchParameters = new Set(
  (paths["/api/catalog/search"]?.get?.parameters || []).map(
    (parameter) => parameter.name,
  ),
);
for (const parameter of ["q", "categoryId", "colorIds", "limit"]) {
  if (!catalogSearchParameters.has(parameter)) {
    errors.push(
      `/api/catalog/search must document query parameter ${parameter}.`,
    );
  }
}

// spec 034: every route the Go binary actually registers must exist in the
// OpenAPI contract with the same method + path, so an endpoint can never ship
// undocumented. The reverse direction stays loose on purpose — the contract is
// authored ahead of the domain-by-domain Go migration (wardrobe/capsule routes
// have no handlers yet).
function collectGoRoutes(apiRoot) {
  const routes = [];

  for (const entry of readdirSync(apiRoot, { recursive: true })) {
    const file = String(entry);
    if (!file.endsWith(".go") || file.endsWith("_test.go")) {
      continue;
    }

    const source = readFileSync(resolve(apiRoot, file), "utf8");
    for (const match of source.matchAll(/HandleFunc\(\s*"([A-Z]+) ([^"]+)"/g)) {
      routes.push({ method: match[1].toLowerCase(), path: match[2], file });
    }
  }

  return routes;
}

const goRoutes = collectGoRoutes(resolve(root, "api"));

if (goRoutes.length === 0) {
  errors.push(
    "No Go route registrations parsed under api/ — the Go↔OpenAPI guard is disarmed; adjust collectGoRoutes if the registration style changed.",
  );
}

for (const route of goRoutes) {
  if (!paths[route.path]?.[route.method]) {
    errors.push(
      `Go route ${route.method.toUpperCase()} ${route.path} (api/${route.file}) is not in openapi.yaml.`,
    );
  }
}

if (errors.length > 0) {
  console.error("API contract validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `API contract check passed: ${expectedRoutes.length} route-methods verified, ${goRoutes.length} Go route registrations covered.`,
);
