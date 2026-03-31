import http from "../http-common";

// ---------------------------------------------------------------------------
// Contract: Every method returns an Axios Promise (i.e. Promise<AxiosResponse>).
//
// Shape expectations (server → client):
//   GET  /tutorials      → { data: Tutorial[] }
//   GET  /tutorials/:id  → { data: Tutorial }
//   POST /tutorials      → { data: Tutorial }  (created)
//   PUT  /tutorials/:id  → { data: Tutorial }  (updated)
//   DELETE /tutorials/:id → 200/204
//   DELETE /tutorials     → 200/204
//   GET  /tutorials?title=<query> → { data: Tutorial[] }
//
// Tutorial shape:
//   { id: number, title: string, description: string, published: boolean }
// ---------------------------------------------------------------------------

const getAll = () => {
  // EDGE: No pagination params — unbounded result set (see R6)
  return http.get("/tutorials");
};

const get = (id) => {
  // EDGE: Caller must guarantee `id` is a valid number/string.
  // Passing undefined produces GET /tutorials/undefined → likely 404.
  if (id == null) {
    return Promise.reject(new Error("TutorialService.get: id is required"));
  }
  return http.get(`/tutorials/${id}`);
};

const create = (data) => {
  // EDGE: No schema validation on `data`. If title or description is missing
  // the server may 400; caller sees an opaque Axios error.
  return http.post("/tutorials", data);
};

const update = (id, data) => {
  // EDGE: Same null-id risk as get()
  if (id == null) {
    return Promise.reject(new Error("TutorialService.update: id is required"));
  }
  return http.put(`/tutorials/${id}`, data);
};

const remove = (id) => {
  if (id == null) {
    return Promise.reject(new Error("TutorialService.remove: id is required"));
  }
  return http.delete(`/tutorials/${id}`);
};

const removeAll = () => {
  // EDGE(R4): Destructive — no guard here. UI must confirm before calling.
  return http.delete(`/tutorials`);
};

const findByTitle = (title) => {
  // EDGE: Empty string is technically valid but returns full set on most APIs.
  // Null/undefined would produce ?title=undefined in the query string.
  return http.get(`/tutorials?title=${encodeURIComponent(title || "")}`);
};

const TutorialService = {
  getAll,
  get,
  create,
  update,
  remove,
  removeAll,
  findByTitle
};

export default TutorialService;