"use server";
import { InsertSubject, Subject, subjects } from "@/schemas/subjects";
import { db } from "@/utils/drizzle/db";

import { units, userSubjects } from "@/drizzle/schema";
import { eq, and, notInArray, asc, inArray } from "drizzle-orm";
import { Unit } from "@/schemas/units";
import { assertTeacher } from "@/lib/assertTeacher";

export const addSubject = async (subject: InsertSubject) => {
  await assertTeacher();
  return await db
    .insert(subjects)
    .values(subject)
    .returning({ id: subjects.id });
};

export const allSubjects = async () => {
  const data = await db
    .select()
    .from(subjects);
  return data;
};

export const allActiveSubjects = async () => {
  const data = await db
    .select()
    .from(subjects)
    .where(
      eq(subjects.active, true)
    );
  return data;
};

export const deleteSubject = async (id: number) => {
  await assertTeacher();
  await db
    .delete(subjects)
    .where(
      eq(subjects.id, id)
    );
};

export const updateSubject = async (id: number, subject: InsertSubject) => {
  await assertTeacher();
  return await db
    .update(subjects)
    .set({
      ...subject,
      updatedAt: new Date().toDateString(),
    })
    .where(
      eq(subjects.id, id)
    ).returning({ id: subjects.id });
};

export const getSubjects = async (userId: string): Promise<Subject[]> => {
  const data = await db
    .select()
    .from(subjects)
    .innerJoin(userSubjects, eq(subjects.id, userSubjects.subjectId))
    .where(
      eq(userSubjects.userId, userId)
    );

  const subjectList = data.map((item) => item.subjects);
  return subjectList;
}
export const getSubject = async (subjectId: number) => {
  try {

    const data = await db
      .select()
      .from(subjects)
      .leftJoin(units, eq(subjects.id, units.subjectId))
      .where(eq(subjects.id, subjectId))
      .orderBy(asc(units.id));

    if (!data.length) {
      throw new Error("Subject not found");
    }

    const result = data.reduce<Record<number, { subject: Subject; units: Unit[] }>>(
      (acc, row) => {
        const subject = row.subjects;
        const unit = row.units;
        if (!acc[subject.id]) {
          acc[subject.id] = { subject, units: [] };
        }
        if (unit) {
          acc[subject.id].units.push(unit);
        }
        return acc;
      },
      {}
    );
    const subject = Object.values(result).map((res) => ({ ...res.subject, units: res.units }))[0];

    return subject;

  } catch (error) {
    console.error(error);
    throw new Error("Subject not found");
  }
}

export const getActiveSubjects = async (userId: string) => {
  const data = await db
    .select({
      subjects
    })
    .from(subjects)
    .innerJoin(userSubjects, eq(subjects.id, userSubjects.subjectId))
    .where(
      and(
        eq(userSubjects.userId, userId),
        eq(subjects.active, true)
      )
    );

    const subjectList = data.map((item) => item.subjects);
    return subjectList;
}

export const getNotEnrolledSubjects = async (userId: string) => {
  const subQuery = db.select({ id: userSubjects.subjectId }).from(userSubjects).where(eq(userSubjects.userId, userId));

  const data = await db
  .select()
  .from(subjects)
  .where(
    and(
      notInArray(subjects.id, subQuery),
      eq(subjects.active, true)
    )
  );

  return data;
}
export const getEnrolledSubjects = async (userId: string) => {
  console.log("USERID", userId);
  const subQuery = db.select({ id: userSubjects.subjectId }).from(userSubjects).where(eq(userSubjects.userId, userId));
  console.log("SUBQUERY", subQuery);
  const data = await db
    .select()
    .from(subjects)
    .where(and(inArray(subjects.id, subQuery), eq(subjects.active, true)));

  console.log(
    "DATAA",
    data,
    "SUBQUERY",
    subQuery
  );

  return data;
}

export const enrollSubjects = async (userId: string, subjectIds: number[]) => {
  await Promise.all(subjectIds.map(subjectId =>
    db
      .insert(userSubjects)
      .values({
        userId,
        subjectId
      })
  ));
}

export const activateSubject = async (subjectId : number) => {
  await assertTeacher();
  await db
  .update(subjects)
  .set({active : true})
  .where(eq(subjects.id, subjectId));
}