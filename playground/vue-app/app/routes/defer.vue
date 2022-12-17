<script>
import { Await, defer, useLoaderData } from "remix-router-vue";

const resolve = (d, ms) => new Promise((r) => setTimeout(() => r(d), ms));

const reject = (d, ms) => new Promise((_, r) => setTimeout(() => r(d), ms));

export async function loader() {
  return defer({
    critical: await resolve("Critical Data", 1000),
    lazy: resolve("Lazy Data ✅", 1000),
    lazyError: reject("Lazy Error 💥", 2000),
  });
}
</script>

<script setup>
const data = useLoaderData();
</script>

<template>
  <p id="critical-data">Critical Data: {{ data.critical }}</p>

  <Suspense>
    <template #fallback>
      <p id="lazy-value">Loading data...</p>
    </template>
    <Await :resolve="data.lazy" v-slot="value">
      <p id="lazy-value">Value: {{ value }}</p>
    </Await>
  </Suspense>

  <Suspense>
    <template #fallback>
      <p id="lazy-error">Loading error...</p>
    </template>
    <Await :resolve="data.lazyError">
      <template #default="value">
        <p>Value: {{ value }}</p>
      </template>
      <template #error="error">
        <p id="lazy-error">Error: {{ error }}</p>
      </template>
    </Await>
  </Suspense>
</template>
