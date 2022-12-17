<script lang="ts">
import { ActionFunction, LoaderFunction } from "@remix-run/router";
import { Link, Outlet, useLoaderData } from "remix-router-vue";

import { deleteTask, getTasks } from "~/utils";
import { sleep } from "~/utils";
import TaskItem from "~/components/TaskItem.vue";

export const loader: LoaderFunction = async () => {
  await sleep();
  return {
    tasks: getTasks(),
  };
};

export const action: ActionFunction = async ({ request }) => {
  await sleep();
  let formData = await request.formData();
  deleteTask(formData.get("taskId") as string);
  return {};
};
</script>

<script setup lang="ts">
const data = useLoaderData() as ReturnType<typeof loader>;
</script>

<template>
  <h2>Tasks</h2>
  <ul>
    <li v-for="task in data.tasks" :key="task.id">
      <TaskItem :task="task" />
    </li>
  </ul>
  <Link to="/tasks/new">Add New Task</Link>
  <Outlet />
</template>
