import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

router.get("/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const apiKey = process.env["GOOGLE_DRIVE_API_KEY"];

  if (!apiKey || apiKey === "your_google_drive_api_key_here") {
    req.log.error("GOOGLE_DRIVE_API_KEY not configured");
    return res
      .status(500)
      .send(
        "Configuração Pendente: Adicione a GOOGLE_DRIVE_API_KEY nos Secrets.",
      );
  }

  try {
    let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

    const checkRes = await axios.get(url, {
      headers: { Range: "bytes=0-10" },
      timeout: 8000,
      validateStatus: () => true,
    });

    if (checkRes.status === 403) {
      const data = JSON.stringify(checkRes.data);
      if (data.includes("downloadQuotaExceeded")) {
        req.log.error({ fileId }, "Google Drive quota exceeded");
        return res.status(403).json({
          code: "QUOTA_EXCEEDED",
          message:
            "Este filme está muito popular hoje! O Google Drive limitou o streaming direto.",
        });
      }

      const confirmMatch = data.match(/confirm=([a-zA-Z0-9-_]+)/);
      if (confirmMatch) {
        url += `&confirm=${confirmMatch[1]}`;
      }
    }

    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
      headers: { Range: req.headers.range || "" },
      timeout: 60000,
    });

    if (response.status >= 400) {
      return res
        .status(response.status)
        .send(`Erro do Google Drive: ${response.status}`);
    }

    const headers: Record<string, string> = {
      "Accept-Ranges": "bytes",
      "Content-Type": response.headers["content-type"]?.includes("matroska")
        ? "video/webm"
        : response.headers["content-type"] || "video/mp4",
    };

    if (response.headers["content-length"])
      headers["Content-Length"] = response.headers["content-length"];
    if (response.headers["content-range"])
      headers["Content-Range"] = response.headers["content-range"];

    res.writeHead(response.status, headers);
    response.data.pipe(res);

    response.data.on("error", (err: Error) => {
      req.log.error({ err }, "Stream data error");
      res.end();
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: { error?: { message?: string } } };
      message?: string;
    };
    if (err.response) {
      req.log.error(
        { status: err.response.status, message: err.response.data?.error?.message },
        "Google API error",
      );
      res
        .status(err.response.status || 500)
        .send(
          `Erro no Google Drive: ${err.response.data?.error?.message || "Arquivo não encontrado ou sem permissão."}`,
        );
    } else {
      req.log.error({ err }, "Connection error to Google Drive");
      res.status(500).send("Erro ao conectar com o Google Drive.");
    }
  }
});

export default router;
