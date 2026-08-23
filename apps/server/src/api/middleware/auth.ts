import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../db/prisma";

export interface AuthedRequest extends Request {
  serverId?: string;
}

/**
 * SDK가 보내는 Write Token을 검증한다.
 * 토큰 하나 = 등록된 Server 하나 (1:1) 이므로 별도 Project/Server ID를 요구하지 않는다.
 */
export async function requireWriteToken(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    res.status(401).json({ error: "missing write token" });
    return;
  }

  const server = await prisma.server.findUnique({ where: { writeToken: token } });
  if (!server) {
    res.status(401).json({ error: "invalid write token" });
    return;
  }

  req.serverId = server.id;
  next();
}
