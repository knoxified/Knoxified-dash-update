async function run() {
  const urls = [
    "https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/marketing-config",
    "https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/config",
    "https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/config.json",
    "https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/data.json",
    "https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/data",
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u);
      console.log(u, r.status);
      if (r.ok) {
        console.log(await r.text());
      }
    } catch (e) {
      console.log(u, "Failed");
    }
  }
}
run();
