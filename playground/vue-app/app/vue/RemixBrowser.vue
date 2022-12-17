<script lang="ts">
/* eslint-disable prefer-let/prefer-let */
declare global {
  var __remixContext: {
    state: HydrationState;
  };
  var __remixRouteModules: RouteModules;
  var __remixManifest: EntryContext["manifest"];
}
/* eslint-enable prefer-let/prefer-let */
</script>

<script setup lang="ts">
import { h } from "vue";
import type { HydrationState } from "@remix-run/router";
import { createBrowserRouter, RouterProvider } from "remix-router-vue";
import type { EntryContext } from "./entry";
import { deserializeErrors } from "./errors";
import type { RouteModules } from "./routeModules";
import { createClientRoutes } from "./routes";

let routes = createClientRoutes(
  window.__remixManifest.routes,
  window.__remixRouteModules
);

let hydrationData = window.__remixContext.state;
if (hydrationData && hydrationData.errors) {
  hydrationData = {
    ...hydrationData,
    errors: deserializeErrors(hydrationData.errors),
  };
}

let router = createBrowserRouter(routes, { hydrationData });
  
const fallbackElement = () => h("p", "Loading...");
</script>

<template>
  <RouterProvider :router="router" :fallbackElement="fallbackElement" />
</template>