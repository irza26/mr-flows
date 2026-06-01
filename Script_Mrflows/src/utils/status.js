export function getRainStatus(value) {
  const val = parseFloat(value);

  if (val === 0) {
    return {
      label: "Aman",
      emoji: "🟢",
      color: "#38a169",
      bg: "#f0fff4",
      border: "#c3e6cb",
      desc: "Cerah / Berawan"
    };
  }

  if (val > 0 && val < 5) {
    return {
      label: "Ringan",
      emoji: "🔵",
      color: "#4299e1",
      bg: "#ebf8ff",
      border: "#bee3f8",
      desc: "Hujan Ringan"
    };
  }

  if (val >= 5 && val < 10) {
    return {
      label: "Sedang",
      emoji: "🟡",
      color: "#d69e2e",
      bg: "#fefcbf",
      border: "#ffecb3",
      desc: "Hujan Sedang"
    };
  }

  if (val >= 10 && val < 20) {
    return {
      label: "Lebat",
      emoji: "🟠",
      color: "#ed8936",
      bg: "#fffaf0",
      border: "#feebc8",
      desc: "Hujan Lebat"
    };
  }

  return {
    label: "Sangat Lebat",
    emoji: "🔴",
    color: "#e53e3e",
    bg: "#fff5f5",
    border: "#ffcccc",
    desc: "Hujan Sangat Lebat"
  };
}

export function getTMAStatus(status) {
  switch (status) {
    case "Bahaya":
      return {
        label: "Bahaya",
        emoji: "🔴",
        color: "#e53e3e",
        bg: "#fff5f5"
      };

    case "Siaga":
      return {
        label: "Siaga",
        emoji: "🟠",
        color: "#f97316",
        bg: "#fff7ed"
      };

    case "Waspada":
      return {
        label: "Waspada",
        emoji: "🟡",
        color: "#d97706",
        bg: "#fffbeb"
      };

    default:
      return {
        label: "Aman",
        emoji: "🟢",
        color: "#38a169",
        bg: "#f0fff4"
      };
  }
}
