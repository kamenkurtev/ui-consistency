import { describe, it, expect } from 'vitest';
import { shapeFor } from '../../src/cli/session.js';

describe('the shape a session hook answers in', () => {
  it('speaks Cursor to Cursor', () => {
    expect(shapeFor({ CURSOR_PLUGIN_ROOT: '/x' }, 'hello')).toEqual({ additional_context: 'hello' });
  });

  it('speaks Claude Code to Claude Code', () => {
    expect(shapeFor({ CLAUDE_PLUGIN_ROOT: '/x' }, 'hello')).toEqual({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: 'hello' },
    });
  });

  it('speaks the SDK shape to anything else, including Copilot', () => {
    // Copilot CLI sets CLAUDE_PLUGIN_ROOT as well, so the plugin root alone
    // cannot be the test.
    expect(shapeFor({ CLAUDE_PLUGIN_ROOT: '/x', COPILOT_CLI: '1' }, 'hi')).toEqual({
      additionalContext: 'hi',
    });
    expect(shapeFor({}, 'hi')).toEqual({ additionalContext: 'hi' });
  });

  it('says it once, never in two shapes at a time', () => {
    // Claude Code reads both `additional_context` and `hookSpecificOutput`
    // without deduplicating, so a hook that prints both says everything twice.
    for (const env of [{ CURSOR_PLUGIN_ROOT: '/x' }, { CLAUDE_PLUGIN_ROOT: '/x' }, {}]) {
      expect(Object.keys(shapeFor(env, 'hi'))).toHaveLength(1);
    }
  });
});
