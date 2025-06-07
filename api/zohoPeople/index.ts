import { HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

const ZOHO_PEOPLE_API = 'https://people.zoho.com/people/api';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function zohoPeopleProxy(context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    // Handle preflight CORS request
    if (req.method === 'OPTIONS') {
        return { status: 204, headers: corsHeaders };
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return {
                status: 401,
                headers: corsHeaders,
                jsonBody: { error: "No authorization token provided" }
            };
        }

        // Get the path parameters and query string
        const path = req.params.path || '';
        const queryString = req.url.split('?')[1] || '';
        const url = `${ZOHO_PEOPLE_API}/${path}${queryString ? '?' + queryString : ''}`;

        // Forward the request to Zoho
        const response = await fetch(url, {
            method: req.method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: req.method !== 'GET' ? await req.text() : undefined
        });

        const responseData = await response.json();

        return {
            status: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            jsonBody: responseData
        };
    } catch (error: unknown) {
        context.error('Error in zohoPeopleProxy:', error);
        return {
            status: 500,
            headers: corsHeaders,
            jsonBody: {
                error: "Internal server error",
                message: process.env.NODE_ENV === 'development' ? 
                    error instanceof Error ? error.message : String(error)
                    : undefined
            }
        };
    }
} 