import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

function getAppUrl(req: Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ||
    (process.env["NODE_ENV"] === "production" ? "https" : "http");
  const host = req.get("host");
  return `${proto}://${host}`;
}

router.get("/auth/google/url", (req: Request, res: Response): void => {
  const clientId = process.env["VITE_GOOGLE_CLIENT_ID"];
  if (!clientId) {
    res
      .status(500)
      .json({ error: "VITE_GOOGLE_CLIENT_ID não configurada." });
    return;
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
