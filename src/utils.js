// src/utils.js
import Papa from "papaparse";

export function loadCSV(path) {
  return new Promise((resolve) => {
    Papa.parse(path, {
      header: true,
      download: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
    });
  });
}
