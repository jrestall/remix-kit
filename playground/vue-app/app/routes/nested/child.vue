<script lang="ts">
import type { LoaderFunction } from "@remix-run/router";
import { json, useLoaderData } from "remix-router-vue";
import { sleep } from "~/utils";

interface LoaderData {
  data: string;
}

export const loader: LoaderFunction = async () => {
  await sleep();
  return json<LoaderData>({ data: "child loader data" });
};
</script>

<script setup lang="ts">
const data = useLoaderData() as Ref<LoaderData>;
</script>

<template>
  <h3>Child Route</h3>
  <p id="child">Child data: {{ data.data }}</p>
</template>
