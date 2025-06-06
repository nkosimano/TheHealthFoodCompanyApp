import { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

const httpTrigger: HttpHandler = async function (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return {
            status: 204,
            headers
        };
    }

    try {
        const requestBodyText = await req.text();
        const params = new URLSearchParams(requestBodyText);
        const grantType = params.get('grant_type');
        const code = params.get('code');
        const refreshToken = params.get('refresh_token');
        const redirectUri = params.get('redirect_uri');

        // Validate required parameters
        if (!grantType || (!code && !refreshToken)) {
            return {
                status: 400,
                headers,
                jsonBody: {
                    error: 'invalid_request',
                    error_description: 'Missing required parameters'
                }
            };
        }

        // Get client credentials from environment variables
        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;

        // Validate client credentials
        if (!clientId || !clientSecret) {
            context.error('Missing client credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
            return {
                status: 500,
                headers,
                jsonBody: {
                    error: 'server_error',
                    error_description: 'Missing client credentials'
                }
            };
        }

        // Create new params for Zoho request
        const zohoParams = new URLSearchParams();
        zohoParams.append('client_id', clientId);
        zohoParams.append('client_secret', clientSecret);
        zohoParams.append('grant_type', grantType);

        if (code) {
            zohoParams.append('code', code);
            zohoParams.append('redirect_uri', redirectUri!);
        } else if (refreshToken) {
            zohoParams.append('refresh_token', refreshToken);
        }

        // Forward the request to Zoho's token endpoint
        const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: zohoParams.toString()
        });

        const data = await response.json();

        return {
            status: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            jsonBody: data
        };
    } catch (error) {
        context.error('Token exchange error:', error);
        return {
            status: 500,
            headers,
            jsonBody: {
                error: 'internal_server_error',
                error_description: error instanceof Error ? error.message : 'An unknown error occurred'
            }
        };
    }
};

export default httpTrigger;