import crypto from "crypto";

export function signCloudinaryUpload(folder: string): {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
} {
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");
  return { timestamp, signature, apiKey, cloudName };
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_id: publicId, timestamp, api_key: apiKey, signature }),
  });
}
