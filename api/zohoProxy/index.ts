import { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

const ZOHO_INVENTORY_API = 'https://inventory.zohoapis.com/api/v1';
const ZOHO_PEOPLE_API = 'https://people.zoho.com/people/api';

const httpTrigger: HttpHandler = async function (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return { status: 204, headers };
    }

    const requestPath = req.params.path || '(unknown)';

    try {
        const authHeader = req.headers.get('authorization');
        context.info(`Proxying request for path: ${requestPath}`);

        if (!authHeader) {
            return { status: 401, headers, jsonBody: { error: 'Missing authorization header' }};
        }

        const targetUrlBase = requestPath.startsWith('forms/P_EmployeeView/records')
            ? ZOHO_PEOPLE_API
            : ZOHO_INVENTORY_API;

        const fullTargetUrl = `${targetUrlBase}/${requestPath}${req.url.search}`;

        const fetchOptions: RequestInit = {
            method: req.method,
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: req.body ? JSON.stringify(await req.json()) : undefined
        };

        const response = await fetch(fullTargetUrl, fetchOptions);
        const responseData = await response.json();

        return { status: response.status, headers, jsonBody: responseData };

    } catch (error) {
        const err = error as Error;
        context.error(`ERROR in zohoProxy for path ${requestPath}: ${err.message}`);
        return { status: 500, headers, jsonBody: { error: 'Internal Server Error', details: err.message }};
    }
};

export default httpTrigger;