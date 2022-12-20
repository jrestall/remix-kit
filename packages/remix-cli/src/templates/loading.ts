export function loading(loading: string) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${loading}</title>
            <meta charset="utf-8" />
            <meta content="width=device-width,initial-scale=1.0,minimum-scale=1.0" name="viewport" />
        </head>
        <body>
            <div>${loading}</div>
            <script>
            if (typeof window.fetch === 'undefined') {
                setTimeout(() => window.location.reload(), 1000)
            } else {
                const check = async () => {
                try {
                    const body = await window
                    .fetch(window.location.href)
                    .then(r => r.text())
                    if (!body.includes('${loading}')) {
                    return window
                        .location
                        .reload()
                    }
                } catch  {}
                setTimeout(check, 1000)
                }
                check()
            }
            </script>
        </body>
        </html>`;
}
