<script lang="ts">
import { ActionFunction, redirect } from "@remix-run/router";
import { Form, useNavigation } from "remix-router-vue";
import { computed } from "vue";

import { addTask } from "~/utils";
import { sleep } from "~/utils";

export const action: ActionFunction = async ({ request }) => {
  await sleep();
  let formData = await request.formData();
  addTask(formData.get("newTask") as string);
  return redirect("/tasks", { status: 302 });
};
</script>

<script setup lang="ts">
const navigation = useNavigation();
const isAdding = computed(() => navigation.value.state !== "idle");
</script>

<template>
  <h3>New Task</h3>
  <Form method="post">
    <input name="newTask" placeholder="Add a task..." :disabled="isAdding" />
    <button type="submit" :disabled="isAdding">
      {{ isAdding ? "Adding..." : "Add" }}
    </button>
  </Form>
</template>
