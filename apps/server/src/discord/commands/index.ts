import type { Command } from "./types";
import { projectCommand } from "./project";
import { serverCommand } from "./server";

export const commands: Command[] = [projectCommand, serverCommand];
