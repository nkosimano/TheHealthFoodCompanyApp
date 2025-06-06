import { HttpRequest } from "@azure/functions";

const ZOHO_TOKEN_ENDPOINT = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_REVOKE_ENDPOINT = 'https://accounts.zoho.com/oauth/v2/token/revoke';

interface ZohoTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error?: string;
    error_description?: string;
}

const zohoAuth = async function (context: { log: { error: (message: string, error?: any) => void }; res: any }, req: HttpRequest): Promise<void> {
    try {
        if (!req.body) {
            context.res = {
                status: 400,
                body: { error: "Request body is required" }
            };
            return;
        }

        // Handle token revocation
        if (req.url?.includes('/revoke')) {
            const { token } = req.body as { token?: string };
            if (!token) {
                context.res = {
                    status: 400,
                    body: { error: "Token is required for revocation" }
                };
                return;
            }

            // Validate environment variables
            const clientId = process.env.ZOHO_CLIENT_ID;
            const clientSecret = process.env.ZOHO_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                context.res = {
                    status: 500,
                    body: { error: "Missing required environment variables" }
                };
                return;
            }

            // Call Zoho's revocation endpoint
            const revokeResponse = await fetch(ZOHO_REVOKE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    token,
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });

            if (!revokeResponse.ok) {
                const errorData = await revokeResponse.json();
                context.log.error('Token revocation error:', errorData);
                context.res = {
                    status: revokeResponse.status,
                    body: {
                        error: errorData.error || "Token revocation failed",
                        error_description: errorData.error_description
                    }
                };
                return;
            }

            context.res = {
                status: 200,
                body: { message: "Token revoked successfully" }
            };
            return;
        }

        // Handle token exchange/refresh (existing code)
        const { code, refresh_token, redirect_uri } = req.body as { 
            code?: string; 
            refresh_token?: string; 
            redirect_uri?: string 
        };
        const grant_type = refresh_token ? 'refresh_token' : 'authorization_code';
        
        // Validate required parameters
        if (!code && !refresh_token) {
            context.res = {
                status: 400,
                body: { error: "Authorization code or refresh token is required" }
            };
            return;
        }

        // Validate environment variables
        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;
        const defaultRedirectUri = process.env.ZOHO_REDIRECT_URI;

        if (!clientId || !clientSecret) {
            context.res = {
                status: 500,
                body: { error: "Missing required environment variables" }
            };
            return;
        }

        // Build request parameters
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type,
            ...(code ? { 
                code,
                redirect_uri: redirect_uri || defaultRedirectUri || ''
            } : { 
                refresh_token: refresh_token || ''
            })
        });

        // Exchange code or refresh token for access token
        const response = await fetch(ZOHO_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json() as ZohoTokenResponse;

        if (!response.ok) {
            context.log.error('Zoho token error:', data);
            context.res = {
                status: response.status,
                body: {
                    error: data.error || "Token exchange failed",
                    error_description: data.error_description
                }
            };
            return;
        }

        // Return tokens and expiry information
        context.res = {
            status: 200,
            body: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in
            }
        };
    } catch (error: unknown) {
        context.log.error('Error in zohoAuth function:', error);
        context.res = {
            status: 500,
            body: { 
                error: "Internal server error",
                error_description: process.env.NODE_ENV === 'development' ? 
                    error instanceof Error ? error.message : String(error) 
                    : undefined
            }
        };
    }
};

export default zohoAuth; 