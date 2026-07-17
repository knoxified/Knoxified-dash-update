async function run() {
  try {
    const r = await fetch("https://knoxified.com/api/marketing-config");
    console.log(r.status);
    console.log(await r.text());
  } catch (e) {
    console.log(e);
  }
}
run();
