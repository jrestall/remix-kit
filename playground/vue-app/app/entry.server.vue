<script lang="ts">
import type { EntryContext } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer'
import RemixServer from "./vue/RemixServer.vue";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
    const vueApp = createSSRApp(RemixServer, { context: remixContext, url: request.url });

    const html = await renderToString(vueApp)

    responseHeaders.set("Content-Type", "text/html");
    return new Response(html, { headers: responseHeaders, status: responseStatusCode });
}
</script>