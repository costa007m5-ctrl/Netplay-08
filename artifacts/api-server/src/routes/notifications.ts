import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

router.post("/notifications/send", async (req, res) => {
  const { title, message, imageUrl, data } = req.body ?? {};
  const appId =
    process.env["VITE_ONESIGNAL_APP_ID"] ||
    "581f23c1-2b57-4646-8780-6cd2ccbba30e";
  const restApiKey = process.env["ONESIGNAL_REST_API_KEY"];

  if (!restApiKey) {
    req.log.error("ONESIGNAL_REST_API_KEY not configured");
    return res.status(500).json({
      error:
        "Configuração Pendente: Adicione a ONESIGNAL_REST_API_KEY nos Secrets.",
    });
  }

  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: appId,
        included_segments: ["All"],
        headings: { en: title, pt: title },
        contents: { en: message, pt: message },
        big_picture: imageUrl,
        chrome_web_image: imageUrl,
        data: data || {},
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${restApiKey}`,
        },
      },
    );

    res.json({ success: true, data: response.data });
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    req.log.error(
      { details: err.response?.data || err.message },
      "OneSignal notification failed",
    );
    res.status(err.response?.status || 500).json({
      error: "Falha ao enviar notificação",
      details: err.response?.data || err.message,
    });
  }
});

export default router;
