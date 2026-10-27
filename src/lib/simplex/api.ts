const ACCESS_KEY = "simplex_access";

function getAccessCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = sessionStorage.getItem(ACCESS_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.code || "";
  } catch {
    return "";
  }
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsDataURL(file);
  });

export async function extractBriefFromPDF(file: File, accessCode?: string): Promise<{
  text: string;
  summary: string;
  topicsToPrioritize: string;
  languageToIncorporate: string;
  languageToAvoid: string;
}> {
  const base64 = await fileToBase64(file);
  const code = accessCode || getAccessCode();
  const res = await fetch("/api/parse-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, filename: file.name, accessCode: code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Brief parse failed (${res.status})`);
  return {
    text: data.text || "",
    summary: data.summary || "",
    topicsToPrioritize: data.topicsToPrioritize || "",
    languageToIncorporate: data.languageToIncorporate || "",
    languageToAvoid: data.languageToAvoid || "",
  };
}
