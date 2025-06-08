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

    try {
        const requestPath = req.params.path;
        const authHeader = req.headers.get('authorization');

        context.log(`Received request for path: ${requestPath}`);
        context.log(`Full request URL: ${req.url}`);
        context.log(`Query parameters: ${req.query.toString()}`);

        if (!authHeader) {
            return { status: 401, headers, jsonBody: { error: 'Missing authorization header' }};
        }

        let targetUrl = '';
        // Route to Zoho People only for specific known People API paths
        if (requestPath.startsWith('forms/P_EmployeeView/records')) {
            targetUrl = `${ZOHO_PEOPLE_API}/${requestPath}`;
        } else {
            // Default: route all other requests to Zoho Inventory
            targetUrl = `${ZOHO_INVENTORY_API}/${requestPath}`;
        }

        // Preserve query string only if present
        const queryString = req.query && Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
        const fullTargetUrl = `${targetUrl}${queryString}`;
        context.log(`Proxying request for '${requestPath}' to: ${fullTargetUrl}`);

        // Only send a body for methods that support it
        let fetchOptions: any = {
            method: req.method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        };
        if (!["GET", "HEAD"].includes(req.method.toUpperCase()) && req.body) {
            fetchOptions.body = JSON.stringify(await req.json());
        }

        const response = await fetch(fullTargetUrl, fetchOptions);

        const contentType = response.headers.get("content-type");
        let responseData: any;
        if (contentType?.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        return {
            status: response.status,
            headers: { ...headers, 'Content-Type': 'application/json' },
            jsonBody: responseData
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        context.error(`Proxy Error for path ${req.params.path}:`, errorMessage);
        return { status: 500, headers, jsonBody: { error: 'Internal Server Error', details: errorMessage }};
    }
};

export default httpTrigger;
