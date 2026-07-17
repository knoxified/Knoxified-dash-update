async function run() {
  const hosts = [
    "http://u4765o4uydirwvfvs4ynjz:3000/api/marketing-config",
    "http://u4765o4uydirwvfvs4ynjz-315935408739:3000/api/marketing-config",
  ];
  for (const h of hosts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const r = await fetch(h, { signal: controller.signal });
      clearTimeout(timeoutId);
      console.log(h, r.status);
    } catch (e) {
      console.log(h, e.message);
    }
  }
}
run();
