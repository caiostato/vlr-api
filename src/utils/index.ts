const idGenerator = function (id: string) {
  // Takes an id and returns a 16 character string of 0x000... + id
  try {
    if (!id.match(/^[0-9]+$/)) return "0";
    return id.padStart(15, "0");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.log(id);
    return "n/a";
  }
};

const cleanCountry = (country: string) => {
  try {
    country = country.split("\n")[2].replace(/[\n,\t]/g, "");
  } catch {
    country = "";
  }
  return country;
};
const cleanPhoto = (photo: string) => {
  if (photo === undefined) return "";
  if (photo.includes("owcdn.net")) photo = `https:${photo}`;
  else photo = "";
  return photo.replace(/[\n,\t]/g, "");
};

function cleanName(raw: string): string {
  return raw
    .replace(/\[[0-9]+\]/g, "") // Remove [ID]
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export { idGenerator, cleanCountry, cleanPhoto, cleanName };
