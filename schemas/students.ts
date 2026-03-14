import { pgTable, integer, text} from "drizzle-orm/pg-core"
import { users } from "./users";

export const students = pgTable("students", {
	id: integer("id").primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
});