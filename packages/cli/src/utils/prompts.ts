/**
 * @file utils/prompts.ts
 * @description Interactive prompts using Node.js readline (no external deps).
 */

import { createInterface } from 'node:readline';

// ---------------------------------------------------------------------------
// Internal readline interface (lazy init)
// ---------------------------------------------------------------------------

let rl: ReturnType<typeof createInterface> | null = null;

function getRL(): ReturnType<typeof createInterface> {
  if (!rl) {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on('SIGINT', () => {
      console.log('\n\nAborted.');
      process.exit(1);
    });
  }
  return rl;
}

export function closePrompts(): void {
  rl?.close();
  rl = null;
}

// ---------------------------------------------------------------------------
// Low-level prompt
// ---------------------------------------------------------------------------

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    getRL().question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Public prompt helpers
// ---------------------------------------------------------------------------

/**
 * Prompt for a text value with an optional default.
 *
 * @param question - The question to display.
 * @param defaultValue - Used when the user submits an empty response.
 */
export async function promptText(question: string, defaultValue?: string): Promise<string> {
  const hint = defaultValue ? ` (${defaultValue})` : '';
  const answer = await ask(`  ${question}${hint}: `);
  if (!answer && defaultValue !== undefined) return defaultValue;
  if (!answer) return promptText(question, defaultValue);
  return answer;
}

/**
 * Prompt for confirmation (y/n).
 *
 * @param question - The question to display.
 * @param defaultValue - Default if user presses enter (true = y, false = n).
 */
export async function promptConfirm(question: string, defaultValue = true): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = await ask(`  ${question} [${hint}]: `);
  if (!answer) return defaultValue;
  return answer.toLowerCase().startsWith('y');
}

/**
 * Prompt for a single choice from a list.
 *
 * Displays numbered options and accepts a number input.
 *
 * @param question - The question to display.
 * @param choices - Array of { label, value } options.
 * @param defaultIndex - 0-based index of the default choice.
 */
export async function promptSelect<T extends string>(
  question: string,
  choices: Array<{ label: string; value: T; description?: string }>,
  defaultIndex = 0,
): Promise<T> {
  console.log(`\n  ${question}`);
  choices.forEach((c, i) => {
    const marker = i === defaultIndex ? '●' : '○';
    const desc = c.description ? `  — ${c.description}` : '';
    console.log(`    ${i + 1}) ${marker} ${c.label}${desc}`);
  });

  const answer = await ask(`\n  Enter choice [1-${choices.length}] (${defaultIndex + 1}): `);
  const n = parseInt(answer, 10);

  if (!answer) return choices[defaultIndex]!.value;
  if (isNaN(n) || n < 1 || n > choices.length) {
    console.log(`  Please enter a number between 1 and ${choices.length}.`);
    return promptSelect(question, choices, defaultIndex);
  }

  return choices[n - 1]!.value;
}

/**
 * Prompt for multiple choices from a list (comma-separated input).
 *
 * @param question - The question to display.
 * @param choices - Array of { label, value } options.
 */
export async function promptMultiSelect<T extends string>(
  question: string,
  choices: Array<{ label: string; value: T }>,
): Promise<T[]> {
  console.log(`\n  ${question}`);
  choices.forEach((c, i) => {
    console.log(`    ${i + 1}) ${c.label}`);
  });
  console.log(`    0) None`);

  const answer = await ask(`\n  Enter choices (e.g. 1,2 or 0 for none): `);

  if (!answer || answer === '0') return [];

  const selected: T[] = [];
  for (const part of answer.split(',')) {
    const n = parseInt(part.trim(), 10);
    if (!isNaN(n) && n >= 1 && n <= choices.length) {
      selected.push(choices[n - 1]!.value);
    }
  }

  return [...new Set(selected)];
}
