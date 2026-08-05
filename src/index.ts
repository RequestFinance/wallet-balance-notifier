import { config } from "~/config.ts";
import { app } from "~/app.ts";

const bootstrap = () => {
  app.listen({ port: config.port });
  console.log(`App started. Listening on port: ${config.port}`);
  Deno.addSignalListener("SIGTERM", () => {
    console.log("Shutting down...");
  });
};
bootstrap();
