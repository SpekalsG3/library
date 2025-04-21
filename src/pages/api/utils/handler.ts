import { NextApiRequest, NextApiResponse } from "next";
import { IRequestResponseSuccess } from "../types";

export type Handle<T> = (
    req: NextApiRequest,
    res: NextApiResponse<IRequestResponseSuccess<T>>,
) => void | Promise<void>

function notFound (
    req: NextApiRequest,
    res: NextApiResponse<any>,
) {
    res.status(404).send("not found");
}

function error (
    error: any,
    req: NextApiRequest,
    res: NextApiResponse<any>,
) {
    res.status(400).send({
        success: false,
        response: {
            message: error.message,
        },
    });
}

export function handler<POST, GET, PUT, DEL> (
    handlers: {
        "post"?: Handle<POST>,
        "get"?: Handle<GET>,
        "put"?: Handle<PUT>,
        "delete"?: Handle<DEL>,
        [s: string]: any,
    }
) {
    return async (
        req: NextApiRequest,
        res: NextApiResponse<POST | GET | PUT | DEL>,
    ) => {
        if (!req.method) {
            return notFound(req, res);
        }

        const h = handlers[req.method.toLowerCase()];
        if (h) {
            try {
                return await h(req, res);
            } catch (e) {
                return error(e, req, res);
            }
        } else {
            return notFound(req, res);
        }
    }
}
