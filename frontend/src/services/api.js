const BASE_URL = "http://127.0.0.1:8000";

export const getDashboardRoot = () =>
  fetch(`${BASE_URL}/dashboard`).then(res => res.json());

export const getTMADashboard = (station) =>
  fetch(`${BASE_URL}/tma/dashboard?station=${encodeURIComponent(station)}`)
    .then(res => res.json());

export const getCHDashboard = (station) =>
  fetch(`${BASE_URL}/ch/dashboard?station=${encodeURIComponent(station)}`)
    .then(res => res.json());

export const getCHSidebar = () =>
  fetch(`${BASE_URL}/ch/sidebar`).then(res => res.json());

export const getStations = () =>
  fetch(`${BASE_URL}/stations`).then(res => res.json());

export const syncStations = () =>
  fetch(`${BASE_URL}/stations/sync`, { method: "POST" })
    .then(res => res.json());

export const updateStationStatus = () =>
  fetch(`${BASE_URL}/stations/update-status`, { method: "PUT" })
    .then(res => res.json());

export const cleanupRainfall = () =>
  fetch(`${BASE_URL}/stations/cleanup/rainfall`, { method: "DELETE" })
    .then(res => res.json());

export const cleanupTmaDuplicate = () =>
  fetch(`${BASE_URL}/stations/cleanup/tma-duplicate`, { method: "DELETE" })
    .then(res => res.json());