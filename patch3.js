const fs = require('fs');
const file = '/app/applet/app/(dashboard)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `"use client";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;
const rep1 = `"use client";\nimport { ActivityFeed } from "@/components/ActivityFeed";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;

const target1b = `"use client";\n\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;
const rep1b = `"use client";\n\nimport { ActivityFeed } from "@/components/ActivityFeed";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;

const target1c = `"use client";import { useState, useEffect } from "react";import { ArrowRight`;
const rep1c = `"use client";\nimport { ActivityFeed } from "@/components/ActivityFeed";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;

if (content.includes(target1)) {
  content = content.replace(target1, rep1);
  console.log("Patched target1");
} else if (content.includes(target1b)) {
  content = content.replace(target1b, rep1b);
  console.log("Patched target1b");
} else if (content.includes(target1c)) {
  content = content.replace(target1c, rep1c);
  console.log("Patched target1c");
} else {
  console.log("Targets not found, using regex");
  content = content.replace(/"use client";\s*(import { useState)/, '"use client";\nimport { ActivityFeed } from "@/components/ActivityFeed";\n$1');
}

fs.writeFileSync(file, content);
console.log("Done");
