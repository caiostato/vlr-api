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

export { idGenerator };
