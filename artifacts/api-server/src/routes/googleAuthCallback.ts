import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";

const router: IRouter = Router();

function getAppUrl(req: Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ||
    (process.env["NODE_ENV"] === "production" ? "https" : "http");
  const host = req.get("host");
  return `${proto}://${host}`;
}

router.get(
  ["/auth/google/callback", "/auth/google/callback/"],
  async (req: Request, res: Response): Promise<void> => {
    const { code } = req.query;
    const redirectUri = `${getAppUrl(req)}/auth/google/callback`;

    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env["VITE_GOOGLE_CLIENT_ID"],
        client_secret: process.env["GOOGLE_CLIENT_SECRET"],
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      const { access_token, refresh_token, expires_in } = response.data;

      const userRes = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } },
      );
      const { email } = userRes.data;

      const accountData = {
        email,
        access_token,
        refresh_token,
        expiry_date: Date.now() + expires_in * 1000,
      };

      const allowedOrigin = getAppUrl(req);
      res.send(`
        <html>
          <body>
            <script>
              (function () {
                var TARGET_ORIGIN = ${JSON.stringify(allowedOrigin)};
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
                    payload: ${JSON.stringify(accountData)}
                  }, TARGET_ORIGIN);
                  window.close();
                } else {
                  window.location.href = '/';
                }
              })();
            </script>
            <p>Autenticação bem-sucedida! Você já pode fechar esta janela.</p>
          </body>
        </html>
      `);
    } catch (error) {
      req.log.error({ err: error }, "Google callback error");
      res.status(500).send("Erro na autenticação com o Google Drive.");
    }
  },
);

export default router;
