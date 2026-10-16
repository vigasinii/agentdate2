import { PersonProfile, DateConversation } from "./groq";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PEOPLE_FILE = path.join(DATA_DIR, "people.json");
const DATES_FILE = path.join(DATA_DIR, "dates.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getPeople(): PersonProfile[] {
  ensureDir();
  if (!fs.existsSync(PEOPLE_FILE)) return [];
  return JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf-8"));
}

export function savePeople(people: PersonProfile[]) {
  ensureDir();
  fs.writeFileSync(PEOPLE_FILE, JSON.stringify(people, null, 2));
}

export function addPerson(person: PersonProfile) {
  const people = getPeople();
  const idx = people.findIndex((p) => p.id === person.id);
  if (idx >= 0) people[idx] = person;
  else people.push(person);
  savePeople(people);
}

export function getDates(): DateConversation[] {
  ensureDir();
  if (!fs.existsSync(DATES_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATES_FILE, "utf-8"));
}

export function saveDates(dates: DateConversation[]) {
  ensureDir();
  fs.writeFileSync(DATES_FILE, JSON.stringify(dates, null, 2));
}

export function addDate(date: DateConversation) {
  const dates = getDates();
  const key = [date.personA, date.personB].sort().join("--");
  const idx = dates.findIndex((d) => [d.personA, d.personB].sort().join("--") === key);
  if (idx >= 0) dates[idx] = date;
  else dates.push(date);
  saveDates(dates);
}
