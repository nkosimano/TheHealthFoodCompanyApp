import { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

const ZOHO_API_BASE_URL = process.env.ZOHO_API_BASE_URL || 'https://inventory.zohoapis.com/api/v3';

// --- History Logging Setup (Copied from batchOperations, ensure consistency) ---
interface HistoryEntity {
    partitionKey: string; // UserId
    rowKey: string;       // Unique ID, e.g., reverse chronological timestamp + unique suffix
    timestamp: Date;
    actionType: string;   // e.g., "INVENTORY_OPERATION"
    operation?: string;    // From req.params.operation
    requestMethod?: string; // req.method
    success: boolean;
    details?: string;      // JSON string of request body or response snippet
    zohoResponseStatus?: number;
}

interface HistoryEventData {
    requestBody?: unknown;
    zohoResponse?: unknown;
}

const historyTableName = "UserHistory";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

let historyTableClient: TableClient;
if (storageAccountName && storageAccountKey) {
    const credential = new AzureNamedKeyCredential(storageAccountName, storageAccountKey);
    historyTableClient = new TableClient(`https://${storageAccountName}.table.core.windows.net`, historyTableName, credential);
} else {
    const connectionString = process.env.AzureWebJobsStorage;
    if (connectionString) {
        historyTableClient = TableClient.fromConnectionString(connectionString, historyTableName);
    } else {
        console.warn("History TableClient not initialized: Storage account details or AzureWebJobsStorage not set.");
    }
}

async function recordHistoryEvent(
    context: InvocationContext,
    userId: string,
    actionType: string,
    operationParam: string | undefined,
    requestMethod: string | undefined,
    success: boolean,
    requestBody: unknown,
    zohoResponseStatus?: number,
    zohoResponseData?: unknown
): Promise<void> {
    if (!historyTableClient) {
        context.warn("History table client not initialized. Skipping history record.");
        return;
    }
    if (!userId || userId === "unknown-user") {
        context.warn("User ID is unknown for history record. Skipping.");
        return;
    }

    const now = new Date();
    const invertedTimestamp = (Number.MAX_SAFE_INTEGER - now.getTime()).toString().padStart(16, '0');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const historyEntry: HistoryEntity = {
        partitionKey: userId,
        rowKey: `${invertedTimestamp}_${uniqueSuffix}`,
        timestamp: now,
        actionType: actionType,
        operation: operationParam,
        requestMethod: requestMethod,
        success: success,
        details: JSON.stringify({ 
            requestBody: success ? undefined : requestBody,
            zohoResponse: success ? zohoResponseData : undefined 
        } as HistoryEventData),
        zohoResponseStatus: zohoResponseStatus
    };

    try {
        await historyTableClient.createTable(); // This will create the table if it doesn't exist
        await historyTableClient.createEntity(historyEntry);
        context.log(`History event recorded for user ${userId}, action: ${actionType}`);
    } catch (error) {
        if (error instanceof Error) {
            context.error(`Failed to record history event for user ${userId}:`, error.message);
        } else {
            context.error(`Failed to record history event for user ${userId}: Unknown error object:`, error);
        }
    }
}
// --- End History Logging Setup ---

const inventoryHttpTrigger: HttpHandler = async function (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return { status: 204, headers };
    }

    // --- User Identification for History ---
    let userIdFromPrincipal: string | undefined;
    const clientPrincipalHeader = req.headers.get('x-ms-client-principal');
    if (clientPrincipalHeader) {
        try {
            const principal = JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString('utf-8'));
            userIdFromPrincipal = principal.userId;
            context.log("User ID for history from x-ms-client-principal:", userIdFromPrincipal);
        } catch (err) {
            if (err instanceof Error) {
                context.warn("Failed to parse x-ms-client-principal for history:", err.message);
            } else {
                context.warn("Failed to parse x-ms-client-principal for history: Unknown error object:", err);
            }
        }
    }
    const userIdForHistory = userIdFromPrincipal || "unknown-user"; // Fallback
    // --- End User Identification ---

    try {
        const operation = req.params.operation;
        const authHeader = req.headers.get('authorization');

        if (!authHeader) {
            return {
                status: 401,
                headers,
                jsonBody: { error: 'Missing authorization header' }
            };
        }

        const response = await fetch(`${ZOHO_API_BASE_URL}/${operation}`, {
            method: req.method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.json();

        // Record history after successful Zoho call
        if (response.ok) {
            await recordHistoryEvent(
                context, 
                userIdForHistory, 
                "INVENTORY_OPERATION_SUCCESS", 
                operation, 
                req.method, 
                true, 
                req.method === 'POST' ? await req.json() : null, 
                response.status,
                data
            );
        } else {
            await recordHistoryEvent(
                context, 
                userIdForHistory, 
                "INVENTORY_OPERATION_FAILED", 
                operation, 
                req.method, 
                false, 
                req.method === 'POST' ? await req.json() : null, 
                response.status,
                data
            );
        }

        return {
            status: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            jsonBody: data
        };
    } catch (error) {
        context.error('Inventory operation error:', error);
        // Record history for catch block errors
        await recordHistoryEvent(
            context, 
            userIdForHistory, 
            "INVENTORY_OPERATION_EXCEPTION", 
            req.params.operation, 
            req.method, 
            false, 
            req.method === 'POST' ? await req.json().catch(() => 'Error reading body') : null, 
            500, 
            (error instanceof Error ? { errorMessage: error.message, errorStack: error.stack } : { errorMessage: "Unknown exception type" })
        );

        return {
            status: 500,
            headers,
            jsonBody: {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
};

export default inventoryHttpTrigger;
