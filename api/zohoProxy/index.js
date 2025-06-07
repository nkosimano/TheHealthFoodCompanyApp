"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ZOHO_INVENTORY_API = 'https://inventory.zohoapis.com/api/v1';
const ZOHO_PEOPLE_API = 'https://people.zoho.com/people/api';
const httpTrigger = async function (req, context) {
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
            return { status: 401, headers, jsonBody: { error: 'Missing authorization header' } };
        }
        let targetUrl = '';
        // Intelligent routing based on the request path
        if (requestPath.startsWith('forms/P_EmployeeView/records')) {
            targetUrl = `${ZOHO_PEOPLE_API}/${requestPath}`;
        }
        else if (requestPath.startsWith('settings') || requestPath.startsWith('userinfo')) {
            targetUrl = `${ZOHO_INVENTORY_API}/${requestPath}`;
            context.log(`Specifically routing ${requestPath} to Zoho Inventory API`);
        }
        else {
            // Default to Zoho Inventory for all other requests
            targetUrl = `${ZOHO_INVENTORY_API}/${requestPath}`;
        }
        const fullTargetUrl = `${targetUrl}?${req.query.toString()}`;
        context.log(`Proxying request for '${requestPath}' to: ${fullTargetUrl}`);
        const response = await fetch(fullTargetUrl, {
            method: req.method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: req.body ? JSON.stringify(await req.json()) : null
        });
        const contentType = response.headers.get("content-type");
        let responseData;
        if (contentType?.includes("application/json")) {
            responseData = await response.json();
        }
        else {
            responseData = await response.text();
        }
        return {
            status: response.status,
            headers: { ...headers, 'Content-Type': 'application/json' },
            jsonBody: responseData
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        context.error(`Proxy Error for path ${req.params.path}:`, errorMessage);
        return { status: 500, headers, jsonBody: { error: 'Internal Server Error', details: errorMessage } };
    }
};
exports.default = httpTrigger;
