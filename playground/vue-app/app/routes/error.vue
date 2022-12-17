<script lang="ts">
import type { LoaderFunction } from "@remix-run/router";
import { json, useLoaderData } from "remix-router-vue";

export const loader: LoaderFunction = async ({ request }) => {
  let isLoaderError =
    new URL(request.url).searchParams.get("type") === "loader";
  if (isLoaderError) {
    throw new Error("Loader error!");
  }
  return json({});
};
</script>

<script setup lang="ts">
const data = useLoaderData() as ReturnType<typeof loader>;
</script>

<template>
  <h2>Render Error: {{ data.foo.bar }}</h2>
  ;
</template>
