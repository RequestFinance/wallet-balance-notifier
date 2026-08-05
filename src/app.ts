import { Application, Router } from "@oak/oak";
import { errorMiddleware } from "~/services/errors.ts";
import { run } from "~/services/wallets.ts";

const router = new Router();

router.get("/ping", (ctx) => {
  ctx.response.status = 204;
});

router.post("/run", async (ctx) => {
  await run();
  ctx.response.status = 204;
});

const app = new Application();
app.use(errorMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

export { app };
