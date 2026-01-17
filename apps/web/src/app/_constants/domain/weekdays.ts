import { Weekday as PrismaWeekday } from "@prisma/client";

export type Weekday = PrismaWeekday;

export const WEEKDAYS: Weekday[] = [
  PrismaWeekday.Monday,
  PrismaWeekday.Tuesday,
  PrismaWeekday.Wednesday,
  PrismaWeekday.Thursday,
  PrismaWeekday.Friday,
  PrismaWeekday.Saturday,
  PrismaWeekday.Sunday,
];

export const WeekdayTranslation: Record<Weekday, string> = {
  [PrismaWeekday.Monday]: "Lundi",
  [PrismaWeekday.Tuesday]: "Mardi",
  [PrismaWeekday.Wednesday]: "Mercredi",
  [PrismaWeekday.Thursday]: "Jeudi",
  [PrismaWeekday.Friday]: "Vendredi",
  [PrismaWeekday.Saturday]: "Samedi",
  [PrismaWeekday.Sunday]: "Dimanche",
};
