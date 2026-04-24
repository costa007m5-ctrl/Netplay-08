import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

router.post("/terabox/convert", async (req, res) => {
  const { url } = req.body ?? {};
  if (!url)
    return res.status(400).json({ error: "URL do TeraBox é obrigatória." });

  req.log.info({ url }, "Starting TeraBox conversion");

  if (typeof url === "string" && url.includes("player.kingx.dev/#")) {
    const hash = url.split("#")[1];
    if (hash) {
      const params = new URLSearchParams(hash);
      return res.json({
        success: true,
        directUrl: url,
        videoUrl: params.get("video_url")
          ? decodeURIComponent(params.get("video_url")!)
          : null,
        subtitleUrl: params.get("subtitle_url")
          ? decodeURIComponent(params.get("subtitle_url")!)
          : null,
      });
    }
  }

  try {
    const sources: Array<() => Promise<Record<string, string | null>>> = [
      async () => {
        const converterUrl = `https://www.teraboxdownloader.pro/p/fs.html?q=${encodeURIComponent(url)}&m=1`;
        const response = await axios.get(converterUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            Referer: "https://www.teraboxdownloader.pro/",
          },
          timeout: 10000,
        });
        const html: string = response.data;
        const kingxMatch = html.match(/https:\/\/player\.kingx\.dev\/#[^"']+/);
        const teradlMatch = html.match(/https:\/\/teradl\.kingx\.dev\/[^"']+/);

        if (kingxMatch || teradlMatch) {
          const directUrl = kingxMatch ? kingxMatch[0] : teradlMatch![0];
          if (teradlMatch && !kingxMatch) return { videoUrl: directUrl };
          const hash = directUrl.split("#")[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            return {
              directUrl,
              videoUrl: params.get("video_url")
                ? decodeURIComponent(params.get("video_url")!)
                : null,
              subtitleUrl: params.get("subtitle_url")
                ? decodeURIComponent(params.get("subtitle_url")!)
                : null,
            };
          }
          return { directUrl };
        }
        const m3u8Match = html.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
        if (m3u8Match) return { videoUrl: m3u8Match[0] };
        throw new Error("Padrão não encontrado no teraboxdownloader.pro");
      },
      async () => {
        const bypassUrl = `https://terabox-downloader.com/api/get-info?url=${encodeURIComponent(url)}`;
        try {
          const response = await axios.get(bypassUrl, { timeout: 8000 });
          if (response.data && response.data.stream_url) {
            return { videoUrl: response.data.stream_url };
          }
        } catch {
          /* swallow */
        }
        throw new Error("Falha no bypass secundário");
      },
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result && (result["videoUrl"] || result["directUrl"])) {
          req.log.info("TeraBox conversion succeeded");
          return res.json({ success: true, ...result });
        }
      } catch (e) {
        req.log.warn({ err: (e as Error).message }, "TeraBox source failed");
      }
    }

    res.status(404).json({
      error: "Não foi possível converter automaticamente.",
      details:
        "Todas as fontes de conversão falharam ou retornaram links inválidos.",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    req.log.error({ err }, "Critical error converting TeraBox");
    res.status(500).json({
      error: "Erro interno ao processar o link.",
      details: err.message,
    });
  }
});

export default router;
