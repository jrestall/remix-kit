import * as build from "@remix-run/dev/server-build";
import type { ExecuteFunction } from "./dev-runner";

export default function executor(execute: ExecuteFunction<any>) {
    return execute(build);
}