async function run() {
  try {
    const res = await fetch("https://ais-dev-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/marketing-config", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const data = await res.text();
    console.log("DEV DATA:", data.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
  
  try {
    const res2 = await fetch("https://ais-pre-u4765o4uydirwvfvs4ynjz-315935408739.europe-west3.run.app/api/marketing-config");
    const data2 = await res2.text();
    console.log("PRE DATA:", data2.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
run();
