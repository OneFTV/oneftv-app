import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEED_PATH = path.join(process.cwd(), 'LIVEFEED.md');

export async function GET() {
  try {
    const content = fs.readFileSync(FEED_PATH, 'utf-8');

    // Parse feed entries from the "## Feed" section
    const feedSection = content.split('## Feed')[1] || '';
    const lines = feedSection
      .split('\n')
      .filter(line => line.match(/^\[/))
      .reverse(); // newest first

    // Parse active tasks table
    const activeSection = content.split('## Active Tasks')[1]?.split('## Feed')[0] || '';
    const taskRows = activeSection
      .split('\n')
      .filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Agent'))
      .map(line => {
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        return { agent: cells[0], task: cells[1], started: cells[2] };
      })
      .filter(row => row.agent && row.agent !== '-');

    return NextResponse.json({
      entries: lines,
      activeTasks: taskRows,
      raw: content,
      lastUpdated: fs.statSync(FEED_PATH).mtime.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read feed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent, type, message, activeTask } = body;

    if (!agent || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: agent, type, message' },
        { status: 400 }
      );
    }

    const validTypes = ['STATUS', 'ERROR', 'QUESTION', 'DONE', 'BLOCKER', 'REQUEST', 'NOTE'];
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    let content = fs.readFileSync(FEED_PATH, 'utf-8');
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const entry = `[${timestamp}] [${agent.toUpperCase()}] [${type.toUpperCase()}] ${message}`;

    // Update active tasks table if activeTask is provided
    if (activeTask !== undefined) {
      const tableRegex = /(\| Agent \| Current Task \| Started \|\n\|[-|]+\|\n)([\s\S]*?)(\n---)/;
      const match = content.match(tableRegex);
      if (match) {
        const existingRows = match[2]
          .split('\n')
          .filter(line => line.startsWith('|'))
          .map(line => {
            const cells = line.split('|').filter(Boolean).map(c => c.trim());
            return { agent: cells[0], task: cells[1], started: cells[2], raw: line };
          });

        // Remove existing row for this agent
        const otherRows = existingRows.filter(
          r => r.agent?.toLowerCase() !== agent.toLowerCase() && r.agent !== '-'
        );

        // Add new row if activeTask is not empty
        if (activeTask) {
          otherRows.push({
            agent: agent,
            task: activeTask,
            started: timestamp.slice(0, 16),
            raw: '',
          });
        }

        const newRows =
          otherRows.length > 0
            ? otherRows.map(r => `| ${r.agent} | ${r.task} | ${r.started} |`).join('\n')
            : '| - | - | - |';

        content = content.replace(tableRegex, `$1${newRows}\n$3`);
      }
    }

    // Append to feed
    content = content.trimEnd() + '\n' + entry + '\n';

    fs.writeFileSync(FEED_PATH, content, 'utf-8');

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to write to feed', details: String(error) },
      { status: 500 }
    );
  }
}
