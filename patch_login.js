const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the Link for Bypass Login with a button that sets a cookie and then redirects
  const search = '<Link href="/" className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center mt-3 backdrop-blur-sm">Bypass Login (Dev Mode)</Link>';
  const replace = `<button type="button" onClick={() => { document.cookie = "bypass_login=true; path=/"; window.location.href = "/"; }} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center mt-3 backdrop-blur-sm">Bypass Login (Dev Mode)</button>`;
  
  content = content.replace(search, replace);
  
  fs.writeFileSync(file, content);
}

patch('/app/applet/app/login/page.tsx');
