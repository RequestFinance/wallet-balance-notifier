import { isHttpError, Middleware } from "@oak/oak";

export const errorMiddleware: Middleware = async (context, next) => {
  const { response } = context;
  try {
    await next();
  } catch (error) {
    if (isHttpError(error)) {
      response.status = error.status;
      response.body = { error: error.message };
      response.type = "json";
      return;
    }
    console.error(error);
    response.status = 500;
  }
};
