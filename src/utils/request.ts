import {IResSuccess} from "@api/types";
import * as querystring from "node:querystring";
import * as process from "node:process";
import {bool} from "prop-types";

export enum MyRequestMethods {
    POST = "POST",
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE",
}

interface MyResponse<R> {
    body: R,
}

export class MyRequestError<R> extends Error {
    public response?: MyResponse<R>;

    constructor (data: {
        response?: MyResponse<R>;
        message: string;
    }) {
        super(data.message)
        this.response = data.response;
    }

    public toString(): string {
        return `${this.message}` + (this.response ? `: "${JSON.stringify(this.response.body)}"` : "");
    }
}

export async function myRequest<B, R> (pathname: string, options: {
    method: MyRequestMethods,
    headers?: Record<string, string>,
    body?: string | B,
    query?: URLSearchParams | Record<string, string>,
}): Promise<MyResponse<R>> {
    let body: string | undefined;
    let contentType: string | undefined;
    if (options.body) {
        if (typeof options.body === "string") {
            contentType = "text/plain";
            body = options.body;
        } else if (typeof options.body === "object" && options.body !== null) {
            contentType = "application/json";
            body = JSON.stringify(options.body)
        }
    }

    let finalUrl = pathname;
    if (options.query) {
        const params = new URLSearchParams(options.query)
        if (finalUrl.includes("?")) {
            finalUrl += "&" + params.toString();
        } else {
            finalUrl += "?" + params.toString();
        }
    }

    let res: Response;
    try {
        res = await new Promise<Response>((resolve, reject) => {
            fetch(finalUrl, {
                method: options.method,
                headers: {
                    ...options.headers,
                    "Content-Type": contentType,
                } as any,
                body: body,
            })
                .then(resolve)
                .catch(reject)
        });
    } catch (e) {
        throw new MyRequestError<R>({
            response: undefined,
            message: (e as Error).message,
        })
    }

    if (res.status === 200 || res.status === 201) {
        let body: any | null = null;

        const resContentType = res.headers.get("Content-Type");
        if (resContentType) {
            if (resContentType.includes("application/json")) {
                body = await res.json();
            } else if (resContentType.includes("text/plain")) {
                body = await res.text();
            }
        }

        if (body === null) {
            throw new MyRequestError<any>({
                response: {
                    body: await res.arrayBuffer(),
                },
                message: `Unhandled response type: ${resContentType}`,
            });
        }

        return {
            body: body,
        };
    }

    throw new MyRequestError<R>({
        response: {
            body: await res.json(),
        },
        message: "Server returned error",
    })
}
