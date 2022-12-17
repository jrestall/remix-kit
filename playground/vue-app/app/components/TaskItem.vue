<script lang="ts">
import { Link, useFetcher } from "remix-router-vue";
import { computed, defineComponent, watchEffect } from "vue";

export default defineComponent({
  name: "TaskItem",
  components: {
    Link,
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    let fetcher = useFetcher();
    let isDeleting = computed(() => fetcher.value.formData != null);

    return {
      fetcher,
      task: props.task,
      isDeleting,
    };
  },
});
</script>

<template>
  <span>{{ task.task }}</span>
  &nbsp;
  <Link :to="`/tasks/${task.id}`">Open</Link>
  &nbsp;
  <component
    :is="fetcher.Form"
    style="display: inline"
    action="/tasks"
    method="post"
  >
    <button type="submit" name="taskId" :value="task.id" :disabled="isDeleting">
      {{ isDeleting ? "Deleting..." : "❌" }}
    </button>
  </component>
</template>
