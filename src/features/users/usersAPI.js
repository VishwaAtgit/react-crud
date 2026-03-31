import { fetchWithRetry } from "../../utils/fetchWithRetry";
import { logger } from "../../utils/logger";

const API_URL = "https://jsonplaceholder.typicode.com/users";

export async function getUsers() {
  const log = logger("usersAPI.getUsers");
  log.start();
  const response = await fetchWithRetry(API_URL);
  const data = await response.json();
  log.success({ count: data.length });
  return data;
}