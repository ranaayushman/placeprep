import "server-only";

/** Adds an opted-in student to the Brevo list. Best-effort: a Brevo outage must not break onboarding. */
export async function addToBrevo(email: string, name: string) {
  const key = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!key || !listId) return;
  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      // updateEnabled: an existing contact is added to the list instead of failing as a duplicate.
      body: JSON.stringify({ email, attributes: { FIRSTNAME: name.split(" ")[0] }, listIds: [listId], updateEnabled: true }),
    });
    if (!res.ok) console.error("[brevo] add contact failed:", res.status, await res.text());
  } catch (err) {
    console.error("[brevo] add contact failed:", err);
  }
}
