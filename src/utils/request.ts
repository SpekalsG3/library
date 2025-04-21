import {IRequestResponseSuccess} from "@api/types";

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

export async function myRequest<B, R> (url: string, options: {
    method: MyRequestMethods,
    headers?: Record<string, string>,
    body?: string | B,
    query?: Record<string, string>,
}) {
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

    let res: Response;
    try {
        res = await new Promise<Response>((resolve, reject) => {
            fetch(url, {
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
        return {
            body: await res.json(),
        } as {
            body: IRequestResponseSuccess<R>,
        }
    }

    throw new MyRequestError<R>({
        response: {
            body: await res.json(),
        },
        message: "Server returned error",
    })
}
