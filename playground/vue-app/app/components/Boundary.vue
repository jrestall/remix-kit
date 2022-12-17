<script setup lang="ts">
import { Link, useRouteError } from "remix-router-vue";
import { Ref } from "vue";

let error = useRouteError() as Ref<Error>;
</script>

<template>
  <h2>Application Error Boundary</h2>
  <p>{{ error.message }}</p>
  <Link to="/">Go home</Link>
</template>
