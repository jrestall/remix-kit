# Remix Vite

> Vite builder and development server for Remix

# TODO

- hasLoader & hasAction for dev asset manifest
- Remove server code from entry routes
- loader template

# Notes

const modules = import.meta.glob('./routes/**/*.ts(.?)')

const modules = {
  './dir/foo.js': () =>
    import('./dir/foo.js?foo=bar&bar=true').then((m) => m.setup),
  './dir/bar.js': () =>
    import('./dir/bar.js?foo=bar&bar=true').then((m) => m.setup),
}

    "version": "",
    "entry": {
        "module": "/entry.client.ts",
        "imports": []
    },
    "routes": {
        "root": {
            "id": "root",
            "path": "",
            "module": "/build/root-QGYOZY6V.js",
            "imports": [],
            "hasAction": false,
            "hasLoader": true,
            "hasCatchBoundary": false,
            "hasErrorBoundary": false
        },
        "routes/$slug": {
            "id": "routes/$slug",
            "parentId": "root",
            "path": ":slug",
            "module": "/build/routes/$slug-K7KCMZPP.js",
            "imports": [],
            "hasAction": false,
            "hasLoader": true,
            "hasCatchBoundary": false,
            "hasErrorBoundary": false
        },
    }
}
