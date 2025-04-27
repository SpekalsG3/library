export enum MyRequestMethods {
    POST = "POST",
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE",
}

interface MyResponse<R> {
    body: R,
    status: number,
}

export class MyRequestError<R> extends Error {
    public readonly response?: MyResponse<R>;
    public readonly message: string;

    constructor (data: {
        response?: MyResponse<R>;
        message: string;
    }) {
        super(data.message)
        this.response = data.response;
        this.message = data.message;
    }

    public toString(): string {
        return `${this.message}` + (this.response ? `: "${JSON.stringify(this.response.body)}"` : "");
    }
}

type RequestResponse<R> = {
    response: MyResponse<R> | null,
    errmsg: string
} | {
    response: MyResponse<R>,
    errmsg: null,
};

async function doFetch<R>(
  url: URL,
  opts: RequestInit,
): Promise<RequestResponse<R>> {
    let res: Response;
    try {
        res = await fetch(url, opts);
    } catch (e) {
        console.error('Raw fetch error:', e);
        return {
            response: null,
            errmsg: (e as Error).message,
        }
    }

    let resBody: any | null = null;
    const resContentType = res.headers.get("Content-Type");
    if (resContentType) {
        if (resContentType.includes("application/json")) {
            resBody = await res.json();
        } else if (resContentType.includes("text/plain")) {
            resBody = await res.text();
        }
    }
    if (resBody === null) {
        return {
            response: {
                body: await res.arrayBuffer() as any,
                status: res.status,
            },
            errmsg: `Unhandled response type: ${resContentType}`,
        }
    }

    if (res.ok) {
        return {
            response: {
                body: resBody,
                status: res.status,
            },
            errmsg: null,
        };
    }

    return {
        response: {
            body: resBody,
            status: res.status,
        },
        errmsg: "Server returned error",
    }
}

interface XHROpts {
    method: MyRequestMethods,
    headers: Record<string, string>,
    body?: any,
}
function doXHR<R>(
  url: URL,
  opts: XHROpts,
): Promise<RequestResponse<R>> {
    return new Promise((resolve) => {
        function handleEvent(e: ProgressEvent<XMLHttpRequestEventTarget> | Event) {
            // console.debug(`[MyRequest] event '${e.type}'${'loaded' in e ? `, ${e.loaded} bytes transferred` : ""}`);
        }

        const req = new XMLHttpRequest();

        function parseBody(): { body: any, errmsg: string | null } {
            let body: any = req.response;
            let errmsg: string | null = null;

            const resContentType = req.getResponseHeader("Content-Type");
            if (resContentType) {
                if (resContentType.includes("text/plain")) {
                    if (typeof body !== "string") {
                        errmsg = `ContentType says ${resContentType} (string) but response is ${typeof body}`;
                    }
                } else if (resContentType.includes("application/json")) {
                    if (typeof body === "object") {
                        // TODO: check, is it already parsed?
                    } else if (typeof body === "string") {
                        try {
                            body = JSON.parse(body);
                        } catch (e) {
                            errmsg = `Failed to parse json ContentType: ${e}`;
                        }
                    }
                } else {
                    errmsg = `Unknown ContentType, cannot process body: ${resContentType}`;
                }
            } else {
                errmsg = "ContentType is undefined, cannot process body";
            }
            return {
                body: body,
                errmsg: errmsg,
            }
        }

        req.addEventListener("load", (e) => {
            handleEvent(e);
            let { body, errmsg } = parseBody();

            if (errmsg === null) {
                if (req.status >= 400 && req.status < 600) {
                    errmsg = "Server responded with error";
                }
            }

            resolve({
                response: {
                    body: body,
                    status: req.status,
                },
                errmsg: errmsg,
            });
        });
        req.addEventListener("error", (e) => {
            handleEvent(e);
            resolve({
                response: null,
                errmsg: "XHR error",
            })
        });
        req.addEventListener("abort", (e) => {
            handleEvent(e);
            resolve({
                response: null,
                errmsg: "XHR was aborted",
            })
        });
        req.addEventListener("progress", (e) => {
            handleEvent(e);
        });
        req.addEventListener("timeout", (e) => {
            handleEvent(e);
            resolve({
                response: null,
                errmsg: "XHR timeout",
            })
        });
        req.addEventListener("loadend", (e) => {
            handleEvent(e);
        });
        req.addEventListener("loadstart", (e) => {
            handleEvent(e);
        });
        req.addEventListener("readystatechange", (e) => {
            handleEvent(e);
        });

        req.open(opts.method, url);
        for (const header in opts.headers) {
            req.setRequestHeader(header, opts.headers[header]);
        }

        req.send(opts.body);
    });
}

export async function myRequest<B, R> (url: string, options: {
    method: MyRequestMethods,
    headers?: Record<string, string>,
    body?: string | B,
    query?: URLSearchParams | Record<string, string>,
}): Promise<MyResponse<R>> {
    const headers: Record<string, string> = options.headers ?? {};

    let reqBody: string | undefined;
    if (options.body) {
        let contentType: string | undefined;
        if (typeof options.body === "string") {
            contentType = "text/plain";
            reqBody = options.body;
        } else if (typeof options.body === "object" && options.body !== null) {
            contentType = "application/json";
            reqBody = JSON.stringify(options.body)
        }
        if (contentType) {
            headers["Content-Type"] = contentType;
        }
    }

    let finalUrl!: URL;
    if (url.startsWith(".") || url.startsWith("/")) {
        finalUrl = new URL(url, window.location.origin);
    }
    if (options.query) {
        new URLSearchParams(options.query)
          .forEach((value, key) => finalUrl.searchParams.set(key, value))
    }

    const data = await doFetch<R>(finalUrl, {
        method: options.method,
        headers: headers,
        body: reqBody,
    });
    // const data = await doXHR<R>(finalUrl, {
    //     body: reqBody,
    //     headers,
    //     method: options.method,
    // });

    if (data.errmsg !== null) {
        throw new MyRequestError({
            response: data.response as any,
            message: data.errmsg,
        });
    }

    return data.response;
}
