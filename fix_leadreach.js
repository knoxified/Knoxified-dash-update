const fs = require('fs');
let content = fs.readFileSync('app/automations/[id]/LeadReachBoard.tsx', 'utf8');

content = content.replace(
/<select[\s\S]*?value=\{formData\.country\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, country: e\.target\.value\}\)\}[\s\S]*?>\s*<option value="united states">United States<\/option>\s*<option value="united kingdom">United Kingdom<\/option>\s*<option value="canada">Canada<\/option>\s*<\/select>/m,
`<Select 
                    value={formData.country}
                    onChange={(val) => setFormData({...formData, country: val})}
                    options={[
                      { value: "united states", label: "United States" },
                      { value: "united kingdom", label: "United Kingdom" },
                      { value: "canada", label: "Canada" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{formData\.state\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, state: e\.target\.value\}\)\}[\s\S]*?>\s*<option value="california">California<\/option>\s*<option value="new york">New York<\/option>\s*<option value="texas">Texas<\/option>\s*<\/select>/m,
`<Select 
                    value={formData.state}
                    onChange={(val) => setFormData({...formData, state: val})}
                    options={[
                      { value: "california", label: "California" },
                      { value: "new york", label: "New York" },
                      { value: "texas", label: "Texas" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{formData\.seniority\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, seniority: e\.target\.value\}\)\}[\s\S]*?>\s*<option value="cxo">CXO \/ C-Level<\/option>\s*<option value="vp">Vice President<\/option>\s*<option value="director">Director<\/option>\s*<\/select>/m,
`<Select 
                    value={formData.seniority}
                    onChange={(val) => setFormData({...formData, seniority: val})}
                    options={[
                      { value: "cxo", label: "CXO / C-Level" },
                      { value: "vp", label: "Vice President" },
                      { value: "director", label: "Director" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{formData\.industry\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, industry: e\.target\.value\}\)\}[\s\S]*?>\s*<option value="software development">Software Development<\/option>\s*<option value="retail">Retail<\/option>\s*<option value="financial services">Financial Services<\/option>\s*<\/select>/m,
`<Select 
                    value={formData.industry}
                    onChange={(val) => setFormData({...formData, industry: val})}
                    options={[
                      { value: "software development", label: "Software Development" },
                      { value: "retail", label: "Retail" },
                      { value: "financial services", label: "Financial Services" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{formData\.size\}[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, size: e\.target\.value\}\)\}[\s\S]*?>\s*<option value="5">5 Leads<\/option>\s*<option value="10">10 Leads<\/option>\s*<option value="15">15 Leads<\/option>\s*<\/select>/m,
`<Select 
                    value={formData.size}
                    onChange={(val) => setFormData({...formData, size: val})}
                    options={[
                      { value: "5", label: "5 Leads" },
                      { value: "10", label: "10 Leads" },
                      { value: "15", label: "15 Leads" }
                    ]}
                  />`
);

fs.writeFileSync('app/automations/[id]/LeadReachBoard.tsx', content, 'utf8');
