import "server-only";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

const objectUrl = (url: string, bucket: string, path: string) => `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;

export async function uploadStorageObject(bucket: string, path: string, data: Buffer, contentType: string) {
  const { url, headers } = config();
  const response = await fetch(objectUrl(url, bucket, path), { method: "POST", headers: { ...headers, "Content-Type": contentType, "x-upsert": "false" }, body: data });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status})`);
}

export async function downloadStorageObject(bucket: string, path: string): Promise<Buffer | null> {
  const { url, headers } = config();
  const response = await fetch(objectUrl(url, bucket, path), { headers, cache: "no-store" });
  return response.ok ? Buffer.from(await response.arrayBuffer()) : null;
}

export async function deleteStorageObject(bucket: string, path: string): Promise<void> {
  const { url, headers } = config();
  await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}`, { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) });
}
