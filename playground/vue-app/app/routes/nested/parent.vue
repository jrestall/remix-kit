<script lang="ts">
import type { LoaderFunction } from "@remix-run/router";
import { json, Outlet, useLoaderData } from "remix-router-vue";
import { Ref } from "vue";
import { sleep } from "~/utils";

interface LoaderData {
  data: string;
}

export const loader: LoaderFunction = async () => {
  await sleep();
  return json<LoaderData>({ data: "parent loader data" });
};
</script>

<script setup lang="ts">
const data = useLoaderData() as Ref<LoaderData>;
</script>

<template>
  <h2>Parent Layout</h2>
  <p id="parent">Parent data: {{ data.data }}</p>
  <Outlet />
</template>
