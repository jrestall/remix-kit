<script setup lang="ts">
import type { ReactElement } from "react";
import {
    createMemoryRouter,
    RouterProvider,
} from "remix-router-vue";

import { RemixContext } from "./components";
import type { EntryContext } from "./entry";
import { createServerRoutes } from "./routes";

export interface RemixServerProps {
  context: EntryContext;
  url: string | URL;
}

/**
 * The entry point for a Remix app when it is rendered on the server (in
 * `app/entry.server.js`). This component is used to generate the HTML in the
 * response from the server.
 */
  if (typeof url === "string") {
    url = new URL(url);
  }

  let { manifest, routeModules, serverHandoffString } = context;
  let routes = createServerRoutes(manifest.routes, routeModules);
  let router = createMemoryRouter(routes, context.staticHandlerContext);

</script>

<template>
    <RouterProvider :router="router" />
</template>