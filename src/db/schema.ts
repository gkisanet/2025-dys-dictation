import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stageId: text('stage_id').notNull(),
  operation: text('operation').notNull(),
  operandA: integer('operand_a').notNull(),
  operandB: integer('operand_b').notNull(),
  quizCorrect: integer('quiz_correct').notNull(),
  quizTotal: integer('quiz_total').notNull(),
  createdAt: integer('created_at').notNull(),
});
