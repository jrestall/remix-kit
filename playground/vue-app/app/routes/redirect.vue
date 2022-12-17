<script lang="ts">
import type { LoaderFunction } from "@remix-run/router";
import { redirect } from "remix-router-vue";
import { sleep } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
  await sleep();
  let location = new URL(request.url).searchParams.get("location") || "/";
  return redirect(location);
};
</script>

<script setup />

<template>
  <h2>Shouldn't see me</h2>
</template>
