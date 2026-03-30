import { withResilience, fetchWithResilience } from "../helpers/resilience";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

export interface Item {
  id?: number;
  name: string;
  description: string;
}

/**
 * GET /items — resilient with 3 retries, 5s timeout.
 */
export async function getItems(): Promise<Item[]> {
  const { data: response } = await fetchWithResilience(
    `${API_BASE}/items`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
    { maxRetries: 3, timeoutMs: 5000 }
  );
  return response.json();
}

/**
 * POST /items — resilient with 2 retries (mutations are more cautious).
 */
export async function createItem(item: Item): Promise<Item> {
  const { data: response } = await fetchWithResilience(
    `${API_BASE}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    },
    {
      maxRetries: 2,
      timeoutMs: 8000,
      retryable: (error) => {
        // Never retry mutations on 4xx (client errors)
        if (
          error !== null &&
          typeof error === "object" &&
          "status" in error
        ) {
          const status = (error as Record<string, unknown>).status as number;
          return status >= 500 || status === 429;
        }
        return true;
      },
    }
  );
  return response.json();
}