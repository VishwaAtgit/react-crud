/**
 * Example: how to wire useObservability into any component.
 *
 *   import { useObservability } from "./useObservability";
 *
 *   function ItemList() {
 *     const { trace, metric, log } = useObservability("ItemList");
 *
 *     const fetchItems = async () => {
 *       log("INFO", "Fetching items");
 *       const items = await trace("fetchItems", () => fetch("/api/items").then(r => r.json()));
 *       metric("items_loaded", items.length, "count");
 *       return items;
 *     };
 *     ...
 *   }
 */
export {};