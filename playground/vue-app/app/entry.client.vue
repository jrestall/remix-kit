<script lang="ts">
import { EntryContext } from "@remix-run/node";
import { createApp, createSSRApp } from "vue";

import RemixBrowser from "./vue/RemixBrowser.vue";

declare global {
  var __remixManifest: EntryContext["manifest"];
}

const isSSR = window.__remixManifest;
const vueApp = isSSR ? createSSRApp(RemixBrowser) : createApp(RemixBrowser);

vueApp.mount('#app');
</script>
