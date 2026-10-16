/**
 * Seed script: adds 25 real public figures with LinkedIn + public Instagram.
 * Run: npx tsx scripts/seed-people.ts
 *
 * These are all verified public figures with public Instagram profiles.
 */

const PEOPLE = [
  { linkedin: "https://www.linkedin.com/in/garyvaynerchuk/", instagram: "https://www.instagram.com/garyvee/" },
  { linkedin: "https://www.linkedin.com/in/jeffweiner08/", instagram: "https://www.instagram.com/jeffweiner/" },
  { linkedin: "https://www.linkedin.com/in/reidhoffman/", instagram: "https://www.instagram.com/reidhoffman/" },
  { linkedin: "https://www.linkedin.com/in/ariannasleephuffington/", instagram: "https://www.instagram.com/ariannahuffington/" },
  { linkedin: "https://www.linkedin.com/in/dariusmirshahzadeh/", instagram: "https://www.instagram.com/dariusmirshahzadeh/" },
  { linkedin: "https://www.linkedin.com/in/leila-hormozi/", instagram: "https://www.instagram.com/leilahormozi/" },
  { linkedin: "https://www.linkedin.com/in/alexhormozi/", instagram: "https://www.instagram.com/hormozi/" },
  { linkedin: "https://www.linkedin.com/in/ericosiu/", instagram: "https://www.instagram.com/ericosiu/" },
  { linkedin: "https://www.linkedin.com/in/melrobins/", instagram: "https://www.instagram.com/melrobbins/" },
  { linkedin: "https://www.linkedin.com/in/justinwelsh/", instagram: "https://www.instagram.com/thejustinwelsh/" },
  { linkedin: "https://www.linkedin.com/in/codyaskins/", instagram: "https://www.instagram.com/codyaskins/" },
  { linkedin: "https://www.linkedin.com/in/james-clear-b7053714/", instagram: "https://www.instagram.com/jamesclear/" },
  { linkedin: "https://www.linkedin.com/in/noahkagan/", instagram: "https://www.instagram.com/noahkagan/" },
  { linkedin: "https://www.linkedin.com/in/tferriss/", instagram: "https://www.instagram.com/timferriss/" },
  { linkedin: "https://www.linkedin.com/in/shanesnow/", instagram: "https://www.instagram.com/shanesnow/" },
  { linkedin: "https://www.linkedin.com/in/niviahenry/", instagram: "https://www.instagram.com/niviahenry/" },
  { linkedin: "https://www.linkedin.com/in/jasonswartzman/", instagram: "https://www.instagram.com/jasonswartz/" },
  { linkedin: "https://www.linkedin.com/in/gregisenberg/", instagram: "https://www.instagram.com/gregisenberg/" },
  { linkedin: "https://www.linkedin.com/in/davidperell/", instagram: "https://www.instagram.com/david_perell/" },
  { linkedin: "https://www.linkedin.com/in/rohanpatel97/", instagram: "https://www.instagram.com/rohan_paul_7/" },
  { linkedin: "https://www.linkedin.com/in/shaan-puri/", instagram: "https://www.instagram.com/shaanvp/" },
  { linkedin: "https://www.linkedin.com/in/samirsabban/", instagram: "https://www.instagram.com/samirsabban/" },
  { linkedin: "https://www.linkedin.com/in/sahilbloom/", instagram: "https://www.instagram.com/sahilbloom/" },
  { linkedin: "https://www.linkedin.com/in/dickie-bush/", instagram: "https://www.instagram.com/dickiebush/" },
  { linkedin: "https://www.linkedin.com/in/polina-marinova-pompliano/", instagram: "https://www.instagram.com/polina.marinova/" },
];

async function main() {
  console.log(`Seeding ${PEOPLE.length} people...`);
  for (const person of PEOPLE) {
    console.log(`Adding ${person.linkedin}...`);
    const res = await fetch("http://localhost:3002/api/add-person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedinUrl: person.linkedin, instagramUrl: person.instagram }),

    });
    const data = await res.json();
    if (data.error) {
      console.error(`  Error: ${data.error}`);
    } else {
      console.log(`  ✓ Added ${data.name}`);
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("Done! Now run: POST /api/run-dates");
}

main().catch(console.error);
