async function run() {
  try {
    const r = await fetch("https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/marketing-config");
    console.log("Status:", r.status);
    console.log(await r.text());
  } catch (e) {
    console.log(e);
  }
}
run();
