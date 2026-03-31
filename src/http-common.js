import axios from "axios";

// TODO(R3): Move baseURL to REACT_APP_API_URL env var — hardcoded value
// couples every service to a single deployment target.
// See docs/RISK_REGISTER.md R3.
const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export default axios.create({
  baseURL: apiBase,
  headers: {
    "Content-type": "application/json"
  }
});