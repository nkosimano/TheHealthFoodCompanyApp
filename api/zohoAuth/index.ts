// In: api/zohoAuth/index.ts

import { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

const ZOHO_TOKEN_ENDPOINT = 'https://accounts.zoho.com/oauth/v2/token';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const httpTrigger: HttpHandler = async function (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (req.method === 'OPTIONS') {
        return { status: 204, headers: corsHeaders };
    }

    try {
        const body = await req.json() as any;
        const { code, refresh_token, redirect_uri } = body;
        const grant_type = refresh_token ? 'refresh_token' : 'authorization_code';

        if (!code && !refresh_token) {
            return { status: 400, headers: corsHeaders, jsonBody: { error: "Authorization code or refresh token is required" } };
        }

        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            context.error("ERROR: Missing ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET in environment variables.");
            return { status: 500, headers: corsHeaders, jsonBody: { error: "Server configuration error" } };
        }

        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type,
            ...(code ? { code, redirect_uri } : { refresh_token })
        });

        const response = await fetch(ZOHO_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const data = await response.json() as any;

        if (!response.ok) {
            context.error(`ERROR: Zoho token exchange failed: ${JSON.stringify(data)}`);
            return { status: response.status, headers: corsHeaders, jsonBody: { error: data.error || "Token exchange failed" }};
        }

        return { status: 200, headers: corsHeaders, jsonBody: data };

    } catch (error) {
        const err = error as Error;
        context.error(`FATAL ERROR in zohoAuth function: ${err.message}`);
        return { status: 500, headers: corsHeaders, jsonBody: { error: "Internal server error", details: err.message } };
    }
};

export default httpTrigger;