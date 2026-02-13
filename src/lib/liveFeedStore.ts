import { promises as fs } from "fs";
import path from "path";

export type FeedKind = "status" | "error" | "task" | "action" | "note";

export interface LiveFeedItem {
  id: string;
  author: string;
  kind: FeedKind;
  message: string;
  details?: string;
  actionRequired: boolean;
  actionOwner?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateFeedInput {
  author: string;
  kind: FeedKind;
  message: string;
  details?: string;
  actionRequired?: boolean;
  actionOwner?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FEED_FILE = path.join(DATA_DIR, "live-feed.json");

async function ensureFeedFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FEED_FILE);
  } catch {
    await fs.writeFile(FEED_FILE, "[]", "utf8");
  }
}

async function readRawFeed(): Promise<LiveFeedItem[]> {
  await ensureFeedFile();
  const raw = await fs.readFile(FEED_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as LiveFeedItem[];
  } catch {
    return [];
  }
}

async function writeRawFeed(items: LiveFeedItem[]) {
  await ensureFeedFile();
  const tmpFile = `${FEED_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmpFile, FEED_FILE);
}

export async function listFeed(): Promise<LiveFeedItem[]> {
  const items = await readRawFeed();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createFeedItem(input: CreateFeedInput): Promise<LiveFeedItem> {
  const items = await readRawFeed();
  const now = new Date().toISOString();

  const item: LiveFeedItem = {
    id: crypto.randomUUID(),
    author: input.author.trim(),
    kind: input.kind,
    message: input.message.trim(),
    details: input.details?.trim() || undefined,
    actionRequired: Boolean(input.actionRequired),
    actionOwner: input.actionOwner?.trim() || undefined,
    resolved: false,
    createdAt: now,
    updatedAt: now,
  };

  items.push(item);
  await writeRawFeed(items);
  return item;
}

export async function updateFeedItem(
  id: string,
  updater: (item: LiveFeedItem) => LiveFeedItem
): Promise<LiveFeedItem | null> {
  const items = await readRawFeed();
  const index = items.findIndex((entry) => entry.id === id);

  if (index < 0) {
    return null;
  }

  const updated = updater(items[index]);
  items[index] = { ...updated, updatedAt: new Date().toISOString() };

  await writeRawFeed(items);
  return items[index];
}
