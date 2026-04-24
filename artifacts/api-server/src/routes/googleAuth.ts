import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

function getAppUrl(req: import("express").Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ||
    (process.env["NODE_ENV"] === "production" ? "https" : "http");
  const host = req.get("host");
  return `${proto}://${host}`;
}

router.get("/auth/google/url", (req, res) => {
  const clientId = process.env["VITE_GOOGLE_CLIENT_ID"];
  if (!clientId) {
    return res
      .status(500)
      .json({ error: "VITE_GOOGLE_CLIENT_ID não configurada." });
  }

  const redirectUri = `${getAppUrl(req)}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.json({ url: authUrl });
});

export default router;
